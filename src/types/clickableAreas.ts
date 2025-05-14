// src/types/clickableAreas.ts

// src/types/clickableAreas.ts
import { Language } from "../App";
import {
  PuzzleSpec,
  // generateTemplates, // Removed unused import
  // generateFunctionNames, // Removed unused import
} from "../utils/templateGenerator";

export interface ClickableArea {
  id: string;
  name: string;
  shape: "rect" | "circle" | "poly";
  coords: number[];
  action: string;
  tooltip?: string;
  fillColor?: string;
  strokeColor?: string;
  zone?: string; // Optional grouping by zone
  detailImage?: string; // Path to a detailed image
  description?: string; // Descriptive text
  expectedValue?: any; // Expected value from code solution
  puzzleCompleted?: boolean; // Track if puzzle is solved
  codeTemplates?: Record<string, string>; // Templates for different languages
  functionNames?: Record<string, string>; // Function names for different languages
  puzzleSpec?: PuzzleSpec; // Specification for the puzzle
}

// Group areas by zones for better organization
export const clickableAreas: ClickableArea[] = [
  // MIRROR ZONE
  {
    id: "mirror",
    name: "Mirror",
    shape: "rect",
    coords: [1629, 424, 97, 174], // [x, y, width, height]
    action: "mirror",
    tooltip: "Examine the mirror",
    fillColor: "rgba(124, 252, 0, 0.3)",
    strokeColor: "rgba(124, 252, 0, 0.6)",
    detailImage: "/mirror.jpg", // Add path to detailed mirror image
    description:
      "An antique mirror hanging on the wall. The glass appears to be slightly warped, and your reflection seems... different somehow. There's something eerie about how the light reflects off its surface.",
  },
  // Door with expected value for puzzle
  {
    id: "door",
    name: "Door",
    shape: "rect",
    coords: [340, 800, 50, 50], // Example coordinates - replace with actual door position
    action: "door",
    tooltip: "Look at the lock",
    fillColor: "rgba(255, 165, 0, 0.3)",
    strokeColor: "rgba(255, 165, 0, 0.6)",
    description:
      "A heavy wooden door with an ornate brass lock. It appears to be locked from the other side. The keyhole is unusually large and seems to be in the shape of some kind of symbol. You need to find the correct 4-digit code to unlock it.",
    expectedValue: 1234, // The expected value that should be output by the code
    puzzleCompleted: false, // Initially not completed
    puzzleSpec: {
      name: "unlockDoor",
      description:
        "The door has a 4-digit code lock. Find the correct code to unlock it.",
      returnType: "number",
      returnDescription: "The 4-digit unlock code",
      hints: ["The code is a 4-digit number", "Look around for clues"],
    },
    // Initialize with empty objects - we'll populate them in the component
    codeTemplates: {},
    functionNames: {},
  },
  // Add a desk item example
  {
    id: "desk",
    name: "Desk",
    shape: "poly",
    coords: [675, 739, 863, 731, 899, 775, 678, 790],
    action: "desk",
    tooltip: "Look at the desk",
    fillColor: "rgba(0, 191, 255, 0.3)",
    strokeColor: "rgba(0, 191, 255, 0.6)",
    description:
      "An old wooden writing desk covered in dust. There are several drawers that might contain useful items. On top of the desk, you see some scattered papers and what looks like an old journal.",
  },
];

// Handle actions for different areas
export function handleAreaAction(areaId: string): string {
  switch (areaId) {
    case "mirror":
      return "You see a distorted reflection of yourself in the mirror.";
    case "door":
      return "The door is locked. You need to find a key.";
    case "desk":
      return "A wooden desk with scattered papers.";
    case "desk-drawer":
      return "You found a small key in the drawer!";
    case "bookshelf":
      return "There's a book that seems out of place.";
    // Add more actions
    default:
      return `You interact with ${areaId}.`;
  }
}
