// New component: PuzzleContext.tsx
// Add this as a new file in src/components/PuzzleContext.tsx

import React from "react";
import { ClickableArea } from "../types/clickableAreas";
import { Language } from "../App";

interface PuzzleContextProps {
  currentArea: ClickableArea | null;
  currentLanguage: Language;
  isPuzzleCompleted: boolean;
}

export const PuzzleContext: React.FC<PuzzleContextProps> = ({
  currentArea,
  currentLanguage,
  isPuzzleCompleted,
}) => {
  if (!currentArea || currentArea.areaType !== "puzzle") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        left: "20px",
        maxWidth: "300px",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        color: "white",
        padding: "15px",
        borderRadius: "8px",
        border: "2px solid #ffd700",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "20px", marginRight: "8px" }}>🧩</span>
        <h3
          style={{
            margin: 0,
            color: isPuzzleCompleted ? "#0f0" : "#ffd700",
            fontSize: "16px",
          }}
        >
          {currentArea.name}
          {isPuzzleCompleted && " ✅"}
        </h3>
      </div>

      <div
        style={{
          fontSize: "12px",
          marginBottom: "10px",
          lineHeight: "1.4",
        }}
      >
        {currentArea.description}
      </div>

      {currentArea.expectedValue !== undefined && (
        <div
          style={{
            padding: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: "4px",
            marginBottom: "10px",
            fontSize: "11px",
          }}
        >
          <strong>Target:</strong> {String(currentArea.expectedValue)}
        </div>
      )}

      <div
        style={{
          padding: "8px",
          backgroundColor: "rgba(0, 255, 0, 0.1)",
          border: "1px solid rgba(0, 255, 0, 0.3)",
          borderRadius: "4px",
          fontSize: "11px",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          Function: <code style={{ color: "#0f0" }}>solution()</code>
        </div>
        <div style={{ color: "#ccc" }}>
          Language: {currentLanguage.toUpperCase()}
        </div>
      </div>
    </div>
  );
};
