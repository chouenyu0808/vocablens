import Link from "next/link";
import { prisma } from "@/lib/prisma";
import UploadSection from "./components/UploadSection";
import Heatmap from "./components/Heatmap";

export const dynamic = "force-dynamic"; // Ensure fresh stats

export default async function Home() {
  const totalWords = await prisma.word.count();
  const masteredWords = await prisma.word.count({
    where: { masteryLevel: { gte: 2 } },
  });

  return (
    <main className="app-container animate-fade-in">
      <h1 className="page-title" style={{ textAlign: "center" }}>VocabLens</h1>
      
      <div className="responsive-grid" style={{ marginBottom: "2rem" }}>
        <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--accent-color)" }}>
            {totalWords}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Total Words</div>
        </div>
        
        <div className="glass-panel" style={{ padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--success-color)" }}>
            {masteredWords}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Mastered</div>
        </div>
      </div>

      <UploadSection />

      <div className="responsive-grid" style={{ marginTop: "2rem", gap: "16px" }}>
        <Link href="/quiz" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ width: "100%", padding: "20px", fontSize: "1.2rem" }}>
            🚀 Start Quiz
          </button>
        </Link>
        
        <Link href="/library" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ width: "100%", padding: "20px", fontSize: "1.2rem" }}>
            📚 Vocabulary Library
          </button>
        </Link>
      </div>

      <Heatmap />
    </main>
  );
}
