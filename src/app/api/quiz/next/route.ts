import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { excludeIds } = await req.json();

    // Fetch ALL words to use as distractors
    const allWords = await prisma.word.findMany();
    const availableWords = allWords.filter(w => !(excludeIds || []).includes(w.id));

    if (availableWords.length === 0) {
      return NextResponse.json(
        { error: "No more words available for the quiz." },
        { status: 400 }
      );
    }

    // Pick 1 random target word
    const targetWord = availableWords[Math.floor(Math.random() * availableWords.length)];

    // Get 10 random other words from the DB to use as potential distractors
    const otherWords = allWords.filter(w => w.id !== targetWord.id).sort(() => 0.5 - Math.random()).slice(0, 10);
    const distractorsList = otherWords.map(w => `${w.word} (${w.translation || "no translation"})`).join(", ");

    const prompt = `You are an English teacher generating a multiple-choice quiz.
Generate EXACTLY ONE question for the following target word.
Target Word: ${targetWord.word}
Pronunciation: ${targetWord.pronunciation || ""}
Translation: ${targetWord.translation || ""}

Randomly choose ONE of these 3 types of questions:
1. "en-zh": Ask for the Chinese translation of the English word.
2. "zh-en": Ask for the English word given the Chinese translation.
3. "sentence": Provide an English sentence with the target word replaced by "_____".

You MUST provide exactly 4 options. ONE option must be the correct answer.
CRITICAL: The other 3 options MUST be plausible distractors selected ONLY from this list of words (to make the test harder, as they are alphabetically similar):
[ ${distractorsList} ]

Return STRICTLY a JSON object. Do not include markdown formatting or any other text.
Format:
{
  "id": "${targetWord.id}",
  "question": "The question text",
  "options": [
    {"id": "A", "text": "Option 1"},
    {"id": "B", "text": "Option 2"},
    {"id": "C", "text": "Option 3"},
    {"id": "D", "text": "Option 4"}
  ],
  "correctOptionId": "A",
  "pronunciation": "${targetWord.pronunciation || ""}"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    const question = JSON.parse(responseText);

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Generate Next Quiz Question Error:", error);
    return NextResponse.json(
      { error: "Failed to generate next question" },
      { status: 500 }
    );
  }
}
