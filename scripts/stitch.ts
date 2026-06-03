import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log("Usage: npx ts-node scripts/stitch.ts clip1.mp4 clip2.mp4 ...");
  process.exit(1);
}

const FPS = 30;
const PUBLIC_DIR = path.join(__dirname, "../public");
const SRC_DIR = path.join(__dirname, "../src");
const OUT_DIR = path.join(__dirname, "../out");

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

const clips: { file: string; durationInFrames: number }[] = [];
const concatListPath = path.join(OUT_DIR, "concat_list.txt");
let concatListContent = "";

args.forEach((arg) => {
  const fileName = path.basename(arg);
  const destPath = path.join(PUBLIC_DIR, fileName);
  
  // Copy to public/
  fs.copyFileSync(arg, destPath);

  // Get duration
  const durationStr = execSync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${destPath}"`
  ).toString().trim();
  const durationSecs = parseFloat(durationStr);
  const durationInFrames = Math.round(durationSecs * FPS);

  clips.push({ file: fileName, durationInFrames });
  concatListContent += `file '${destPath}'\n`;
});

fs.writeFileSync(concatListPath, concatListContent);

// Concat
const outputPath = path.join(OUT_DIR, "stitched.mp4");
execSync(`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${outputPath}"`);

// Write clips.config.ts
const totalDuration = clips.reduce((acc, c) => acc + c.durationInFrames, 0);
const configContent = `export const FPS = ${FPS};
export const CLIPS = ${JSON.stringify(clips, null, 2)};
export const TOTAL_DURATION_IN_FRAMES = ${totalDuration};
`;

fs.writeFileSync(path.join(SRC_DIR, "clips.config.ts"), configContent);

console.log(`Stitched video saved to ${outputPath}`);
console.log(`Updated src/clips.config.ts with ${clips.length} clips.`);
