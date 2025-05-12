import React from 'react';
import { Puzzle } from '../App';

interface PuzzleSelectorProps {
  puzzles: Puzzle[];
  onPuzzleChange: (puzzleId: string) => void;
  onLoadPuzzle: () => void;
}

export const PuzzleSelector: React.FC<PuzzleSelectorProps> = ({ 
  puzzles, 
  onPuzzleChange, 
  onLoadPuzzle 
}) => {
  // Handler for puzzle selection change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPuzzleChange(e.target.value);
  };
  
  return (
    <div className="puzzle-selector">
      <select 
        onChange={handleChange}
        className="puzzle-select"
        defaultValue=""
      >
        <option value="">-- Select a Puzzle --</option>
        {puzzles.map(puzzle => (
          <option key={puzzle.id} value={puzzle.id}>
            {puzzle.title}
          </option>
        ))}
      </select>
      
      <button 
        className="load-puzzle-button"
        onClick={onLoadPuzzle}
      >
        Load Puzzle
      </button>
    </div>
  );
}; 