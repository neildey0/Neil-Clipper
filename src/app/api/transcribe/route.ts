import { NextRequest, NextResponse } from "next/server";

// Structure of our mock high-fidelity transcript
const MOCK_WORDS = [
  // Sentence 1 (0.0s to 3.6s): "We are building an autonomous Arduino RC Car."
  { word: "We", start: 0.0, end: 0.4 },
  { word: "are", start: 0.4, end: 0.7 },
  { word: "building", start: 0.7, end: 1.2 },
  { word: "an", start: 1.2, end: 1.4 },
  { word: "autonomous", start: 1.4, end: 2.1 },
  { word: "Arduino", start: 2.1, end: 2.8 },
  { word: "RC", start: 2.8, end: 3.1 },
  { word: "Car.", start: 3.1, end: 3.6 },

  // Sentence 2 (3.9s to 8.1s): "First, we printed a custom chassis on our Bambu 3D printer."
  { word: "First,", start: 3.9, end: 4.3 },
  { word: "we", start: 4.3, end: 4.6 },
  { word: "printed", start: 4.6, end: 5.1 },
  { word: "a", start: 5.1, end: 5.3 },
  { word: "custom", start: 5.3, end: 5.8 },
  { word: "chassis", start: 5.8, end: 6.3 },
  { word: "on", start: 6.3, end: 6.5 },
  { word: "our", start: 6.5, end: 6.7 },
  { word: "Bambu", start: 6.7, end: 7.2 },
  { word: "3D", start: 7.2, end: 7.5 },
  { word: "printer.", start: 7.5, end: 8.1 },

  // Sentence 3 (8.4s to 12.6s): "Then, we tested the smart claw inside our robotics lab."
  { word: "Then,", start: 8.4, end: 8.8 },
  { word: "we", start: 8.8, end: 9.1 },
  { word: "tested", start: 9.1, end: 9.6 },
  { word: "the", start: 9.6, end: 9.8 },
  { word: "smart", start: 9.8, end: 10.2 },
  { word: "claw", start: 10.2, end: 10.7 },
  { word: "inside", start: 10.7, end: 11.2 },
  { word: "our", start: 11.2, end: 11.4 },
  { word: "robotics", start: 11.4, end: 12.0 },
  { word: "lab.", start: 12.0, end: 12.6 }
];

// Helper to auto-map based on keywords in sentence text
export function autoMapFolder(sentenceText: string): string {
  const normalized = sentenceText.toLowerCase();
  if (normalized.includes("arduino") || normalized.includes("car")) {
    return "Arduino RC Car";
  }
  if (normalized.includes("bambu") || normalized.includes("3d") || normalized.includes("print")) {
    return "Bambu 3D Printing";
  }
  if (normalized.includes("robotics") || normalized.includes("lab") || normalized.includes("claw")) {
    return "Robotics Lab";
  }
  return "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const voiceOverPath = body.voiceOver || "audio/voiceover.mp3";

    // Build the sentence structures dynamically from the words
    const sentences = [
      {
        id: 1,
        text: "We are building an autonomous Arduino RC Car.",
        start: 0.0,
        end: 3.6,
        mappedFolder: "Arduino RC Car"
      },
      {
        id: 2,
        text: "First, we printed a custom chassis on our Bambu 3D printer.",
        start: 3.9,
        end: 8.1,
        mappedFolder: "Bambu 3D Printing"
      },
      {
        id: 3,
        text: "Then, we tested the smart claw inside our robotics lab.",
        start: 8.4,
        end: 12.6,
        mappedFolder: "Robotics Lab"
      }
    ];

    // For each word, we can assign a mappedFolder based on its sentence
    const enrichedWords = MOCK_WORDS.map(w => {
      let mappedFolder = "";
      if (w.start <= 3.6) mappedFolder = "Arduino RC Car";
      else if (w.start <= 8.1) mappedFolder = "Bambu 3D Printing";
      else mappedFolder = "Robotics Lab";

      return {
        ...w,
        mappedFolder
      };
    });

    return NextResponse.json({
      text: sentences.map(s => s.text).join(" "),
      voiceOver: voiceOverPath,
      sentences: sentences,
      words: enrichedWords
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
