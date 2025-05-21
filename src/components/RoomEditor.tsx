import React, { useState, useRef, useEffect } from "react";
import { ClickableArea, AreaType } from "../types/clickableAreas";
import { AreaDrawingTool } from "./AreaDrawingTool";
import { AreaPropertiesEditor } from "./AreaPropertiesEditor";
import { PreviewRoom } from "./PreviewRoom";
import "../styles/room-editor.css";

export const RoomEditor: React.FC = () => {
  // State for managing the room configuration
  const [roomName, setRoomName] = useState<string>("New Escape Room");
  const [backgroundImage, setBackgroundImage] =
    useState<string>("/haunted-room.jpg");
  const [areas, setAreas] = useState<ClickableArea[]>([]);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState<number | null>(
    null,
  );
  const [currentView, setCurrentView] = useState<
    "draw" | "properties" | "preview"
  >("draw");
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportCode, setExportCode] = useState<string>("");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate the next ID for a new area
  const getNextId = () => {
    if (areas.length === 0) return "area-1";

    const maxId = areas
      .map((area) => {
        const match = area.id.match(/area-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .reduce((max, id) => Math.max(max, id), 0);

    return `area-${maxId + 1}`;
  };

  // Handler for adding a new area
  const handleAreaCreated = (newArea: Partial<ClickableArea>) => {
    // Create a full ClickableArea object with defaults
    const areaWithDefaults: ClickableArea = {
      id: getNextId(),
      name: newArea.name || "New Area",
      shape: newArea.shape || "rect",
      coords: newArea.coords || [],
      areaType: newArea.areaType || "info",
      tooltip:
        newArea.tooltip || `Interact with ${newArea.name || "this object"}`,
      description: newArea.description || "No description provided",
      ...newArea,
    };

    // Add to areas array
    setAreas([...areas, areaWithDefaults]);

    // Select the new area for editing
    setSelectedAreaIndex(areas.length);
    setCurrentView("properties");
  };

  // Handler for updating an existing area
  const handleAreaUpdated = (updatedArea: ClickableArea, index: number) => {
    const newAreas = [...areas];
    newAreas[index] = updatedArea;
    setAreas(newAreas);
  };

  // Handler for deleting an area
  const handleAreaDeleted = (index: number) => {
    const newAreas = [...areas];
    newAreas.splice(index, 1);
    setAreas(newAreas);
    setSelectedAreaIndex(null);
    setCurrentView("draw");
  };

  // Handler for background image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBackgroundImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Export the configuration as clickableAreas.ts format
  const generateExportCode = () => {
    const indent = "  ";
    let code = `// Generated Clickable Areas for: ${roomName}\n\n`;
    code += `import { AreaType } from "../App";\n\n`;
    code += `export interface ClickableArea {\n`;
    code += `${indent}id: string;\n`;
    code += `${indent}name: string;\n`;
    code += `${indent}shape: "rect" | "circle" | "poly";\n`;
    code += `${indent}coords: number[];\n`;
    code += `${indent}areaType: AreaType;\n`;
    code += `${indent}tooltip?: string;\n`;
    code += `${indent}fillColor?: string;\n`;
    code += `${indent}strokeColor?: string;\n`;
    code += `${indent}description?: string;\n`;
    code += `${indent}detailImage?: string;\n`;
    code += `${indent}nestedAreas?: ClickableArea[];\n`;
    code += `${indent}puzzleSpec?: any;\n`;
    code += `${indent}expectedValue?: any;\n`;
    code += `${indent}dataContent?: string | string[] | object;\n`;
    code += `${indent}dataType?: "text" | "array" | "encrypted" | "json" | "stream";\n`;
    code += `${indent}processingHint?: string;\n`;
    code += `${indent}action?: string;\n`;
    code += `${indent}zone?: string;\n`;
    code += `}\n\n`;

    code += `export const clickableAreas: ClickableArea[] = [\n`;

    // Add each area to the export
    areas.forEach((area, index) => {
      code += `${indent}{\n`;
      code += `${indent}${indent}id: "${area.id}",\n`;
      code += `${indent}${indent}name: "${area.name}",\n`;
      code += `${indent}${indent}shape: "${area.shape}",\n`;
      code += `${indent}${indent}coords: [${area.coords.join(", ")}],\n`;
      code += `${indent}${indent}areaType: "${area.areaType}",\n`;

      if (area.tooltip)
        code += `${indent}${indent}tooltip: "${area.tooltip}",\n`;
      if (area.fillColor)
        code += `${indent}${indent}fillColor: "${area.fillColor}",\n`;
      if (area.strokeColor)
        code += `${indent}${indent}strokeColor: "${area.strokeColor}",\n`;
      if (area.description)
        code += `${indent}${indent}description: "${area.description}",\n`;
      if (area.detailImage)
        code += `${indent}${indent}detailImage: "${area.detailImage}",\n`;

      // Add nested areas if they exist
      if (area.nestedAreas && area.nestedAreas.length > 0) {
        code += `${indent}${indent}nestedAreas: [\n`;
        area.nestedAreas.forEach((nestedArea, nestedIndex) => {
          code += `${indent}${indent}${indent}{\n`;
          code += `${indent}${indent}${indent}${indent}id: "${nestedArea.id}",\n`;
          code += `${indent}${indent}${indent}${indent}name: "${nestedArea.name}",\n`;
          code += `${indent}${indent}${indent}${indent}shape: "${nestedArea.shape}",\n`;
          code += `${indent}${indent}${indent}${indent}coords: [${nestedArea.coords.join(", ")}],\n`;
          code += `${indent}${indent}${indent}${indent}areaType: "${nestedArea.areaType}",\n`;

          if (nestedArea.tooltip)
            code += `${indent}${indent}${indent}${indent}tooltip: "${nestedArea.tooltip}",\n`;
          if (nestedArea.description)
            code += `${indent}${indent}${indent}${indent}description: "${nestedArea.description}",\n`;

          // Add puzzle properties for nested areas if applicable
          if (nestedArea.areaType === "puzzle") {
            if (nestedArea.puzzleSpec) {
              code += `${indent}${indent}${indent}${indent}puzzleSpec: ${JSON.stringify(nestedArea.puzzleSpec, null, 2).replace(/\n/g, `\n${indent}${indent}${indent}${indent}`)},\n`;
            }
            if (nestedArea.expectedValue !== undefined) {
              const valueStr =
                typeof nestedArea.expectedValue === "string"
                  ? `"${nestedArea.expectedValue}"`
                  : nestedArea.expectedValue;
              code += `${indent}${indent}${indent}${indent}expectedValue: ${valueStr},\n`;
            }
          }

          // Add data properties for nested areas if applicable
          if (
            nestedArea.areaType === "data" ||
            nestedArea.areaType === "info"
          ) {
            if (nestedArea.dataContent) {
              if (typeof nestedArea.dataContent === "string") {
                code += `${indent}${indent}${indent}${indent}dataContent: "${nestedArea.dataContent.replace(/\n/g, "\\n").replace(/"/g, '\\"')}",\n`;
              } else {
                code += `${indent}${indent}${indent}${indent}dataContent: ${JSON.stringify(nestedArea.dataContent, null, 2).replace(/\n/g, `\n${indent}${indent}${indent}${indent}`)},\n`;
              }
            }
            if (nestedArea.dataType)
              code += `${indent}${indent}${indent}${indent}dataType: "${nestedArea.dataType}",\n`;
            if (nestedArea.processingHint)
              code += `${indent}${indent}${indent}${indent}processingHint: "${nestedArea.processingHint}",\n`;
          }

          code += `${indent}${indent}${indent}}${nestedIndex < area.nestedAreas.length - 1 ? "," : ""}\n`;
        });
        code += `${indent}${indent}],\n`;
      }

      // Add puzzle properties if applicable
      if (area.areaType === "puzzle") {
        if (area.puzzleSpec) {
          code += `${indent}${indent}puzzleSpec: ${JSON.stringify(area.puzzleSpec, null, 2).replace(/\n/g, `\n${indent}${indent}`)},\n`;
        }
        if (area.expectedValue !== undefined) {
          const valueStr =
            typeof area.expectedValue === "string"
              ? `"${area.expectedValue}"`
              : area.expectedValue;
          code += `${indent}${indent}expectedValue: ${valueStr},\n`;
        }
      }

      // Add data properties if applicable
      if (area.areaType === "data" || area.areaType === "info") {
        if (area.dataContent) {
          if (typeof area.dataContent === "string") {
            code += `${indent}${indent}dataContent: \`${area.dataContent.replace(/`/g, "\\`")}\`,\n`;
          } else {
            code += `${indent}${indent}dataContent: ${JSON.stringify(area.dataContent, null, 2).replace(/\n/g, `\n${indent}${indent}`)},\n`;
          }
        }
        if (area.dataType)
          code += `${indent}${indent}dataType: "${area.dataType}",\n`;
        if (area.processingHint)
          code += `${indent}${indent}processingHint: "${area.processingHint}",\n`;
      }

      code += `${indent}}${index < areas.length - 1 ? "," : ""}\n`;
    });

    code += `];\n\n`;

    // Add helper functions
    code += `// Helper function to get area by ID (useful for nested areas)
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
      return \`Examining \${area.name} more closely...\`;
    case "puzzle":
      return \`Loading puzzle: \${area.name}\`;
    case "info":
      return \`Reading information from \${area.name}\`;
    case "data":
      return \`Accessing data from \${area.name}\`;
    default:
      return \`Interacting with \${area.name}\`;
  }
}`;

    return code;
  };

  // Handle export button click
  const handleExport = () => {
    const code = generateExportCode();
    setExportCode(code);
    setShowExportModal(true);
  };

  // Handler for selecting an area to edit
  const handleSelectArea = (index: number) => {
    setSelectedAreaIndex(index);
    setCurrentView("properties");
  };

  // Add a placeholder or default area when testing
  useEffect(() => {
    if (areas.length === 0) {
      setAreas([
        {
          id: "area-example",
          name: "Example Area",
          shape: "rect",
          coords: [100, 100, 150, 100],
          areaType: "info",
          tooltip: "Example tooltip",
          description: "This is an example area. Add your own areas to begin.",
        },
      ]);
    }
  }, []);

  return (
    <div className="room-editor-container">
      <div className="room-editor-header">
        <h2>Room Editor</h2>
        <div className="room-name-input">
          <label htmlFor="roomName">Room Name:</label>
          <input
            type="text"
            id="roomName"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>

        <div className="room-background-controls">
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Background Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleImageUpload}
          />
          <span className="image-name">
            {backgroundImage === "/haunted-room.jpg"
              ? "Default Image"
              : backgroundImage.startsWith("data:")
                ? "Custom Image"
                : backgroundImage.split("/").pop()}
          </span>
        </div>

        <div className="view-buttons">
          <button
            className={currentView === "draw" ? "active" : ""}
            onClick={() => setCurrentView("draw")}
          >
            Draw Mode
          </button>
          <button
            className={currentView === "properties" ? "active" : ""}
            onClick={() => setCurrentView("properties")}
            disabled={selectedAreaIndex === null}
          >
            Properties
          </button>
          <button
            className={currentView === "preview" ? "active" : ""}
            onClick={() => setCurrentView("preview")}
          >
            Preview
          </button>
          <button className="export-button" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>

      <div className="room-editor-content">
        {currentView === "draw" && (
          <AreaDrawingTool
            imageSrc={backgroundImage}
            onAreaCreated={handleAreaCreated}
            areas={areas}
            onSelectArea={handleSelectArea}
          />
        )}

        {currentView === "properties" && selectedAreaIndex !== null && (
          <AreaPropertiesEditor
            area={areas[selectedAreaIndex]}
            onUpdate={(updatedArea) =>
              handleAreaUpdated(updatedArea, selectedAreaIndex)
            }
            onDelete={() => handleAreaDeleted(selectedAreaIndex)}
          />
        )}

        {currentView === "preview" && (
          <PreviewRoom imageSrc={backgroundImage} areas={areas} />
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="export-modal-overlay">
          <div className="export-modal">
            <h3>Generated clickableAreas.ts</h3>
            <p>
              Copy this code and save it as{" "}
              <code>src/types/clickableAreas.ts</code> in your project.
            </p>
            <pre className="export-code">{exportCode}</pre>
            <div className="export-actions">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportCode);
                  alert("Code copied to clipboard!");
                }}
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([exportCode], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "clickableAreas.ts";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Download File
              </button>
              <button onClick={() => setShowExportModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
