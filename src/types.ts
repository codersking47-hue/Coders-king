export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  studioName?: string;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  position: 'center' | 'diagonal' | 'repeated';
  opacity: number; // 0.1 to 0.9
  color: string;
}

export interface Album {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  projectId: string;
  albumId?: string;
  filename: string;
  originalPath: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

export interface Project {
  id: string;
  customerName: string;
  customerMobile: string;
  projectName: string;
  projectDate: string;
  token: string; // e.g. 8FJ92K
  password?: string;
  expiryDate: string; // ISO date string
  status: 'active' | 'disabled';
  watermark: WatermarkConfig;
  albums: Album[];
  photos: Photo[];
  viewCount: number;
  lastViewedAt?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalPhotos: number;
  activeLinks: number;
  expiredLinks: number;
  totalCustomers: number;
  recentUploadsCount: number;
}

export interface CreateProjectPayload {
  customerName: string;
  customerMobile: string;
  projectName: string;
  projectDate: string;
  expiryDays: number;
  password?: string;
  watermarkText?: string;
  watermarkPosition?: 'center' | 'diagonal' | 'repeated';
  watermarkOpacity?: number;
}

export interface CustomerPreviewData {
  projectName: string;
  customerName: string;
  projectDate: string;
  expiryDate: string;
  isExpired: boolean;
  requiresPassword: boolean;
  isPasswordVerified: boolean;
  studioName: string;
  albums: Album[];
  photos: {
    id: string;
    albumId?: string;
    filename: string;
  }[];
  watermarkText: string;
}
