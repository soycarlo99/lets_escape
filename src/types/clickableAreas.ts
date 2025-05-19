// src/types/clickableAreas.ts

import { Language } from "../App";
import { PuzzleSpec } from "../utils/templateGenerator";

export type AreaType = "photo" | "puzzle" | "info" | "data" | "interactive";

export interface ClickableArea {
  id: string;
  name: string;
  shape: "rect" | "circle" | "poly";
  coords: number[];

  // Determine the behavior of this area
  areaType: AreaType;

  // Common properties
  tooltip?: string;
  fillColor?: string;
  strokeColor?: string;
  description?: string;

  // Photo-specific properties
  detailImage?: string; // Path to the detailed image
  nestedAreas?: ClickableArea[]; // Areas that become available when this photo is viewed

  // Puzzle-specific properties
  puzzleSpec?: PuzzleSpec; // Auto-generates function and expected value
  expectedValue?: any; // The value the function should return
  codeTemplates?: Record<string, string>;
  functionNames?: Record<string, string>;
  puzzleCompleted?: boolean;

  // Info/Data-specific properties
  dataContent?: string | string[] | object; // Information or data to provide
  dataType?: "text" | "array" | "encrypted" | "json" | "stream";
  processingHint?: string; // Hint on how to process the data

  // Legacy support
  action?: string; // Kept for backward compatibility
  zone?: string; // Optional grouping
}

