import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET() {
  try {
    const allWords = await prisma.word.findMany();
    
    if (allWords.length < 4) {
      return NextResponse.json(
        { error: "Not enough words to generate a quiz. Please add at least 4 words." },
        { status: 400 }
      );
    }

    // Pick 10 random words
    const shuffled = [...allWords].sort(() => 0.5 - Math.random());
    const quizWords = shuffled.slice(0, 10);

    const wordsJson = JSON.stringify(
      quizWords.map(w => ({ id: w.id, word: w.word, translation: w.translation, pronunciation: w.pronunciation }))
    );

    const prompt = `You are an English teacher generating a multiple-choice quiz.
I will give you a list of words. For each word, generate exactly one question.
You must randomly mix these 3 types of questions:
1. "en-zh": English to Chinese (Ask for the translation of the English word)
2. "zh-en": Chinese to English (Ask for the English word given the translation)
3. "sentence": Fill in the blank (Provide an English sentence with the target word replaced by "_____")

For the options, you MUST provide exactly 4 options. ONE option must be the correct answer, and the other 3 must be plausible distractors (you can use other words from the list or make up similar ones).

List of words to test:
${wordsJson}

Return STRICTLY a JSON array of objects. Do not include markdown formatting or any other text.
Format:
[
  {
    "id": "word-id-here",
    "question": "The question text",
    "options": [
      {"id": "A", "text": "Option 1"},
      {"id": "B", "text": "Option 2"},
      {"id": "C", "text": "Option 3"},
      {"id": "D", "text": "Option 4"}
    ],
    "correctOptionId": "A",
    "pronunciation": "/pronunciation/"
  }
]`;

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

    const questions = JSON.parse(responseText);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Generate Quiz Error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz with AI" },
      { status: 500 }
    );
  }
}
