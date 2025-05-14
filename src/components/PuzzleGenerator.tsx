import React, { useState, useEffect } from "react";
import { ClickableArea } from "../types/clickableAreas";
import { Language } from "../App";
import {
  generateTemplates,
  generateFunctionNames,
} from "../utils/templateGenerator";

// Add a new prop to receive the current language
interface PuzzleGeneratorProps {
  areas: ClickableArea[];
  currentLanguage: Language;
  onSelectArea: (area: ClickableArea) => void;
}

export const PuzzleGenerator: React.FC<PuzzleGeneratorProps> = ({
  areas,
  currentLanguage,
  onSelectArea,
}) => {
  const [preparedAreas, setPreparedAreas] = useState<ClickableArea[]>([]);

  // Generate templates and function names when areas or language changes
  useEffect(() => {
    // Create deep copies to avoid mutating the original objects
    const processedAreas = areas.map((area) => {
      // Create a deep copy of the area
      const newArea = { ...area };

      // If this area has a puzzle spec, generate the templates and function names
      if (newArea.puzzleSpec) {
        newArea.codeTemplates = generateTemplates(newArea.puzzleSpec);
        newArea.functionNames = generateFunctionNames(newArea.puzzleSpec);
      }

      return newArea;
    });

    setPreparedAreas(processedAreas);
  }, [areas, currentLanguage]);

  return (
    <div className="puzzle-generator">
      <h3>Available Puzzles</h3>
      <div className="puzzle-list">
        {preparedAreas
          .filter((area) => area.puzzleSpec) // Only show areas with puzzles
          .map((area) => (
            <div
              key={area.id}
              className="puzzle-item"
              onClick={() => onSelectArea(area)}
            >
              <h4>{area.name}</h4>
              <p>{area.description?.substring(0, 100)}...</p>
              <button>View Puzzle</button>
            </div>
          ))}
      </div>

      <style jsx>{`
        .puzzle-generator {
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .puzzle-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .puzzle-item {
          padding: 10px 15px;
          background-color: white;
          border-radius: 5px;
          border-left: 4px solid #2196f3;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .puzzle-item:hover {
          transform: translateX(5px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .puzzle-item button {
          background-color: #2196f3;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
