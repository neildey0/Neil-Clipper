import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Define the root of the B-roll directory
const PUBLIC_DIR = path.join(process.cwd(), "public");
const BROLL_DIR = path.join(PUBLIC_DIR, "broll");

// Setup default folders and seed videos if not present
function seedFoldersIfMissing() {
  const folders = {
    "Arduino RC Car": [
      "Car Hand Control 1-1.mov",
      "PROJ301 - Smart Trash Can 3-1.mp4"
    ],
    "Bambu 3D Printing": [
      "PROJ101 - Ayan Ghosh.mp4",
      "PROJ112 - Radar 2-1.mp4"
    ],
    "Robotics Lab": [
      "Claw - Demo 1-1.mov",
      "PROJ119 - Sunflower 2-1 2.mp4",
      "PROJ112 - Radar 5-1.mp4"
    ]
  };

  if (!fs.existsSync(BROLL_DIR)) {
    fs.mkdirSync(BROLL_DIR, { recursive: true });
  }

  for (const [folderName, files] of Object.entries(folders)) {
    const folderPath = path.join(BROLL_DIR, folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    for (const fileName of files) {
      const sourcePath = path.join(PUBLIC_DIR, fileName);
      const destPath = path.join(folderPath, fileName);

      // If the file exists in public/ but not in the subfolder, copy it
      if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
        try {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`Successfully seeded: ${fileName} to ${folderName}`);
        } catch (e) {
          console.error(`Failed to copy ${fileName} to ${folderName}:`, e);
        }
      }
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    // Seed folders on the first GET call to ensure perfect local experience
    seedFoldersIfMissing();

    if (!fs.existsSync(BROLL_DIR)) {
      return NextResponse.json({ folders: [] });
    }

    const entries = fs.readdirSync(BROLL_DIR, { withFileTypes: true });
    const foldersData = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const folderPath = path.join(BROLL_DIR, entry.name);
        const files = fs.readdirSync(folderPath)
          .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === ".mp4" || ext === ".mov";
          });

        foldersData.push({
          name: entry.name,
          files: files
        });
      }
    }

    return NextResponse.json({ folders: foldersData });
  } catch (error: any) {
    console.error("Error reading B-roll folders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
