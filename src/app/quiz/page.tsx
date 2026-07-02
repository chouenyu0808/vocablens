"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Option = { id: string; text: string };
type Question = {
  id: string;
  question: string;
  options: Option[];
  correctOptionId: string;
  pronunciation: string | null;
};

const TOTAL_QUESTIONS = 10;

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  
  // Use a ref to track IDs we've already fetched to avoid duplicates
  const testedIdsRef = useRef<string[]>([]);
  
  // Ref to track if we've already started the initial fetch
  const initialFetchDone = useRef(false);

  const fetchNextQuestion = async () => {
    if (questions.length >= TOTAL_QUESTIONS) return;
    
    setIsFetchingNext(true);
    try {
      const res = await fetch("/api/quiz/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeIds: testedIdsRef.current }),
      });
      
      const data = await res.json();
      if (data.error) {
        if (questions.length === 0) {
          setError(data.error); // Only show error if we have 0 questions
        } else {
          // If we run out of words halfway, just finish early
          setFinished(true); 
        }
      } else if (data.question) {
        testedIdsRef.current.push(data.question.id);
        setQuestions((prev) => [...prev, data.question]);
      }
    } catch (err) {
      if (questions.length === 0) setError("Failed to start quiz.");
      console.error(err);
    } finally {
      setIsFetchingNext(false);
    }
  };

  // Initial fetch for Q1
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchNextQuestion();
      return; // Return early to prevent double-fetching on mount in dev mode
    }
  }, []);

  // Continuous background fetch for all subsequent questions until we hit TOTAL_QUESTIONS
  useEffect(() => {
    if (questions.length > 0 && questions.length < TOTAL_QUESTIONS && !isFetchingNext) {
      fetchNextQuestion();
    }
  }, [questions.length, isFetchingNext]);

  const handleSelect = (optionId: string) => {
    if (selectedId) return; // Prevent multiple clicks
    setSelectedId(optionId);
    if (optionId === questions[currentIndex].correctOptionId) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < TOTAL_QUESTIONS && currentIndex + 1 < questions.length) {
      setCurrentIndex((c) => c + 1);
      setSelectedId(null);
    } else if (currentIndex + 1 === TOTAL_QUESTIONS) {
      setFinished(true);
    }
  };

  if (error) return (
    <main className="app-container">
      <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ color: "var(--error-color)" }}>{error}</p>
        <Link href="/"><button className="btn-primary" style={{ marginTop: "20px" }}>Go Home</button></Link>
      </div>
    </main>
  );

  if (finished) return (
    <main className="app-container animate-fade-in">
      <h1 className="page-title">Quiz Finished!</h1>
      <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎉</div>
        <h2 style={{ fontSize: "2rem", color: "var(--success-color)", marginBottom: "8px" }}>
          {score} / {currentIndex + (selectedId ? 1 : 0)}
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>Great job reviewing your vocabulary!</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <Link href="/"><button className="btn-secondary">Home</button></Link>
          <button className="btn-primary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    </main>
  );

  // If the current index hasn't been loaded yet
  if (currentIndex >= questions.length) {
    return (
      <main className="app-container">
        <div style={{textAlign: "center", padding: "40px"}}>
          <div style={{ color: "var(--accent-color)", fontSize: "1.2rem", marginBottom: "16px" }}>
            {currentIndex === 0 ? "Generating your first question..." : "AI is thinking of the next question..."}
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Usually takes just a second ⚡</p>
        </div>
      </main>
    );
  }

  const q = questions[currentIndex];

  return (
    <main className="app-container animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ color: "var(--text-secondary)" }}>Question {currentIndex + 1} of {TOTAL_QUESTIONS}</div>
        <Link href="/"><button className="btn-secondary" style={{ padding: "8px 16px" }}>Quit</button></Link>
      </div>

      <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center", marginBottom: "32px", minHeight: "160px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: "600", marginBottom: "12px" }}>{q.question}</h2>
        {q.pronunciation && (
          <div style={{ height: "1.5rem" }}>
            {selectedId && <p className="animate-fade-in" style={{ color: "var(--accent-color)", fontSize: "1.2rem" }}>{q.pronunciation}</p>}
          </div>
        )}
      </div>

      <div className="responsive-grid" style={{ gap: "16px" }}>
        {q.options.map((opt) => {
          let bgColor = "rgba(255, 255, 255, 0.05)";
          let borderColor = "var(--card-border)";
          if (selectedId) {
            if (opt.id === q.correctOptionId) {
              bgColor = "rgba(16, 185, 129, 0.2)";
              borderColor = "var(--success-color)";
            } else if (opt.id === selectedId) {
              bgColor = "rgba(239, 68, 68, 0.2)";
              borderColor = "var(--error-color)";
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className="glass-panel"
              style={{
                padding: "24px",
                fontSize: "1.2rem",
                textAlign: "center",
                background: bgColor,
                borderColor: borderColor,
                transition: "all 0.2s ease",
                cursor: selectedId ? "default" : "pointer",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              disabled={!!selectedId}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {selectedId && (
        <button 
          className="btn-primary animate-fade-in" 
          onClick={nextQuestion}
          style={{ marginTop: "24px", width: "100%", padding: "16px" }}
          disabled={currentIndex + 1 < TOTAL_QUESTIONS && currentIndex + 1 >= questions.length}
        >
          {currentIndex + 1 === TOTAL_QUESTIONS 
            ? "Finish Quiz" 
            : (currentIndex + 1 >= questions.length ? "Loading next..." : "Next Question")}
        </button>
      )}
    </main>
  );
}
