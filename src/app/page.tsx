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
      <h1 className="page-title" style={{ textAlign: "center" }}>
        VocabLens
      </h1>
      
      <div className="responsive-grid" style={{ marginBottom: "2rem" }}>
        <div className="glass-panel glass-card" style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "3.5rem", fontWeight: "600", color: "var(--text-primary)" }}>
            {totalWords}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: "500", marginTop: "8px" }}>Total Words</div>
        </div>
        
        <div className="glass-panel glass-card" style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "3.5rem", fontWeight: "600", color: "var(--text-primary)" }}>
            {masteredWords}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: "500", marginTop: "8px" }}>Mastered</div>
        </div>
      </div>

      <UploadSection />

      <div className="responsive-grid" style={{ marginTop: "2.5rem" }}>
        <Link href="/quiz" style={{ textDecoration: "none" }}>
          <button className="btn-primary" style={{ width: "100%", padding: "24px", fontSize: "1.3rem", borderRadius: "20px" }}>
            <span style={{ fontSize: "1.5rem" }}>🎯</span> Start Training Session
          </button>
        </Link>
        
        <Link href="/library" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ width: "100%", padding: "24px", fontSize: "1.3rem", borderRadius: "20px" }}>
            <span style={{ fontSize: "1.5rem" }}>📚</span> Browse Library
          </button>
        </Link>
      </div>

      <Heatmap />
    </main>
  );
}
