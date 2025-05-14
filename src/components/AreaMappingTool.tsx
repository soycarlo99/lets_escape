// src/components/AreaMappingTool.tsx
import React, { useState, useRef, useEffect } from "react";
import { ClickableArea } from "../types/clickableAreas";

interface AreaMappingToolProps {
  imageSrc: string;
  onAreaCreated: (area: Partial<ClickableArea>) => void;
}

export const AreaMappingTool: React.FC<AreaMappingToolProps> = ({
  imageSrc,
  onAreaCreated,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState<"rect" | "circle">("rect");
  const [areaName, setAreaName] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to original image coordinates
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const originalX = Math.round(x * scaleX);
    const originalY = Math.round(y * scaleY);

    setStartPoint({ x: originalX, y: originalY });
    setEndPoint({ x: originalX, y: originalY });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isDrawing || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to original image coordinates
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const originalX = Math.round(x * scaleX);
    const originalY = Math.round(y * scaleY);

    setEndPoint({ x: originalX, y: originalY });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    // Calculate the area coordinates based on the shape
    let coords: number[] = [];

    if (shape === "rect") {
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      coords = [minX, minY, width, height];
    } else if (shape === "circle") {
      const cx = startPoint.x;
      const cy = startPoint.y;
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) +
          Math.pow(endPoint.y - startPoint.y, 2),
      );

      coords = [cx, cy, Math.round(radius)];
    }

    // Generate a temporary area
    const newArea: Partial<ClickableArea> = {
      id: `area-${Date.now()}`,
      name: areaName || `New ${shape === "rect" ? "Rectangle" : "Circle"}`,
      shape,
      coords,
      action: "default",
      tooltip: `Interact with ${areaName || "this object"}`,
    };

    // Send the area to the parent component
    onAreaCreated(newArea);

    // Reset the drawing state
    setIsDrawing(false);
    setAreaName("");
  };

  return (
    <div className="area-mapping-tool">
      <div className="controls">
        <input
          type="text"
          placeholder="Area name"
          value={areaName}
          onChange={(e) => setAreaName(e.target.value)}
        />
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as "rect" | "circle")}
        >
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
        <div>Draw a shape by clicking and dragging on the image.</div>
      </div>

      <div style={{ position: "relative" }}>
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Image Map"
          style={{ maxWidth: "100%" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        />

        {isDrawing && shape === "rect" && (
          <div
            style={{
              position: "absolute",
              left:
                (Math.min(startPoint.x, endPoint.x) /
                  (imageRef.current?.naturalWidth || 1)) *
                  100 +
                "%",
              top:
                (Math.min(startPoint.y, endPoint.y) /
                  (imageRef.current?.naturalHeight || 1)) *
                  100 +
                "%",
              width:
                (Math.abs(endPoint.x - startPoint.x) /
                  (imageRef.current?.naturalWidth || 1)) *
                  100 +
                "%",
              height:
                (Math.abs(endPoint.y - startPoint.y) /
                  (imageRef.current?.naturalHeight || 1)) *
                  100 +
                "%",
              border: "2px dashed red",
              background: "rgba(255, 0, 0, 0.2)",
              pointerEvents: "none",
            }}
          />
        )}

        {isDrawing && shape === "circle" && (
          <div
            style={{
              position: "absolute",
              left:
                ((startPoint.x -
                  Math.sqrt(
                    Math.pow(endPoint.x - startPoint.x, 2) +
                      Math.pow(endPoint.y - startPoint.y, 2),
                  )) /
                  (imageRef.current?.naturalWidth || 1)) *
                  100 +
                "%",
              top:
                ((startPoint.y -
                  Math.sqrt(
                    Math.pow(endPoint.x - startPoint.x, 2) +
                      Math.pow(endPoint.y - startPoint.y, 2),
                  )) /
                  (imageRef.current?.naturalHeight || 1)) *
                  100 +
                "%",
              width:
                ((Math.sqrt(
                  Math.pow(endPoint.x - startPoint.x, 2) +
                    Math.pow(endPoint.y - startPoint.y, 2),
                ) *
                  2) /
                  (imageRef.current?.naturalWidth || 1)) *
                  100 +
                "%",
              height:
                ((Math.sqrt(
                  Math.pow(endPoint.x - startPoint.x, 2) +
                    Math.pow(endPoint.y - startPoint.y, 2),
                ) *
                  2) /
                  (imageRef.current?.naturalHeight || 1)) *
                  100 +
                "%",
              borderRadius: "50%",
              border: "2px dashed red",
              background: "rgba(255, 0, 0, 0.2)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      <div className="output">
        <h3>Generated Coordinates:</h3>
        <pre>
          {isDrawing &&
            JSON.stringify(
              {
                shape,
                coords:
                  shape === "rect"
                    ? [
                        Math.min(startPoint.x, endPoint.x),
                        Math.min(startPoint.y, endPoint.y),
                        Math.abs(endPoint.x - startPoint.x),
                        Math.abs(endPoint.y - startPoint.y),
                      ]
                    : [
                        startPoint.x,
                        startPoint.y,
                        Math.round(
                          Math.sqrt(
                            Math.pow(endPoint.x - startPoint.x, 2) +
                              Math.pow(endPoint.y - startPoint.y, 2),
                          ),
                        ),
                      ],
              },
              null,
              2,
            )}
        </pre>
      </div>
    </div>
  );
};
