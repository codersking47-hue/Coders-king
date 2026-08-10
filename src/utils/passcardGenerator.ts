import { Project } from '../types';

export async function generatePasswordCardImage(
  project: Project,
  studioName: string = 'Apex Photography & Studio'
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Dark Premium Canvas Background
  const gradient = ctx.createLinearGradient(0, 0, 1200, 700);
  gradient.addColorStop(0, '#0a0a0d');
  gradient.addColorStop(0.5, '#12121c');
  gradient.addColorStop(1, '#08080a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 700);

  // Outer Golden Accent Border
  ctx.strokeStyle = '#f59e0b'; // Amber 500
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 640);

  // Inner Subtle Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(42, 42, 1116, 616);

  // Header Banner Text
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(studioName.toUpperCase(), 70, 95);

  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('OFFICIAL DIGITAL PHOTO GALLERY ACCESS PASSCARD', 70, 125);

  // Divider Line
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 150);
  ctx.lineTo(1130, 150);
  ctx.stroke();

  // Client Details Column
  // 1. Client Name
  ctx.fillStyle = '#6b7280';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('CLIENT NAME', 70, 195);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(project.customerName, 70, 230);

  // 2. Project / Event Title
  ctx.fillStyle = '#6b7280';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('EVENT / PROJECT', 70, 280);

  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(project.projectName, 70, 310);

  // 3. Expiry Date
  const formattedExpiry = new Date(project.expiryDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  ctx.fillStyle = '#6b7280';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('LINK VALID UNTIL', 70, 360);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(formattedExpiry, 70, 390);

  // 4. PASSWORD & SECURITY HIGHLIGHT BOX
  ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(70, 430, 580, 130, 18);
  } else {
    ctx.rect(70, 430, 580, 130);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('🔑 GALLERY ACCESS PASSWORD & SECURITY', 95, 465);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px monospace';
  const passText = project.password && project.password.trim()
    ? `PASSWORD: ${project.password}`
    : 'DIRECT ACCESS (NO PASSWORD REQUIRED)';
  ctx.fillText(passText, 95, 515);

  // Right Column: Embedded QR Code Container Box
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(720, 185, 380, 375, 24);
  } else {
    ctx.rect(720, 185, 380, 375);
  }
  ctx.fill();

  // Load and draw QR code onto canvas
  const qrImg = new Image();
  qrImg.crossOrigin = 'anonymous';
  await new Promise((resolve) => {
    qrImg.onload = resolve;
    qrImg.onerror = resolve;
    qrImg.src = `/api/qr/${project.token}`;
  });

  if (qrImg.complete && qrImg.naturalWidth !== 0) {
    ctx.drawImage(qrImg, 760, 210, 300, 300);
  }

  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN WITH CAMERA TO VIEW PHOTOS', 910, 535);

  // Bottom Footer Bar
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9ca3af';
  ctx.font = '13px monospace';
  const previewUrl = `${window.location.origin}/view/${project.token}`;
  ctx.fillText(`Direct URL: ${previewUrl}`, 70, 615);

  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Generated via Studio Portal • Proofing & Selection', 1130, 615);

  return canvas.toDataURL('image/png');
}

export function downloadPasswordCardImage(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
