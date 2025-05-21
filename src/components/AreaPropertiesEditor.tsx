import React, { useState, useRef } from "react";
import { ClickableArea, AreaType } from "../types/clickableAreas";
import { PuzzleSpec } from "../utils/templateGenerator";

interface AreaPropertiesEditorProps {
  area: ClickableArea;
  onUpdate: (area: ClickableArea) => void;
  onDelete: () => void;
}

export const AreaPropertiesEditor: React.FC<AreaPropertiesEditorProps> = ({
  area,
  onUpdate,
  onDelete,
}) => {
  // Local state for the form
  const [name, setName] = useState(area.name);
  const [areaType, setAreaType] = useState<AreaType>(area.areaType);
  const [tooltip, setTooltip] = useState(area.tooltip || "");
  const [description, setDescription] = useState(area.description || "");
  const [fillColor, setFillColor] = useState(
    area.fillColor || "rgba(255, 255, 255, 0.3)",
  );
  const [strokeColor, setStrokeColor] = useState(
    area.strokeColor || "rgba(255, 255, 255, 0.6)",
  );

  // Photo area properties
  const [detailImage, setDetailImage] = useState(area.detailImage || "");

  // Puzzle area properties
  const [puzzleName, setPuzzleName] = useState(area.puzzleSpec?.name || "");
  const [puzzleDescription, setPuzzleDescription] = useState(
    area.puzzleSpec?.description || "",
  );
  const [returnType, setReturnType] = useState(
    area.puzzleSpec?.returnType || "number",
  );
  const [returnDescription, setReturnDescription] = useState(
    area.puzzleSpec?.returnDescription || "",
  );
  const [expectedValue, setExpectedValue] = useState<string>(
    area.expectedValue !== undefined ? String(area.expectedValue) : "",
  );

  // Info/Data area properties
  const [dataContent, setDataContent] = useState<string>(
    typeof area.dataContent === "string"
      ? area.dataContent
      : area.dataContent !== undefined
        ? JSON.stringify(area.dataContent, null, 2)
        : "",
  );
  const [dataType, setDataType] = useState(area.dataType || "text");
  const [processingHint, setProcessingHint] = useState(
    area.processingHint || "",
  );

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler for image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setDetailImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save changes
  const handleSave = () => {
    // Create updated area with basic properties
    const updatedArea: ClickableArea = {
      ...area,
      name,
      areaType,
      tooltip,
      description,
      fillColor,
      strokeColor,
    };

    // Add type-specific properties
    if (areaType === "photo") {
      updatedArea.detailImage = detailImage;
    }

    if (areaType === "puzzle") {
      // Create puzzle spec
      const puzzleSpec: PuzzleSpec = {
        name: puzzleName || `puzzle_${area.id}`,
        description: puzzleDescription,
        returnType,
        returnDescription,
      };

      updatedArea.puzzleSpec = puzzleSpec;

      // Handle expected value based on return type
      if (expectedValue) {
        if (returnType === "number") {
          updatedArea.expectedValue = Number(expectedValue);
        } else if (returnType === "boolean") {
          updatedArea.expectedValue = expectedValue.toLowerCase() === "true";
        } else {
          updatedArea.expectedValue = expectedValue;
        }
      } else {
        updatedArea.expectedValue = undefined;
      }
    }

    if (areaType === "info" || areaType === "data") {
      updatedArea.dataType = dataType;
      updatedArea.processingHint = processingHint;

      // Parse data content based on data type
      if (dataContent) {
        if (
          dataType === "array" ||
          dataType === "json" ||
          dataType === "stream"
        ) {
          try {
            updatedArea.dataContent = JSON.parse(dataContent);
          } catch (e) {
            alert("Invalid JSON format for data content. Using as plain text.");
            updatedArea.dataContent = dataContent;
          }
        } else {
          updatedArea.dataContent = dataContent;
        }
      } else {
        updatedArea.dataContent = undefined;
      }
    }

    // Update the area
    onUpdate(updatedArea);
  };

  return (
    <div className="area-properties-editor">
      <h3>Edit Area: {area.name}</h3>

      <div className="properties-form">
        <div className="form-section">
          <h4>Basic Properties</h4>

          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="areaType">Type:</label>
            <select
              id="areaType"
              value={areaType}
              onChange={(e) => setAreaType(e.target.value as AreaType)}
            >
              <option value="info">Info</option>
              <option value="puzzle">Puzzle</option>
              <option value="photo">Photo</option>
              <option value="data">Data</option>
              <option value="interactive">Interactive</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tooltip">Tooltip:</label>
            <input
              type="text"
              id="tooltip"
              value={tooltip}
              onChange={(e) => setTooltip(e.target.value)}
              placeholder="Hover text for this area"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this area represents"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="fillColor">Fill Color:</label>
            <input
              type="text"
              id="fillColor"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              placeholder="rgba(255, 255, 255, 0.3)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="strokeColor">Stroke Color:</label>
            <input
              type="text"
              id="strokeColor"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              placeholder="rgba(255, 255, 255, 0.6)"
            />
          </div>
        </div>

        {/* Type-specific properties */}
        {areaType === "photo" && (
          <div className="form-section">
            <h4>Photo Properties</h4>

            <div className="form-group">
              <label htmlFor="detailImage">Detail Image URL:</label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="detailImage"
                  value={detailImage}
                  onChange={(e) => setDetailImage(e.target.value)}
                  placeholder="URL to detailed image"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-button"
                >
                  Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {detailImage && (
              <div className="image-preview">
                <h5>Image Preview:</h5>
                <img
                  src={detailImage}
                  alt="Detail Preview"
                  style={{ maxWidth: "100%", maxHeight: "200px" }}
                />
              </div>
            )}
          </div>
        )}

        {areaType === "puzzle" && (
          <div className="form-section">
            <h4>Puzzle Properties</h4>

            <div className="form-group">
              <label htmlFor="puzzleName">Puzzle Name (internal):</label>
              <input
                type="text"
                id="puzzleName"
                value={puzzleName}
                onChange={(e) => setPuzzleName(e.target.value)}
                placeholder="camelCase name (e.g. solveMathPuzzle)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="puzzleDescription">Puzzle Description:</label>
              <textarea
                id="puzzleDescription"
                value={puzzleDescription}
                onChange={(e) => setPuzzleDescription(e.target.value)}
                placeholder="Detailed instructions for the puzzle"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="returnType">Return Type:</label>
              <select
                id="returnType"
                value={returnType}
                onChange={(e) => setReturnType(e.target.value)}
              >
                <option value="number">Number</option>
                <option value="string">String</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="returnDescription">Return Description:</label>
              <input
                type="text"
                id="returnDescription"
                value={returnDescription}
                onChange={(e) => setReturnDescription(e.target.value)}
                placeholder="What value to return"
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedValue">Expected Value:</label>
              <input
                type="text"
                id="expectedValue"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                placeholder={`${returnType === "number" ? "123" : returnType === "boolean" ? "true" : "text"}`}
              />
            </div>
          </div>
        )}

        {(areaType === "info" || areaType === "data") && (
          <div className="form-section">
            <h4>{areaType === "info" ? "Information" : "Data"} Properties</h4>

            <div className="form-group">
              <label htmlFor="dataType">Data Type:</label>
              <select
                id="dataType"
                value={dataType}
                onChange={(e) => setDataType(e.target.value as any)}
              >
                <option value="text">Text</option>
                <option value="array">Array</option>
                <option value="encrypted">Encrypted</option>
                <option value="json">JSON</option>
                <option value="stream">Stream</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dataContent">Content:</label>
              <textarea
                id="dataContent"
                value={dataContent}
                onChange={(e) => setDataContent(e.target.value)}
                placeholder={
                  dataType === "json" || dataType === "array"
                    ? "[ ] or { }"
                    : "Text content"
                }
                rows={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="processingHint">Processing Hint:</label>
              <input
                type="text"
                id="processingHint"
                value={processingHint}
                onChange={(e) => setProcessingHint(e.target.value)}
                placeholder="Hint for processing this data"
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
          <button className="delete-button" onClick={onDelete}>
            Delete Area
          </button>
        </div>
      </div>
    </div>
  );
};
