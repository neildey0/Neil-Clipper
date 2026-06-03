import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
}

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
       return NextResponse.json({ success: true, media: [] });
    }
    const allFiles = getAllFiles(publicDir);

    const mediaFiles = allFiles
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return [".mp4", ".mov", ".png", ".jpg", ".jpeg", ".mp3", ".wav"].includes(ext);
      })
      .map((file) => {
        // Return path relative to public/
        let relativePath = file.replace(publicDir, "").replace(/\\/g, "/");
        if (relativePath.startsWith("/")) {
          relativePath = relativePath.slice(1);
        }
        
        const ext = path.extname(file).toLowerCase();
        let type = "video";
        if ([".png", ".jpg", ".jpeg"].includes(ext)) type = "image";
        if ([".mp3", ".wav"].includes(ext)) type = "audio";

        return {
          path: relativePath,
          name: path.basename(file),
          type
        };
      });

    return NextResponse.json({ success: true, media: mediaFiles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
