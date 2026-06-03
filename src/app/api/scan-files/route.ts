import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { folderPath } = await req.json();

    if (!folderPath || !folderPath.trim()) {
      return NextResponse.json({ error: "System folder path is required." }, { status: 400 });
    }

    let targetDir = folderPath.trim();
    if (targetDir.startsWith("~")) {
      const homedir = require("os").homedir();
      targetDir = path.join(homedir, targetDir.slice(1));
    }

    if (!fs.existsSync(targetDir)) {
      const brollFallback = path.join(process.cwd(), "public", "broll", targetDir);
      const publicFallback = path.join(process.cwd(), "public", targetDir);
      
      if (fs.existsSync(brollFallback)) {
        targetDir = brollFallback;
      } else if (fs.existsSync(publicFallback)) {
        targetDir = publicFallback;
      } else {
        return NextResponse.json({ 
          error: `Directory path not found: "${folderPath}". Please verify it exists on your Mac.` 
        }, { status: 400 });
      }
    }

    const entries = fs.readdirSync(targetDir);
    const videoFiles = entries.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ext === ".mp4" || ext === ".mov";
    });

    return NextResponse.json({
      success: true,
      folderPath: targetDir,
      files: videoFiles
    });

  } catch (error: any) {
    console.error("Scan files API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
