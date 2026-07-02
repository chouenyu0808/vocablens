"use client";

import { useEffect, useState } from "react";

export default function Heatmap() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((d) => {
        setData(d.heatmapData || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("Heatmap fetch error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>Loading stats...</div>;

  // Generate last 60 days
  const days = [];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }

  return (
    <div className="glass-panel" style={{ padding: "24px", marginTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3 style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: "8px" }}>Daily Learning Heatmap (Last 60 Days)</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {days.map((dateStr) => {
          const count = data[dateStr] || 0;
          let bgColor = "rgba(255, 255, 255, 0.05)"; // Empty
          if (count > 0 && count < 5) bgColor = "rgba(16, 185, 129, 0.3)";
          else if (count >= 5 && count < 15) bgColor = "rgba(16, 185, 129, 0.6)";
          else if (count >= 15) bgColor = "rgba(16, 185, 129, 1)"; // Max color

          return (
            <div
              key={dateStr}
              title={`${dateStr}: ${count} reviews`}
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "4px",
                background: bgColor,
                transition: "transform 0.1s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.2)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "8px" }}>
        <span>Less</span>
        <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(255, 255, 255, 0.05)" }} />
        <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(16, 185, 129, 0.3)" }} />
        <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(16, 185, 129, 0.6)" }} />
        <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(16, 185, 129, 1)" }} />
        <span>More</span>
      </div>
    </div>
  );
}
