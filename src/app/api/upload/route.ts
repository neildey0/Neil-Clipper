import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const AUDIO_DIR = path.join(PUBLIC_DIR, "audio");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure audio directory exists
    if (!fs.existsSync(AUDIO_DIR)) {
      fs.mkdirSync(AUDIO_DIR, { recursive: true });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const filePath = path.join(AUDIO_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const relativePath = `audio/${safeName}`;
    console.log(`VO File saved successfully: ${relativePath}`);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      filePath: relativePath,
      name: file.name
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
