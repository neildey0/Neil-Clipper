import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const videoPath = process.argv[2];
const offset = parseFloat(process.argv[3] || "0");

if (!videoPath) {
  console.log("Usage: npx ts-node scripts/transcribe.ts <video-path> [offset-secs]");
  process.exit(1);
}

const PUBLIC_DIR = path.join(__dirname, "../public");
const audioPath = path.join(PUBLIC_DIR, "temp_audio.mp3");
const transcriptPath = path.join(PUBLIC_DIR, "transcript.json");

console.log("Extracting audio...");
execSync(
  `ffmpeg -y -i "${videoPath}" -ar 16000 -ac 1 -c:a libmp3lame "${audioPath}"`
);

const pythonScript = `
import json
from faster_whisper import WhisperModel

model_size = "base"
model = WhisperModel(model_size, device="cpu", compute_type="int8")

segments, info = model.transcribe("${audioPath}", word_timestamps=True)

words_list = []
for segment in segments:
    for word in segment.words:
        words_list.append({
            "word": word.word.strip(),
            "start": word.start + ${offset},
            "end": word.end + ${offset}
        })

print(json.dumps(words_list))
`;

console.log("Transcribing with Whisper (this may take a moment)...");
const pythonOutput = execSync(`python3 -c '${pythonScript}'`).toString();
const newWords = JSON.parse(pythonOutput);

let transcript = { fps: 30, words: [] as any[] };
if (fs.existsSync(transcriptPath) && offset > 0) {
  transcript = JSON.parse(fs.readFileSync(transcriptPath, "utf-8"));
}

transcript.words = [...transcript.words, ...newWords];
// Sort words by start time just in case
transcript.words.sort((a, b) => a.start - b.start);

fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));
fs.unlinkSync(audioPath);

console.log(`Transcription completed. Saved to ${transcriptPath}`);
