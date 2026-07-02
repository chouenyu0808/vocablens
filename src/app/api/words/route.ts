import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const words = await prisma.word.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ words });
  } catch (error) {
    console.error("Fetch Words Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch words" },
      { status: 500 }
    );
  }
}
