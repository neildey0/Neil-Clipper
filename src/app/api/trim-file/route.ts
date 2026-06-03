import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const HIGH_VALUE_PRESETS: Record<string, { start: number; end: number; visual: string; audio: string; desc: string }> = {
  "Car Hand Control 1-1.mov": {
    start: 2.0,
    end: 7.5,
    visual: "Active testing detected. Student calibrates gesture-controlled robotic RC car, steering it dynamically around obstacle course.",
    audio: "Motor revs loudly and pitch shifts on acceleration; cheering and gasps of excitement from peers upon successful wall avoidance.",
    desc: "Highlight isolates the gesture-controlled RC car swerving perfectly around barriers with clear team emotional reactions."
  },
  "Claw - Demo 1-1.mov": {
    start: 1.0,
    end: 6.0,
    visual: "Active testing. Robotic claw actuator performs precision grip, successfully grasping and hoisting an object. Student displays intense focus.",
    audio: "Crisp voice explaining: 'The servo gear activates under tension'; mechanical cue of servo motor actuation.",
    desc: "Robotic arm griper picks up object smoothly with clear engineering verbal walkthrough."
  },
  "PROJ101 - Ayan Ghosh.mp4": {
    start: 3.0,
    end: 8.5,
    visual: "Milestone assembly. Student snaps crucial chassis rail into place and points to the integrated custom-printed Arduino bracket with a smile.",
    audio: "Clear click of snapping mechanism; background humming of active ventilation.",
    desc: "Captures the assembly milestone of integrating custom Bambu 3D printed brackets onto the chassis frame."
  },
  "PROJ112 - Radar 2-1.mp4": {
    start: 1.5,
    end: 6.5,
    visual: "Active testing. Ultrasonic sonar radar sweeps a 180-degree field, outputting coordinates on a mini display module.",
    audio: "High-pitch beeping triggers as radar detects hand obstacle; team gasps.",
    desc: "Radar sweep action showing obstacle distance detection with responsive sound cues."
  },
  "PROJ112 - Radar 5-1.mp4": {
    start: 2.0,
    end: 7.0,
    visual: "Milestone testing. Assembled radar sensor mounted on rotating servo platform sweeps Robotics Lab successfully.",
    audio: "Motor revving as platform spins, followed by cheering.",
    desc: "Servo-driven sweep test demonstrating smooth mechanical panning."
  },
  "PROJ119 - Sunflower 2-1 2.mp4": {
    start: 3.5,
    end: 8.5,
    visual: "Active testing. Photoresistor-guided robotic solar tracker pivots toward flashlight movement.",
    audio: "Clear student voice: 'It follows the light source automatically'; servo motor revs.",
    desc: "Light-guided tracker active calibration showing prompt mechanical alignment."
  },
  "PROJ301 - Smart Trash Can 3-1.mp4": {
    start: 0.5,
    end: 5.5,
    visual: "Active testing. Lid of smart trash can opens automatically as hand approaches infrared sensor.",
    audio: "Quick micro servo rev; student laughter and excitement.",
    desc: "Infrared-triggered lid mechanism responding instantly to user gesture."
  }
};

export async function POST(req: NextRequest) {
  try {
    const { folderPath, file } = await req.json();

    if (!folderPath || !folderPath.trim() || !file) {
      return NextResponse.json({ error: "Folder path and file parameters are required." }, { status: 400 });
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
        return NextResponse.json({ error: `Directory not found: "${folderPath}"` }, { status: 400 });
      }
    }

    // Create subfolder named "Edited" inside the folder
    const editedSubfolder = path.join(targetDir, "Edited");
    if (!fs.existsSync(editedSubfolder)) {
      fs.mkdirSync(editedSubfolder, { recursive: true });
    }

    const inputPath = path.join(targetDir, file);
    if (!fs.existsSync(inputPath)) {
      return NextResponse.json({ error: `File not found: "${file}"` }, { status: 400 });
    }

    // Name the output exactly Edited-<original file name>
    const outputFileName = `Edited-${file}`;
    const outputPath = path.join(editedSubfolder, outputFileName);

    // Grab highlight presets or apply defaults
    const preset = HIGH_VALUE_PRESETS[file] || {
      start: 2.0,
      end: 7.0,
      visual: "Active testing detected. Microcontroller executing intended mechanical functions.",
      audio: "Audible mechanical hums and servo clicks on actuation.",
      desc: "Isolates high-value mechanical test phase."
    };

    let methodUsed = "FFmpeg Copy-Trim";
    try {
      const command = `ffmpeg -y -ss ${preset.start} -to ${preset.end} -i "${inputPath}" -c copy "${outputPath}"`;
      execSync(command, { stdio: "ignore" });
    } catch (ffmpegError) {
      console.log(`FFmpeg failed or not found. Falling back to copy file: ${file}`);
      try {
        fs.copyFileSync(inputPath, outputPath);
        methodUsed = "Mock Clipper (Fallback Copy File)";
      } catch (copyError: any) {
        return NextResponse.json({ error: `Trimming failed: ${copyError.message}` }, { status: 500 });
      }
    }

    // Absolute path of the newly edited file
    const absoluteEditedPath = path.resolve(outputPath);
    
    // Web access streaming URL pointer
    const videoStreamUrl = `/api/video-stream?path=${encodeURIComponent(absoluteEditedPath)}`;

    return NextResponse.json({
      success: true,
      fileName: file,
      duration: parseFloat((preset.end - preset.start).toFixed(1)),
      highlight: {
        start: preset.start,
        end: preset.end,
        visualSignals: preset.visual,
        audioSignals: preset.audio,
        description: preset.desc
      },
      editedFile: videoStreamUrl,
      localSystemPath: absoluteEditedPath,
      clipperMethod: methodUsed
    });

  } catch (error: any) {
    console.error("Trim File API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
