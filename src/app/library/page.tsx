"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Word = {
  id: string;
  word: string;
  pronunciation: string | null;
  translation: string | null;
  masteryLevel: number;
};

export default function LibraryPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/words")
      .then((res) => res.json())
      .then((data) => {
        setWords(data.words || []);
        setLoading(false);
      });
  }, []);

  const playAudio = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <main className="app-container animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Vocabulary Library</h1>
        <Link href="/">
          <button className="btn-secondary" style={{ padding: "8px 16px" }}>Back to Home</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
      ) : words.length === 0 ? (
        <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>No words yet.</p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "8px" }}>Upload a screenshot to get started.</p>
        </div>
      ) : (
        <div className="responsive-grid">
          {words.map((w) => (
            <div key={w.id} className="glass-panel glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "1.4rem", color: "var(--accent-color)", display: "flex", alignItems: "center", gap: "8px" }}>
                    {w.word}
                    <button 
                      onClick={() => playAudio(w.word)} 
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", padding: 0 }}
                      title="Play pronunciation"
                    >
                      🔊
                    </button>
                  </div>
                  {w.pronunciation && (
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "4px" }}>
                      {w.pronunciation}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: "0.85rem", padding: "4px 8px", borderRadius: "12px", background: w.masteryLevel >= 2 ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)", color: w.masteryLevel >= 2 ? "var(--success-color)" : "var(--text-secondary)" }}>
                  Level {w.masteryLevel}
                </div>
              </div>
              
              <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: "12px", marginTop: "auto" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Translation 中文翻譯</div>
                <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>{w.translation || "無翻譯"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
