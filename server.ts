import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import {
  loadDB,
  saveDB,
  generateToken,
  seedIfEmpty,
  ORIGINALS_DIR
} from './server/db.js';
import { generateWatermarkedImage } from './server/watermark.js';
import { Photo, Album, Project } from './src/types.js';

const PORT = 3000;

// Setup multer storage for raw original photo uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ORIGINALS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `upload_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per photo
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

async function startServer() {
  // Ensure seed data exists
  await seedIfEmpty();

  const app = express();
  app.use(express.json());

  // Prevent caching for API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  });

  // ================= ADMIN AUTH & DASHBOARD ROUTES =================
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    const db = loadDB();

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check registered users first
    const matchedUser = db.users?.find(
      u => u.email.toLowerCase() === cleanEmail && u.passwordHash === cleanPassword
    );

    if (matchedUser) {
      return res.json({
        success: true,
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: 'admin',
          studioName: matchedUser.studioName || db.studioName
        },
        token: `token_${matchedUser.id}_${Date.now()}`
      });
    }

    // Default admin password check fallback
    if (cleanPassword === db.adminPasswordHash || cleanPassword === 'admin123') {
      return res.json({
        success: true,
        user: {
          id: 'admin_1',
          name: 'Studio Admin',
          email: cleanEmail || 'admin@apexstudio.com',
          role: 'admin',
          studioName: db.studioName
        },
        token: 'admin_session_token_12345'
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  });

  app.post('/api/admin/signup', (req, res) => {
    const { name, email, password, studioName } = req.body;
    const db = loadDB();

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    if (!password || password.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || 'Studio Owner').trim();
    const cleanStudio = (studioName || db.studioName || 'Apex Photography & Studio').trim();

    // Check if user already exists
    if (!db.users) db.users = [];
    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Account with this email already exists. Please Sign In.' });
    }

    const newUser = {
      id: `admin_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash: password.trim(),
      studioName: cleanStudio,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    db.studioName = cleanStudio; // Set as active studio name
    saveDB(db);

    return res.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: 'admin',
        studioName: newUser.studioName
      },
      token: `token_${newUser.id}_${Date.now()}`
    });
  });

  app.get('/api/admin/dashboard', (_req, res) => {
    const db = loadDB();
    const now = new Date();

    let totalPhotos = 0;
    let activeLinks = 0;
    let expiredLinks = 0;
    const customerMobiles = new Set<string>();

    db.projects.forEach(p => {
      totalPhotos += p.photos.length;
      if (p.customerMobile) customerMobiles.add(p.customerMobile);

      const isExpired = new Date(p.expiryDate) < now;
      if (p.status === 'active' && !isExpired) {
        activeLinks++;
      } else {
        expiredLinks++;
      }
    });

    res.json({
      studioName: db.studioName,
      stats: {
        totalProjects: db.projects.length,
        totalPhotos,
        activeLinks,
        expiredLinks,
        totalCustomers: customerMobiles.size,
        recentUploadsCount: totalPhotos
      },
      projects: db.projects
    });
  });

  app.post('/api/admin/seed-demo', async (_req, res) => {
    const db = loadDB();
    db.projects = [];
    saveDB(db);
    await seedIfEmpty();
    const updated = loadDB();
    res.json({ success: true, projects: updated.projects });
  });

  // Update Studio Name
  app.put('/api/admin/studio-settings', (req, res) => {
    const { studioName } = req.body;
    const db = loadDB();
    if (studioName) {
      db.studioName = studioName.trim();
      saveDB(db);
    }
    res.json({ success: true, studioName: db.studioName });
  });

  // Create New Project
  app.post('/api/admin/projects', (req, res) => {
    const {
      customerName,
      customerMobile,
      projectName,
      projectDate,
      expiryDays,
      password,
      watermarkText,
      watermarkPosition,
      watermarkOpacity
    } = req.body;

    const db = loadDB();
    const projectId = crypto.randomUUID();
    let token = generateToken(6);
    while (db.projects.some(p => p.token === token)) {
      token = generateToken(6);
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (parseInt(expiryDays) || 30));

    const defaultAlbum: Album = {
      id: crypto.randomUUID(),
      projectId,
      name: 'General Highlights',
      createdAt: new Date().toISOString()
    };

    const newProject: Project = {
      id: projectId,
      customerName: customerName || 'Valued Customer',
      customerMobile: customerMobile || '',
      projectName: projectName || 'Photo Preview',
      projectDate: projectDate || new Date().toISOString().split('T')[0],
      token,
      password: password ? password.trim() : undefined,
      expiryDate: expiryDate.toISOString(),
      status: 'active',
      watermark: {
        enabled: true,
        text: watermarkText || `${db.studioName} • PREVIEW ONLY`,
        position: watermarkPosition || 'repeated',
        opacity: parseFloat(watermarkOpacity) || 0.35,
        color: '#ffffff'
      },
      albums: [defaultAlbum],
      photos: [],
      viewCount: 0,
      createdAt: new Date().toISOString()
    };

    db.projects.unshift(newProject);
    saveDB(db);

    res.json({ success: true, project: newProject });
  });

  // Update Project Settings
  app.put('/api/admin/projects/:id', (req, res) => {
    const { id } = req.params;
    const db = loadDB();
    const project = db.projects.find(p => p.id === id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const {
      customerName,
      customerMobile,
      projectName,
      projectDate,
      expiryDate,
      status,
      password,
      watermark
    } = req.body;

    if (customerName) project.customerName = customerName;
    if (customerMobile !== undefined) project.customerMobile = customerMobile;
    if (projectName) project.projectName = projectName;
    if (projectDate) project.projectDate = projectDate;
    if (expiryDate) project.expiryDate = expiryDate;
    if (status) project.status = status;
    if (password !== undefined) project.password = password ? password.trim() : undefined;

    if (watermark) {
      project.watermark = {
        ...project.watermark,
        ...watermark
      };
    }

    saveDB(db);
    res.json({ success: true, project });
  });

  // Regenerate Project Token
  app.post('/api/admin/projects/:id/regenerate-token', (req, res) => {
    const { id } = req.params;
    const db = loadDB();
    const project = db.projects.find(p => p.id === id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    let newToken = generateToken(6);
    while (db.projects.some(p => p.token === newToken)) {
      newToken = generateToken(6);
    }
    project.token = newToken;
    saveDB(db);

    res.json({ success: true, token: newToken, project });
  });

  // Delete Project
  app.delete('/api/admin/projects/:id', (req, res) => {
    const { id } = req.params;
    const db = loadDB();
    const projectIndex = db.projects.findIndex(p => p.id === id);

    if (projectIndex !== -1) {
      const proj = db.projects[projectIndex];
      // Cleanup files
      proj.photos.forEach(p => {
        if (fs.existsSync(p.originalPath)) {
          try { fs.unlinkSync(p.originalPath); } catch (e) { /* ignore */ }
        }
      });
      db.projects.splice(projectIndex, 1);
      saveDB(db);
    }

    res.json({ success: true });
  });

  // Create Album
  app.post('/api/admin/projects/:id/albums', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const db = loadDB();
    const project = db.projects.find(p => p.id === id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const album: Album = {
      id: crypto.randomUUID(),
      projectId: id,
      name: name ? name.trim() : 'New Album',
      createdAt: new Date().toISOString()
    };

    project.albums.push(album);
    saveDB(db);

    res.json({ success: true, album, project });
  });

  // Delete Album
  app.delete('/api/admin/projects/:id/albums/:albumId', (req, res) => {
    const { id, albumId } = req.params;
    const db = loadDB();
    const project = db.projects.find(p => p.id === id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.albums = project.albums.filter(a => a.id !== albumId);
    // Unassign photos from this album
    project.photos.forEach(p => {
      if (p.albumId === albumId) p.albumId = undefined;
    });

    saveDB(db);
    res.json({ success: true, project });
  });

  // Upload Photos to Project
  app.post('/api/admin/projects/:id/photos', upload.array('photos', 100), (req, res) => {
    const { id } = req.params;
    const { albumId } = req.body;
    const files = req.files as Express.Multer.File[];

    const db = loadDB();
    const project = db.projects.find(p => p.id === id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }

    const newPhotos: Photo[] = files.map((file, index) => ({
      id: crypto.randomUUID(),
      projectId: id,
      albumId: albumId || (project.albums[0] ? project.albums[0].id : undefined),
      filename: file.originalname || `Photo_${project.photos.length + index + 1}.jpg`,
      originalPath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      createdAt: new Date().toISOString()
    }));

    project.photos.push(...newPhotos);
    saveDB(db);

    res.json({ success: true, photosAdded: newPhotos.length, project });
  });

  // Delete Photo from Project
  app.delete('/api/admin/projects/:id/photos/:photoId', (req, res) => {
    const { id, photoId } = req.params;
    const db = loadDB();
    const project = db.projects.find(p => p.id === id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const photoIndex = project.photos.findIndex(p => p.id === photoId);
    if (photoIndex !== -1) {
      const photo = project.photos[photoIndex];
      if (fs.existsSync(photo.originalPath)) {
        try { fs.unlinkSync(photo.originalPath); } catch (e) { /* ignore */ }
      }
      project.photos.splice(photoIndex, 1);
      saveDB(db);
    }

    res.json({ success: true, project });
  });

  // Reassign Photo to Album
  app.put('/api/admin/projects/:id/photos/:photoId/album', (req, res) => {
    const { id, photoId } = req.params;
    const { albumId } = req.body;
    const db = loadDB();
    const project = db.projects.find(p => p.id === id);

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const photo = project.photos.find(p => p.id === photoId);
    if (photo) {
      photo.albumId = albumId;
      saveDB(db);
    }

    res.json({ success: true, project });
  });

  // QR Code Endpoint
  app.get('/api/qr/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers.host;
      const previewUrl = `${protocol}://${host}/view/${token}`;

      const qrBuffer = await QRCode.toBuffer(previewUrl, {
        margin: 2,
        width: 320,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(qrBuffer);
    } catch (err) {
      console.error('Failed to generate QR:', err);
      res.status(500).send('QR Generation Error');
    }
  });

  // ================= CUSTOMER PREVIEW & DOWNLOAD PROTECTION ROUTES =================
  
  // Get Project Metadata for Customer Link
  app.get('/api/preview/data/:token', (req, res) => {
    const { token } = req.params;
    const db = loadDB();
    const project = db.projects.find(p => p.token === token);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Invalid preview token' });
    }

    const now = new Date();
    const isExpired = new Date(project.expiryDate) < now || project.status === 'disabled';

    // Increment view counter
    project.viewCount = (project.viewCount || 0) + 1;
    project.lastViewedAt = new Date().toISOString();
    saveDB(db);

    res.json({
      success: true,
      projectName: project.projectName,
      customerName: project.customerName,
      projectDate: project.projectDate,
      expiryDate: project.expiryDate,
      isExpired,
      requiresPassword: !!project.password,
      studioName: db.studioName,
      albums: project.albums,
      photos: isExpired
        ? []
        : project.photos.map(p => ({
            id: p.id,
            albumId: p.albumId,
            filename: p.filename
          })),
      watermarkText: project.watermark.text
    });
  });

  // Verify Password for Password-Protected Project
  app.post('/api/preview/verify-password/:token', (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const db = loadDB();
    const project = db.projects.find(p => p.token === token);

    if (!project) return res.status(404).json({ success: false, message: 'Invalid link' });

    if (!project.password || project.password === password?.trim()) {
      res.json({ success: true, verified: true });
    } else {
      res.status(401).json({ success: false, message: 'Incorrect access password' });
    }
  });

  // Protected Dynamic Image Viewer & Watermark Route
  // IMPORTANT: Original high-res image is NEVER exposed!
  app.get('/api/preview/image/:token/:photoId', async (req, res) => {
    try {
      const { token, photoId } = req.params;
      const { quality, pass } = req.query;

      const db = loadDB();
      const project = db.projects.find(p => p.token === token);

      if (!project) {
        return res.status(404).send('Not Found');
      }

      // Check Expiry
      const now = new Date();
      if (new Date(project.expiryDate) < now || project.status === 'disabled') {
        return res.status(403).send('Preview Link Expired');
      }

      // Check Password
      if (project.password && project.password !== pass) {
        return res.status(401).send('Password required');
      }

      const photo = project.photos.find(p => p.id === photoId);
      if (!photo || !fs.existsSync(photo.originalPath)) {
        return res.status(404).send('Photo not found');
      }

      // Determine size (thumbnail vs full preview)
      const targetWidth = quality === 'thumb' ? 420 : 1350;

      // Apply dynamic Sharp watermark
      const watermarkedBuffer = await generateWatermarkedImage(
        photo.originalPath,
        project.watermark,
        targetWidth
      );

      // Set download protection headers
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(watermarkedBuffer);

    } catch (err) {
      console.error('Error serving watermarked image:', err);
      res.status(500).send('Error rendering preview image');
    }
  });

  // ================= VITE DEV / PROD SERVING =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
