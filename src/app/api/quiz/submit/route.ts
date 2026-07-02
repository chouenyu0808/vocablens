import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { wordId, isCorrect } = await req.json();

    if (!wordId || typeof isCorrect !== "boolean") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const word = await prisma.word.findUnique({ where: { id: wordId } });
    if (!word) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    // Spaced Repetition System (Simplified SuperMemo-2)
    let repetitions = word.srsRepetitions;
    let interval = word.srsInterval;
    let easeFactor = word.srsEaseFactor;

    if (isCorrect) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      easeFactor = easeFactor + 0.1;
    } else {
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Update Word
    await prisma.word.update({
      where: { id: wordId },
      data: {
        srsRepetitions: repetitions,
        srsInterval: interval,
        srsEaseFactor: easeFactor,
        nextReviewDate: nextReviewDate,
        lastReviewed: new Date(),
        masteryLevel: repetitions >= 4 ? 2 : (repetitions > 0 ? 1 : 0),
      },
    });

    // Create ReviewLog
    await prisma.reviewLog.create({
      data: {
        wordId: word.id,
        isCorrect: isCorrect,
      },
    });

    return NextResponse.json({ success: true, nextReviewDate });
  } catch (error) {
    console.error("Submit Quiz Error:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz result" },
      { status: 500 }
    );
  }
}
