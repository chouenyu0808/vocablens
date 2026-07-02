import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get review logs for the last 100 days
    const hundredDaysAgo = new Date();
    hundredDaysAgo.setDate(hundredDaysAgo.getDate() - 100);

    const logs = await prisma.reviewLog.findMany({
      where: {
        createdAt: {
          gte: hundredDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Group by date string (YYYY-MM-DD)
    const heatmapData: Record<string, number> = {};

    logs.forEach((log) => {
      const dateStr = log.createdAt.toISOString().split("T")[0];
      heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
    });

    return NextResponse.json({ heatmapData });
  } catch (error) {
    console.error("Fetch Stats Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
