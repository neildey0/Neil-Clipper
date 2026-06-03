import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { folderPath, text, selectedFiles } = await req.json();

    if (!folderPath || !folderPath.trim()) {
      return NextResponse.json({ error: "System folder path is required." }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Value proposition text is required." }, { status: 400 });
    }

    // Resolve directory path
    let targetDir = folderPath.trim();
    
    // Normalize path for Mac / Linux
    if (targetDir.startsWith("~")) {
      const homedir = require("os").homedir();
      targetDir = path.join(homedir, targetDir.slice(1));
    }

    // Try finding the directory absolute or relative to project root
    if (!fs.existsSync(targetDir)) {
      // Check if it exists under public/broll/
      const brollFallback = path.join(process.cwd(), "public", "broll", targetDir);
      const publicFallback = path.join(process.cwd(), "public", targetDir);
      
      if (fs.existsSync(brollFallback)) {
        targetDir = brollFallback;
      } else if (fs.existsSync(publicFallback)) {
        targetDir = publicFallback;
      } else {
        return NextResponse.json({ 
          error: `Directory path not found: "${folderPath}". Please ensure it is an absolute path on your Mac (e.g. /Users/username/Videos) or a valid subfolder.` 
        }, { status: 400 });
      }
    }

    // Scan directory for video files
    let videoFiles: string[] = [];
    if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
      videoFiles = selectedFiles;
    } else {
      const entries = fs.readdirSync(targetDir);
      videoFiles = entries.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === ".mp4" || ext === ".mov";
      });
    }

    if (videoFiles.length === 0) {
      return NextResponse.json({ 
        error: `No video files (.mp4 or .mov) found inside: "${targetDir}". Please check the folder contents.` 
      }, { status: 400 });
    }

    console.log(`Scanned directory successfully. Found ${videoFiles.length} video files.`);

    // -------------------------------------------------------------
    // Extract 3 Value Propositions from Pasted Text
    // -------------------------------------------------------------
    // Clean and split text into sentences
    const sentences = text
      .split(/[.!?\n]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 8); // remove tiny fragments

    const extractedSentences: string[] = [];

    // Select or generate 3 punchy sentences
    if (sentences.length >= 3) {
      // Take the first 3
      extractedSentences.push(sentences[0], sentences[1], sentences[2]);
    } else if (sentences.length === 2) {
      extractedSentences.push(
        sentences[0], 
        sentences[1],
        "Designed by real engineers for high-impact learning!"
      );
    } else if (sentences.length === 1) {
      extractedSentences.push(
        sentences[0],
        "Hands-on robotics kits and personalized 1:4 coaching ratios.",
        "Build, program, and take home everything you make!"
      );
    } else {
      // Fallback
      extractedSentences.push(
        "Experience the best hands-on engineering summer camp.",
        "Work with Arduinos, sensors, and Bambu 3D printers.",
        "Take home your customized robot creations today!"
      );
    }

    // Clean sentences by adding trailing periods
    const finalSentences = extractedSentences.map(s => {
      let cleaned = s.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) + ".";
    });

    // -------------------------------------------------------------
    // Synthesize Paced Word-by-Word Timestamps (Exactly 15s Total)
    // -------------------------------------------------------------
    const mockWords: any[] = [];
    const segmentDuration = 5.0; // 3 segments * 5.0s = 15s

    const apiSentences = finalSentences.map((sentenceText, idx) => {
      const startSec = idx * segmentDuration;
      const endSec = (idx + 1) * segmentDuration;
      
      const words = sentenceText.trim().split(/\s+/);
      const wordDuration = segmentDuration / words.length;

      words.forEach((word, wordIdx) => {
        const wordStart = startSec + wordIdx * wordDuration;
        const wordEnd = startSec + (wordIdx + 1) * wordDuration;
        
        mockWords.push({
          word,
          start: parseFloat(wordStart.toFixed(2)),
          end: parseFloat(wordEnd.toFixed(2))
        });
      });

      return {
        id: idx + 1,
        text: sentenceText,
        start: startSec,
        end: endSec,
        mappedFolder: path.basename(targetDir)
      };
    });

    // -------------------------------------------------------------
    // Map B-roll Clips (3 Clips * 5s = 15s total, 450 frames)
    // -------------------------------------------------------------
    // Determine path prefix for source loader
    // If it's a relative path in public/broll, keep it clean
    const relativePart = targetDir.includes("public/broll")
      ? `broll/${targetDir.split("public/broll/").pop()}`
      : targetDir.includes("public/")
        ? targetDir.split("public/").pop()
        : targetDir; // absolute path as fallback

    const clips: any[] = [];
    const FPS = 30;
    const clipFramesDuration = 150; // 5s * 30fps

    for (let idx = 0; idx < 3; idx++) {
      // Pick files in cycle
      const selectedFile = videoFiles[idx % videoFiles.length];
      const sourcePath = relativePart?.startsWith("broll/") || relativePart?.startsWith("audio/")
        ? `${relativePart}/${selectedFile}`
        : `broll/${path.basename(targetDir)}/${selectedFile}`; // default structure

      clips.push({
        source: sourcePath,
        startTrim: 30, // standard offset
        duration: clipFramesDuration,
        sequenceStart: idx * clipFramesDuration
      });
    }

    // Centralized videoData structure
    const videoData = {
      voiceOver: "upbeat-music.mp3", // Use background music as active audio timing
      transcript: mockWords,
      clips: clips,
      addSummerCampCTA: false
    };

    return NextResponse.json({
      success: true,
      sentences: apiSentences,
      videoData: videoData
    });

  } catch (error: any) {
    console.error("Generate Ad Ingestion Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
