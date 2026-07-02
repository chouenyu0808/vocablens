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

  const playAudio = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelect = async (optionId: string) => {
    if (selectedId) return; // Prevent multiple clicks
    setSelectedId(optionId);
    
    const isCorrect = optionId === questions[currentIndex].correctOptionId;
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    // Submit SRS result to backend
    try {
      await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordId: questions[currentIndex].id,
          isCorrect: isCorrect,
        }),
      });
    } catch (err) {
      console.error("Failed to submit SRS", err);
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
  // Determine the word to speak. Since the prompt could be translating, we guess the English word might be in the question or options. 
  // However, we don't strictly have "the word string" in Question type. We'll pass q.question or the correct option to speech. 
  // Actually, we do have "question text" which contains the word, but it might be mixed with Chinese.
  // We can just add a simple button for pronunciation using q.question, but it's better to just speak the word if we had it.
  // The user sees the question. We'll add TTS to the question text.

  return (
    <main className="app-container animate-fade-in">
      {/* Progress Bar */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ color: "var(--text-secondary)", fontWeight: "500" }}>Question {currentIndex + 1} <span style={{ opacity: 0.5 }}>/ {TOTAL_QUESTIONS}</span></div>
          <Link href="/"><button className="btn-secondary" style={{ padding: "6px 16px", fontSize: "0.9rem" }}>Quit</button></Link>
        </div>
        <div style={{ width: "100%", height: "4px", background: "var(--card-border)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ 
            width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%`, 
            height: "100%", 
            background: "var(--accent-color)", 
            transition: "width 0.4s ease" 
          }} />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "40px 20px", textAlign: "center", marginBottom: "32px", minHeight: "160px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "600", margin: 0 }}>{q.question}</h2>
        </div>
        
        {q.pronunciation && (
          <div style={{ height: "1.5rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            {selectedId && (
              <>
                <p className="animate-fade-in" style={{ color: "var(--accent-color)", fontSize: "1.2rem", margin: 0 }}>{q.pronunciation}</p>
                {/* 🔊 TTS Button visible after answering */}
                <button 
                  className="animate-fade-in"
                  onClick={() => playAudio(q.options.find(o => o.id === q.correctOptionId)?.text || q.question)} 
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}
                  title="Play pronunciation"
                >
                  🔊
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="responsive-grid" style={{ gap: "16px" }}>
        {q.options.map((opt) => {
          let bgColor = "var(--card-border)";
          let borderColor = "var(--card-border)";
          let animationClass = "";
          if (selectedId) {
            if (opt.id === q.correctOptionId) {
              bgColor = "rgba(52, 199, 89, 0.1)";
              borderColor = "var(--success-color)";
              if (opt.id === selectedId) animationClass = "pulse-success";
            } else if (opt.id === selectedId) {
              bgColor = "rgba(255, 59, 48, 0.1)";
              borderColor = "var(--error-color)";
              animationClass = "pulse-error";
            }
          }

          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`glass-panel glass-card ${animationClass ? `animate-[${animationClass}_1s_ease-out]` : ''}`}
              style={{
                padding: "24px",
                fontSize: "1.2rem",
                fontWeight: "500",
                textAlign: "center",
                background: bgColor,
                borderColor: borderColor,
                cursor: selectedId ? "default" : "pointer",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: animationClass ? `${animationClass} 1s ease-out` : "none"
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
