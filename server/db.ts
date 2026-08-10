import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { Project, Photo, Album, DashboardStats } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const ORIGINALS_DIR = path.join(UPLOADS_DIR, 'originals');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(ORIGINALS_DIR)) fs.mkdirSync(ORIGINALS_DIR, { recursive: true });

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  studioName?: string;
  createdAt: string;
}

interface DatabaseSchema {
  studioName: string;
  adminPasswordHash: string; // Plain/hash for demo
  users: AdminUser[];
  projects: Project[];
}

const DEFAULT_DB: DatabaseSchema = {
  studioName: 'Apex Photography & Studio',
  adminPasswordHash: 'admin123',
  users: [
    {
      id: 'admin_1',
      name: 'Studio Admin',
      email: 'admin@apexstudio.com',
      passwordHash: 'admin123',
      studioName: 'Apex Photography & Studio',
      createdAt: new Date().toISOString()
    }
  ],
  projects: []
};

export function loadDB(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      saveDB(DEFAULT_DB);
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.users) {
      parsed.users = DEFAULT_DB.users;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to read DB file:', err);
    return DEFAULT_DB;
  }
}

export function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

export function generateToken(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate realistic sample photo buffers for demo/seed data
async function createSamplePhotoFile(
  filename: string,
  title: string,
  bgColor: string,
  accentColor: string
): Promise<string> {
  const filePath = path.join(ORIGINALS_DIR, filename);

  const safeTitle = escapeXml(title.toUpperCase());

  // Generate an elegant high-resolution photo SVG and convert to JPEG buffer with sharp
  const svg = `
    <svg width="1920" height="1280" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}" />
          <stop offset="50%" stop-color="${accentColor}" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="1.5" fill="#ffffff" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      <!-- Artistic camera lens aperture graphic -->
      <g transform="translate(960, 580)" opacity="0.25">
        <circle r="220" fill="none" stroke="#ffffff" stroke-width="4" />
        <circle r="180" fill="none" stroke="#ffffff" stroke-width="2" />
        <circle r="140" fill="none" stroke="#ffffff" stroke-width="1" />
        <polygon points="0,-180 156,90 -156,90" fill="none" stroke="#ffffff" stroke-width="3" />
        <polygon points="0,180 156,-90 -156,-90" fill="none" stroke="#ffffff" stroke-width="3" />
      </g>

      <!-- Photography Title Label -->
      <text x="960" y="600" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="52" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="4">
        ${safeTitle}
      </text>
      <text x="960" y="660" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="24" font-weight="400" fill="#f3f4f6" text-anchor="middle" opacity="0.8">
        HIGH RESOLUTION ORIGINAL • APEX STUDIO
      </text>
    </svg>
  `;

  // Always recreate or ensure valid image buffer
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toFile(filePath);

  return filePath;
}

// Seed sample photography project if database is empty
export async function seedIfEmpty() {
  const db = loadDB();
  if (db.projects.length > 0) return;

  console.log('Seeding initial photo projects...');

  const proj1Id = crypto.randomUUID();
  const proj1Token = '8FJ92K';

  // Create albums
  const albums: Album[] = [
    { id: crypto.randomUUID(), projectId: proj1Id, name: 'Haldi & Mehendi', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), projectId: proj1Id, name: 'Wedding Ceremony', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), projectId: proj1Id, name: 'Reception Gala', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), projectId: proj1Id, name: 'Couple Portraits', createdAt: new Date().toISOString() }
  ];

  const photosList: { albumIndex: number; title: string; bg: string; accent: string }[] = [
    // Haldi & Mehendi
    { albumIndex: 0, title: 'Haldi Ceremony - Ritual Moments', bg: '#d97706', accent: '#f59e0b' },
    { albumIndex: 0, title: 'Mehendi Design - Bride Hands', bg: '#059669', accent: '#10b981' },
    { albumIndex: 0, title: 'Haldi Smiles - Family Group', bg: '#ca8a04', accent: '#eab308' },
    { albumIndex: 0, title: 'Floral Decor & Celebrations', bg: '#b45309', accent: '#f59e0b' },
    
    // Wedding Ceremony
    { albumIndex: 1, title: 'Groom Baraat Arrival', bg: '#4338ca', accent: '#6366f1' },
    { albumIndex: 1, title: 'Bridal Entry - Varmala', bg: '#be123c', accent: '#f43f5e' },
    { albumIndex: 1, title: 'Varmala Exchange Moment', bg: '#9f1239', accent: '#e11d48' },
    { albumIndex: 1, title: 'Pheras & Sacred Rituals', bg: '#7c2d12', accent: '#c2410c' },
    { albumIndex: 1, title: 'Sindoor Ceremony', bg: '#881337', accent: '#f43f5e' },
    { albumIndex: 1, title: 'Blessings from Elders', bg: '#3730a3', accent: '#4f46e5' },

    // Reception Gala
    { albumIndex: 2, title: 'Grand Stage Entrance', bg: '#1e1b4b', accent: '#3b82f6' },
    { albumIndex: 2, title: 'First Dance as Couple', bg: '#311b92', accent: '#8b5cf6' },
    { albumIndex: 2, title: 'Cake Cutting Celebration', bg: '#4c1d95', accent: '#a855f7' },
    { albumIndex: 2, title: 'Family Toast & Speech', bg: '#1f2937', accent: '#6b7280' },

    // Couple Portraits
    { albumIndex: 3, title: 'Sunset Couple Portrait', bg: '#9a3412', accent: '#ea580c' },
    { albumIndex: 3, title: 'Royal Wedding Outfit Close-up', bg: '#831843', accent: '#db2777' },
    { albumIndex: 3, title: 'Candid Laughter Shot', bg: '#065f46', accent: '#059669' },
    { albumIndex: 3, title: 'Architectural Backdrop Pose', bg: '#1e293b', accent: '#475569' }
  ];

  const photos: Photo[] = [];
  for (let i = 0; i < photosList.length; i++) {
    const item = photosList[i];
    const filename = `seed_p1_${i + 1}.jpg`;
    await createSamplePhotoFile(filename, item.title, item.bg, item.accent);

    photos.push({
      id: crypto.randomUUID(),
      projectId: proj1Id,
      albumId: albums[item.albumIndex].id,
      filename: `Photo_${i + 1}.jpg`,
      originalPath: path.join(ORIGINALS_DIR, filename),
      mimeType: 'image/jpeg',
      size: 420000,
      width: 1920,
      height: 1280,
      createdAt: new Date().toISOString()
    });
  }

  // Future expiry date (30 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  const sampleProject1: Project = {
    id: proj1Id,
    customerName: 'Rahul & Priya Kumar',
    customerMobile: '+919876543210',
    projectName: 'Royal Wedding & Reception',
    projectDate: '2026-08-01',
    token: proj1Token,
    expiryDate: expiryDate.toISOString(),
    status: 'active',
    watermark: {
      enabled: true,
      text: 'APEX STUDIO • PREVIEW ONLY',
      position: 'repeated',
      opacity: 0.35,
      color: '#ffffff'
    },
    albums,
    photos,
    viewCount: 14,
    lastViewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  // Seed Second Project (Password Protected / Expired Demo option)
  const proj2Id = crypto.randomUUID();
  const proj2Token = 'XYZ789';
  const albums2: Album[] = [
    { id: crypto.randomUUID(), projectId: proj2Id, name: 'Pre-Wedding Shoot', createdAt: new Date().toISOString() }
  ];
  const photos2: Photo[] = [];
  for (let i = 0; i < 4; i++) {
    const filename = `seed_p2_${i + 1}.jpg`;
    await createSamplePhotoFile(filename, `Pre-Wedding Location ${i + 1}`, '#0284c7', '#38bdf8');
    photos2.push({
      id: crypto.randomUUID(),
      projectId: proj2Id,
      albumId: albums2[0].id,
      filename: `PreWedding_${i + 1}.jpg`,
      originalPath: path.join(ORIGINALS_DIR, filename),
      mimeType: 'image/jpeg',
      size: 380000,
      width: 1920,
      height: 1280,
      createdAt: new Date().toISOString()
    });
  }

  const sampleProject2: Project = {
    id: proj2Id,
    customerName: 'Ananya Sharma',
    customerMobile: '+919123456789',
    projectName: 'Pre-Wedding Highlights',
    projectDate: '2026-07-15',
    token: proj2Token,
    password: '1234', // password protected demo
    expiryDate: expiryDate.toISOString(),
    status: 'active',
    watermark: {
      enabled: true,
      text: 'PRE-WEDDING • CONFIDENTIAL PREVIEW',
      position: 'diagonal',
      opacity: 0.4,
      color: '#ffffff'
    },
    albums: albums2,
    photos: photos2,
    viewCount: 5,
    createdAt: new Date().toISOString()
  };

  db.projects = [sampleProject1, sampleProject2];
  saveDB(db);
  console.log('Seeded sample projects successfully!');
}

export { ORIGINALS_DIR };
