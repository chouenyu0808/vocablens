import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided." },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `You are an expert OCR and language parsing AI. I am providing an image of an English vocabulary list. 
Extract all the English words and their phonetic pronunciations (if available).
CRITICAL INSTRUCTION: You MUST provide a Traditional Chinese (繁體中文) translation for EVERY word. If the image already contains a Chinese translation, extract it. If the image DOES NOT contain a translation, you must translate the word into Traditional Chinese yourself.
Return the result STRICTLY as a JSON array of objects. Do not include markdown formatting or any other text.
The JSON format must be exactly like this:
[
  {
    "word": "example",
    "pronunciation": "/ɪg'zæmpl/",
    "translation": "例子"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: file.type || "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    let parsedData: { word: string; pronunciation: string; translation: string }[];
    try {
      parsedData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", responseText);
      return NextResponse.json(
        { error: "Failed to parse OCR results." },
        { status: 500 }
      );
    }

    // Save to database
    let addedCount = 0;
    for (const item of parsedData) {
      if (!item.word) continue;

      try {
        await prisma.word.upsert({
          where: { word: item.word },
          update: {
            pronunciation: item.pronunciation || null,
            translation: item.translation || null,
            lastReviewed: new Date(),
          },
          create: {
            word: item.word,
            pronunciation: item.pronunciation || null,
            translation: item.translation || null,
          },
        });
        addedCount++;
      } catch (dbError) {
        console.error("Failed to save word:", item.word, dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully extracted and saved ${addedCount} words.`,
      words: parsedData,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Internal server error during upload." },
      { status: 500 }
    );
  }
}
