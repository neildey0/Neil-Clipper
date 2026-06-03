import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const publicDir = path.join(process.cwd(), 'public');
  const clips: string[] = [];

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        const ext = path.extname(fullPath).toLowerCase();
        if (['.mp4', '.mov', '.webm'].includes(ext)) {
          // Store relative path from public folder
          const relativePath = path.relative(publicDir, fullPath);
          // Convert windows backslashes to forward slashes for URLs
          clips.push(`/${relativePath.split(path.sep).join('/')}`);
        }
      }
    }
  }

  try {
    scanDir(publicDir);
    return NextResponse.json({ clips });
  } catch (error) {
    console.error('Error reading clips:', error);
    return NextResponse.json({ error: 'Failed to read clips directory' }, { status: 500 });
  }
}
