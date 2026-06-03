import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const EXPORTS_DIR = path.join(PUBLIC_DIR, "exports");
const PROPS_PATH = path.join(PUBLIC_DIR, "videoData.json");

export async function POST(req: NextRequest) {
  try {
    const videoData = await req.json();

    if (!videoData || !videoData.clips) {
      return NextResponse.json({ error: "Invalid videoData state" }, { status: 400 });
    }

    // Ensure props path and exports directory exist
    if (!fs.existsSync(EXPORTS_DIR)) {
      fs.mkdirSync(EXPORTS_DIR, { recursive: true });
    }

    // Write the state to videoData.json so remotion CLI reads it as --props
    fs.writeFileSync(PROPS_PATH, JSON.stringify(videoData, null, 2));
    console.log("videoData.json updated successfully for rendering.");

    // Format CLI command
    // We target "MyVideo", output to "public/exports/output.mp4", and use "src/index.ts" as entry.
    const command = `npx remotion render MyVideo public/exports/output.mp4 src/index.ts --props=public/videoData.json --overwrite`;
    console.log(`Executing render: ${command}`);

    return new Promise((resolve) => {
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        if (error) {
          console.error("Remotion render CLI failed:", error);
          console.error("Stderr:", stderr);
          resolve(
            NextResponse.json({
              success: false,
              error: error.message,
              stderr: stderr,
              stdout: stdout
            }, { status: 500 })
          );
          return;
        }

        console.log("Remotion render CLI succeeded!");
        console.log("Stdout:", stdout);

        resolve(
          NextResponse.json({
            success: true,
            filePath: "/exports/output.mp4",
            stdout: stdout
          })
        );
      });
    });

  } catch (error: any) {
    console.error("Render API Route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
