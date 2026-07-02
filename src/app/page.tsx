import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UploadSection from "./components/UploadSection";

export const dynamic = "force-dynamic"; // Ensure fresh stats

export default async function Home() {
  const totalWords = await prisma.word.count();
  const masteredWords = await prisma.word.count({
    where: { masteryLevel: { gte: 2 } },
  });

  return (
    <main className="app-container animate-fade-in">
      <h1 className="page-title" style={{ marginTop: "2rem" }}>VocabLens</h1>
      
      <div className="responsive-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="glass-panel" style={{ padding: "30px", display: "flex", justifyContent: "space-around", textAlign: "center", flex: 1, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--accent-color)" }}>
                {totalWords}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Total Words</div>
            </div>
            <div>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--success-color)" }}>
                {masteredWords}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Mastered</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/library" style={{ flex: 1 }}>
              <button className="btn-secondary" style={{ width: "100%", padding: "16px", fontSize: "1.1rem" }}>📚 Vocabulary Library</button>
            </Link>
            <Link href="/quiz" style={{ flex: 1 }}>
              <button className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: "1.1rem" }}>🎯 Start Quiz</button>
            </Link>
          </div>
        </div>

        <UploadSection />
      </div>
    </main>
  );
}