// Enhanced clickable areas with smart behavior
export const clickableAreas: ClickableArea[] = [
  // PHOTO AREA - Contains nested areas for multi-room experience
  {
    id: "mirror",
    name: "Mirror",
    shape: "rect",
    coords: [1629, 424, 97, 174],
    areaType: "photo",
    tooltip: "Examine the mirror closely",
    fillColor: "rgba(124, 252, 0, 0.3)",
    strokeColor: "rgba(124, 252, 0, 0.6)",
    detailImage: "/mirror.jpg",
    description:
      "An antique mirror with mysterious reflections. Look closer to see what secrets it holds.",
    nestedAreas: [
      // Areas that appear when viewing the mirror photo
      {
        id: "mirror-crack",
        name: "Crack in Mirror",
        shape: "poly",
        coords: [450, 200, 500, 180, 520, 250, 470, 270],
        areaType: "puzzle",
        tooltip: "Inspect the crack pattern",
        description:
          "The crack forms a pattern that looks like a mathematical sequence.",
        puzzleSpec: {
          name: "decodeMirrorPattern",
          description:
            "The crack in the mirror follows a Fibonacci sequence. Calculate the next number in the sequence: 1, 1, 2, 3, 5, 8, ?",
          returnType: "number",
          returnDescription: "The next number in the Fibonacci sequence",
        },
        expectedValue: 13,
      },
      {
        id: "mirror-inscription",
        name: "Hidden Inscription",
        shape: "circle",
        coords: [600, 150, 30],
        areaType: "data",
        tooltip: "Read the inscription",
        description: "Ancient text etched behind the mirror",
        dataContent: "WKLV LV D FDHVDU FLSKHU ZLWK D VKLIW RI 3",
        dataType: "encrypted",
        processingHint:
          "This appears to be a Caesar cipher. Try shifting each letter.",
      },
    ],
  },

  // PUZZLE AREA - Direct puzzle interaction
  {
    id: "door",
    name: "Locked Door",
    shape: "rect",
    coords: [340, 800, 50, 50],
    areaType: "puzzle",
    tooltip: "Examine the lock mechanism",
    fillColor: "rgba(255, 165, 0, 0.3)",
    strokeColor: "rgba(255, 165, 0, 0.6)",
    description:
      "A sophisticated electronic lock that requires a 4-digit code. The lock display shows: 'PRIME_SUM_2024'",
    puzzleSpec: {
      name: "calculateLockCode",
      description:
        "Find the sum of all prime numbers less than 30 that add up to exactly 100. Return that sum as the lock code.",
      returnType: "number",
      returnDescription: "The 4-digit lock code (sum of specific primes)",
      hints: [
        "Prime numbers less than 30: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29",
        "Find a combination that sums to exactly 100",
      ],
    },
    expectedValue: 100, // Sum of primes that equal 100
    puzzleCompleted: false,
  },

  // INFO AREA - Provides contextual information
  {
    id: "desk",
    name: "Old Desk",
    shape: "poly",
    coords: [675, 739, 863, 731, 899, 775, 678, 790],
    areaType: "info",
    tooltip: "Examine the desk contents",
    fillColor: "rgba(0, 191, 255, 0.3)",
    strokeColor: "rgba(0, 191, 255, 0.6)",
    description:
      "A dusty old desk with scattered papers and a leather-bound journal.",
    dataContent: `RESEARCH JOURNAL - Day 127

The pattern is becoming clearer. Each symbol corresponds to a prime number:
○ = 2, △ = 3, □ = 5, ◇ = 7, ⬟ = 11, ⭐ = 13

The final sequence reads: ○△□◇ which should unlock the main door.
But something feels wrong... the numbers don't add up to what the lock expects.

Maybe I need to multiply instead of just listing them?
○△□◇ = 2 × 3 × 5 × 7 = ???

- Professor Blackwood`,
    dataType: "text",
    processingHint:
      "This journal might contain clues for other puzzles in the room.",
  },

  // DATA AREA - Provides raw data for processing
  {
    id: "bookshelf",
    name: "Ancient Bookshelf",
    shape: "rect",
    coords: [100, 200, 120, 400],
    areaType: "data",
    tooltip: "Search through the books",
    fillColor: "rgba(128, 0, 128, 0.3)",
    strokeColor: "rgba(128, 0, 128, 0.6)",
    description:
      "A bookshelf filled with old tomes. One book falls open, revealing a page of numbers.",
    dataContent: [
      89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657,
      46368, 75025, 121393, 196418, 317811,
    ],
    dataType: "array",
    processingHint:
      "These numbers seem to follow a pattern. What mathematical sequence could this be?",
  },

  // INTERACTIVE AREA - Complex multi-step interaction
  {
    id: "painting",
    name: "Mysterious Painting",
    shape: "rect",
    coords: [1200, 300, 200, 150],
    areaType: "photo",
    tooltip: "Study the painting",
    fillColor: "rgba(255, 215, 0, 0.3)",
    strokeColor: "rgba(255, 215, 0, 0.6)",
    detailImage: "/painting.jpg",
    description:
      "An oil painting depicting a starry night. Some stars seem to twinkle differently than others.",
    nestedAreas: [
      {
        id: "constellation",
        name: "Star Constellation",
        shape: "poly",
        coords: [300, 100, 350, 120, 380, 90, 330, 80, 310, 110],
        areaType: "puzzle",
        tooltip: "Connect the special stars",
        description: "These stars form a pattern when connected properly.",
        puzzleSpec: {
          name: "decodeConstellation",
          description:
            "The special stars represent binary digits. Convert the binary sequence 1011001 to decimal.",
          returnType: "number",
          returnDescription: "The decimal value of the binary constellation",
          hints: [
            "Each bright star = 1, each dim star = 0",
            "Read from left to right",
          ],
        },
        expectedValue: 89, // Binary 1011001 = 89 in decimal
      },
    ],
  },

  // STREAM DATA AREA - For continuous data processing
  {
    id: "computer",
    name: "Old Computer Terminal",
    shape: "rect",
    coords: [50, 50, 100, 80],
    areaType: "data",
    tooltip: "Access the terminal",
    fillColor: "rgba(0, 255, 0, 0.3)",
    strokeColor: "rgba(0, 255, 0, 0.6)",
    description:
      "An old computer terminal is still running. The screen shows a continuous stream of data.",
    dataContent: {
      type: "stream",
      data: [
        "2024-01-15 10:23:45 - User login: admin",
        "2024-01-15 10:24:12 - File accessed: secrets.txt",
        "2024-01-15 10:24:33 - Encryption key: XJ9K2L8M",
        "2024-01-15 10:24:45 - Process terminated",
        "2024-01-15 10:25:01 - System locked",
        "2024-01-15 10:25:15 - Emergency code: 7418",
      ],
    },
    dataType: "stream",
    processingHint:
      "Parse the log entries to find the emergency code hidden in the timestamps and messages.",
  },
];

// Helper function to get area by ID (useful for nested areas)
export function getAreaById(
  areaId: string,
  areas: ClickableArea[] = clickableAreas,
): ClickableArea | null {
  for (const area of areas) {
    if (area.id === areaId) {
      return area;
    }
    // Search in nested areas
    if (area.nestedAreas) {
      const found = getAreaById(areaId, area.nestedAreas);
      if (found) return found;
    }
  }
  return null;
}

// Helper function to handle intelligent area actions
export function getAreaAction(area: ClickableArea): string {
  switch (area.areaType) {
    case "photo":
      return `Examining ${area.name} more closely...`;
    case "puzzle":
      return `Loading puzzle: ${area.name}`;
    case "info":
      return `Reading information from ${area.name}`;
    case "data":
      return `Accessing data from ${area.name}`;
    default:
      return `Interacting with ${area.name}`;
  }
}
