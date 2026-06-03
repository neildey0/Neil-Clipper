import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { inputPath, startTime, endTime, outputName } = await req.json();

    if (!inputPath || startTime === undefined || endTime === undefined || !outputName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
    }

    // Resolve input path to absolute path
    let absoluteInputPath = inputPath;
    if (!path.isAbsolute(inputPath)) {
      absoluteInputPath = path.join(process.cwd(), "public", inputPath);
    }

    if (!fs.existsSync(absoluteInputPath)) {
      return NextResponse.json({ error: `Input file not found at ${absoluteInputPath}` }, { status: 404 });
    }

    const exportedDir = path.join(process.cwd(), "public", "ExportedClips");
    if (!fs.existsSync(exportedDir)) {
      fs.mkdirSync(exportedDir, { recursive: true });
    }

    // Ensure outputName has extension (assume .mp4 if missing)
    let finalOutputName = outputName;
    if (!path.extname(finalOutputName)) {
      finalOutputName += ".mp4";
    }

    const absoluteOutputPath = path.join(exportedDir, finalOutputName);

    // Run FFmpeg stream copy
    const command = `ffmpeg -y -ss ${startTime} -to ${endTime} -i "${absoluteInputPath}" -c copy "${absoluteOutputPath}"`;
    execSync(command, { stdio: "ignore" });

    return NextResponse.json({
      success: true,
      exportedPath: `/ExportedClips/${finalOutputName}`,
      duration: parseFloat((endTime - startTime).toFixed(2))
    });

  } catch (error: any) {
    console.error("Manual Trim API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
