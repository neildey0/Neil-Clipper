import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const fileUrl = new URL(req.url);
    const filePath = fileUrl.searchParams.get("path");

    if (!filePath) {
      return new NextResponse("Path parameter is required", { status: 400 });
    }

    // Resolve homedir path if starts with ~
    let resolvedPath = filePath;
    if (resolvedPath.startsWith("~")) {
      const homedir = require("os").homedir();
      resolvedPath = path.join(homedir, resolvedPath.slice(1));
    }

    if (!fs.existsSync(resolvedPath)) {
      console.error(`Stream file not found: ${resolvedPath}`);
      return new NextResponse("File not found", { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    // Determine contentType
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = ext === ".mov" ? "video/quicktime" : "video/mp4";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse("Range Not Satisfiable", {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(resolvedPath, { start, end });

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": contentType,
      };

      // Return partial content range response (206)
      return new NextResponse(fileStream as any, {
        status: 206,
        headers,
      });
    } else {
      const headers = {
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
      };
      
      const fileStream = fs.createReadStream(resolvedPath);
      return new NextResponse(fileStream as any, {
        status: 200,
        headers,
      });
    }
  } catch (error: any) {
    console.error("Video streaming API error:", error);
    return new NextResponse("Internal streaming error: " + error.message, { status: 500 });
  }
}
