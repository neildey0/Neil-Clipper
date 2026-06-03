import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { clip, start, end, aspectRatio, filePrefix } = data;

    if (!clip || start === undefined || end === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const outDir = path.join(process.cwd(), 'out');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Clip path is relative to public folder (e.g., /broll/video.mp4 or /video.mp4)
    // We need to decode it and strip the leading slash if it exists
    const decodedClip = decodeURIComponent(clip);
    const cleanClipPath = decodedClip.startsWith('/') ? decodedClip.slice(1) : decodedClip;
    const inputFilePath = path.join(process.cwd(), 'public', cleanClipPath);
    
    if (!fs.existsSync(inputFilePath)) {
       return NextResponse.json({ error: `Input file not found: ${cleanClipPath}` }, { status: 404 });
    }

    const prefix = filePrefix ? `${filePrefix.trim()}_` : 'trim_';
    const fileName = `${prefix}${path.basename(clip).replace(/\.[^/.]+$/, '')}_${aspectRatio ? aspectRatio.replace(':', 'x') : 'original'}_${Date.now()}.mp4`;
    const outputPath = path.join(outDir, fileName);

    const duration = end - start;

    let vfFilter = "";
    if (aspectRatio === "16:9") {
      // Scale to cover 1920x1080, then center crop exactly 1920x1080
      vfFilter = `-vf "scale='max(1920,iw*1080/ih)':'max(1080,ih*1920/iw)',crop=1920:1080"`;
    } else if (aspectRatio === "9:16") {
      // Scale to cover 1080x1920, then center crop exactly 1080x1920
      vfFilter = `-vf "scale='max(1080,iw*1920/ih)':'max(1920,ih*1080/iw)',crop=1080:1920"`;
    }

    // Use FFmpeg to trim the video
    // -ss for start time, -t for duration.
    // -crf 18 preserves very high visual quality, -b:a 192k preserves audio quality
    // Output is always forced to .mp4
    const command = `ffmpeg -ss ${start} -i "${inputFilePath}" -t ${duration} ${vfFilter} -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k "${outputPath}"`;
    
    await execAsync(command);

    return NextResponse.json({ success: true, message: 'Trim exported successfully', file: fileName });
  } catch (error) {
    console.error('Error exporting trim:', error);
    return NextResponse.json({ error: 'Failed to export trim using FFmpeg' }, { status: 500 });
  }
}
