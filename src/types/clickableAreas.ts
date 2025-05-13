// src/data/clickableAreas.ts

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
}

// Group areas by zones for better organization
export const clickableAreas: ClickableArea[] = [
  // MIRROR ZONE
  {
    id: "mirror",
    name: "Mirror",
    shape: "rect",
    coords: [1629, 424, 97, 174],
    action: "mirror",
    tooltip: "Examine the mirror",
    fillColor: "rgba(124, 252, 0, 0.3)",
    strokeColor: "rgba(124, 252, 0, 0.6)",
    zone: "wall",
  },

  // DOOR ZONE
  {
    id: "door",
    name: "Door",
    shape: "rect",
    coords: [800, 400, 120, 300],
    action: "door",
    tooltip: "Try the door",
    fillColor: "rgba(255, 165, 0, 0.3)",
    strokeColor: "rgba(255, 165, 0, 0.6)",
    zone: "exit",
  },

  // DESK ZONE
  {
    id: "desk",
    name: "Desk",
    shape: "rect",
    coords: [400, 700, 200, 100],
    action: "desk",
    tooltip: "Look at the desk",
    fillColor: "rgba(0, 191, 255, 0.3)",
    strokeColor: "rgba(0, 191, 255, 0.6)",
    zone: "furniture",
  },
  {
    id: "desk-drawer",
    name: "Desk Drawer",
    shape: "rect",
    coords: [450, 750, 100, 30],
    action: "desk-drawer",
    tooltip: "Open the drawer",
    fillColor: "rgba(70, 130, 180, 0.3)",
    strokeColor: "rgba(70, 130, 180, 0.6)",
    zone: "furniture",
  },

  // BOOKSHELF ZONE
  {
    id: "bookshelf",
    name: "Bookshelf",
    shape: "rect",
    coords: [100, 300, 150, 400],
    action: "bookshelf",
    tooltip: "Browse the bookshelf",
    fillColor: "rgba(139, 69, 19, 0.3)",
    strokeColor: "rgba(139, 69, 19, 0.6)",
    zone: "furniture",
  },

  // Add more areas organized by zone
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
