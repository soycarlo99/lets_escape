import React, { useState, useRef, useEffect } from "react";
import { ClickableArea, AreaType } from "../types/clickableAreas";

interface AreaDrawingToolProps {
  imageSrc: string;
  onAreaCreated: (area: Partial<ClickableArea>) => void;
  areas: ClickableArea[];
  onSelectArea: (index: number) => void;
}

export const AreaDrawingTool: React.FC<AreaDrawingToolProps> = ({
  imageSrc,
  onAreaCreated,
  areas,
  onSelectArea,
}) => {
  // State for drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [shape, setShape] = useState<"rect" | "circle" | "poly">("rect");
  const [areaType, setAreaType] = useState<AreaType>("info");
  const [areaName, setAreaName] = useState("");
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

  // For polygon drawing
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);

  // Refs
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State for image offset and size
  const [imgRect, setImgRect] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Set up drawing canvas
  useEffect(() => {
    const updateCanvasSize = () => {
      if (imageRef.current && canvasRef.current && containerRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setImgRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
        // Make the canvas match the displayed image size exactly
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        // Set the CSS size to match the display size
        canvasRef.current.style.width = `${rect.width}px`;
        canvasRef.current.style.height = `${rect.height}px`;
        // Position the canvas absolutely at the image's offset
        canvasRef.current.style.left = `${imageRef.current.offsetLeft}px`;
        canvasRef.current.style.top = `${imageRef.current.offsetTop}px`;
      }
    };
    // Update on image load
    if (imageRef.current) {
      if (imageRef.current.complete) {
        updateCanvasSize();
      } else {
        imageRef.current.onload = updateCanvasSize;
      }
    }
    // Update on window resize
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [imageSrc]);

  // Draw all existing areas on the canvas
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Calculate scale factors between original image and displayed image
    const displayWidth = canvasRef.current.width;
    const displayHeight = canvasRef.current.height;
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    // Draw existing areas
    areas.forEach((area, index) => {
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;

      // Convert original image coordinates to display coordinates
      if (area.shape === "rect") {
        const [x, y, width, height] = area.coords;
        const displayX = x / scaleX;
        const displayY = y / scaleY;
        const displayWidth = width / scaleX;
        const displayHeight = height / scaleY;

        ctx.strokeRect(displayX, displayY, displayWidth, displayHeight);

        // Add label
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(displayX, displayY - 20, area.name.length * 8, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.fillText(area.name, displayX + 5, displayY - 5);
      } else if (area.shape === "circle") {
        const [cx, cy, radius] = area.coords;
        const displayCx = cx / scaleX;
        const displayCy = cy / scaleY;
        const displayRadius = radius / scaleX;

        ctx.beginPath();
        ctx.arc(displayCx, displayCy, displayRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Add label
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(
          displayCx - area.name.length * 4,
          displayCy - displayRadius - 20,
          area.name.length * 8,
          20,
        );
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.fillText(
          area.name,
          displayCx - area.name.length * 4 + 5,
          displayCy - displayRadius - 5,
        );
      } else if (area.shape === "poly") {
        if (area.coords.length < 6) return; // Need at least 3 points for a polygon

        ctx.beginPath();

        // Convert first point
        const firstX = area.coords[0] / scaleX;
        const firstY = area.coords[1] / scaleY;
        ctx.moveTo(firstX, firstY);

        // Convert and draw all points
        for (let i = 2; i < area.coords.length; i += 2) {
          const pointX = area.coords[i] / scaleX;
          const pointY = area.coords[i + 1] / scaleY;
          ctx.lineTo(pointX, pointY);
        }

        ctx.closePath();
        ctx.stroke();

        // Add label near the first point
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(firstX, firstY - 20, area.name.length * 8, 20);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "12px Arial";
        ctx.fillText(area.name, firstX + 5, firstY - 5);
      }

      // Add number indicator for easier selection
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.beginPath();

      // Convert coordinates for the number indicator
      const indicatorX = area.coords[0] / scaleX - 10;
      const indicatorY = area.coords[1] / scaleY - 10;

      ctx.arc(indicatorX, indicatorY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "10px Arial";
      ctx.fillText(
        (index + 1).toString(),
        indicatorX - 3 + (index + 1 < 10 ? 3 : 0),
        indicatorY + 3,
      );
    });

    // Draw current polygon in progress
    if (isDrawingPolygon && points.length > 0) {
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }

      if (points.length > 2) {
        ctx.lineTo(points[0].x, points[0].y); // Close the shape
      }

      ctx.stroke();

      // Draw points
      points.forEach((point, i) => {
        ctx.fillStyle = i === 0 ? "#00FF00" : "#FF0000";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw current rectangle or circle in progress
    if (isDrawing && !isDrawingPolygon) {
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;

      if (shape === "rect") {
        const x = Math.min(startPoint.x, endPoint.x);
        const y = Math.min(startPoint.y, endPoint.y);
        const width = Math.abs(endPoint.x - startPoint.x);
        const height = Math.abs(endPoint.y - startPoint.y);

        ctx.strokeRect(x, y, width, height);
      } else if (shape === "circle") {
        const radius = Math.sqrt(
          Math.pow(endPoint.x - startPoint.x, 2) +
            Math.pow(endPoint.y - startPoint.y, 2),
        );

        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [areas, isDrawing, isDrawingPolygon, startPoint, endPoint, points, shape]);

  // Handle mouse down to start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current) return;
    // Get the mouse position relative to the image, not just the canvas
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Only allow drawing within the image bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    // Calculate scale factors
    const displayWidth = canvasRef.current.width;
    const displayHeight = canvasRef.current.height;
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    // Convert to original image coordinates for hit testing
    const imageX = x * scaleX;
    const imageY = y * scaleY;

    // Check if we clicked on an existing area
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];

      if (isPointInArea(imageX, imageY, area)) {
        onSelectArea(i);
        return;
      }
    }

    // If polygon mode, handle differently
    if (shape === "poly") {
      if (!isDrawingPolygon) {
        // Start new polygon
        setIsDrawingPolygon(true);
        setPoints([{ x, y }]);
      } else {
        // Continue polygon, check if closing it
        const firstPoint = points[0];
        const distance = Math.sqrt(
          Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2),
        );

        if (distance < 20 && points.length > 2) {
          // Close the polygon and create the area
          finishPolygon();
        } else {
          // Add point to the polygon
          setPoints([...points, { x, y }]);
        }
      }
      return;
    }

    // For rectangle or circle
    setIsDrawing(true);
    setStartPoint({ x, y });
    setEndPoint({ x, y });
  };

  // Handle mouse move during drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (isDrawing) {
      setEndPoint({ x, y });
    }
  };

  // Handle mouse up to finish drawing
  const handleMouseUp = () => {
    if (!isDrawing || shape === "poly") return;

    finishShape();
  };

  // Check if a point is inside an area
  const isPointInArea = (
    x: number,
    y: number,
    area: ClickableArea,
  ): boolean => {
    if (area.shape === "rect") {
      const [areaX, areaY, width, height] = area.coords;
      return (
        x >= areaX && x <= areaX + width && y >= areaY && y <= areaY + height
      );
    } else if (area.shape === "circle") {
      const [cx, cy, radius] = area.coords;
      const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
      return distance <= radius;
    } else if (area.shape === "poly") {
      // Point-in-polygon algorithm
      let inside = false;
      for (
        let i = 0, j = area.coords.length - 2;
        i < area.coords.length;
        i += 2
      ) {
        const xi = area.coords[i],
          yi = area.coords[i + 1];
        const xj = area.coords[j],
          yj = area.coords[j + 1];

        const intersect =
          yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;

        j = i;
      }
      return inside;
    }

    return false;
  };

  // Finish drawing a shape
  const finishShape = () => {
    if (!imageRef.current || !canvasRef.current) return;

    // Calculate scale factors to convert to original image coordinates
    const displayWidth = canvasRef.current.width;
    const displayHeight = canvasRef.current.height;
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    let coords: number[] = [];

    if (shape === "rect") {
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      // Convert to original image coordinates
      coords = [
        Math.round(x * scaleX),
        Math.round(y * scaleY),
        Math.round(width * scaleX),
        Math.round(height * scaleY),
      ];
    } else if (shape === "circle") {
      const cx = startPoint.x;
      const cy = startPoint.y;
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) +
          Math.pow(endPoint.y - startPoint.y, 2),
      );

      // Convert to original image coordinates
      coords = [
        Math.round(cx * scaleX),
        Math.round(cy * scaleY),
        Math.round(radius * scaleX),
      ];
    }

    // Create the new area if it has a minimum size
    if (
      (shape === "rect" && coords[2] > 10 && coords[3] > 10) ||
      (shape === "circle" && coords[2] > 5)
    ) {
      onAreaCreated({
        name: areaName || `New ${shape === "rect" ? "Rectangle" : "Circle"}`,
        shape,
        coords,
        areaType,
        tooltip: `Interact with ${areaName || "this area"}`,
      });
    }

    setIsDrawing(false);
  };

  // Finish drawing a polygon
  const finishPolygon = () => {
    if (!imageRef.current || !canvasRef.current || points.length < 3) return;

    // Calculate scale factors to convert to original image coordinates
    const displayWidth = canvasRef.current.width;
    const displayHeight = canvasRef.current.height;
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;

    const scaleX = naturalWidth / displayWidth;
    const scaleY = naturalHeight / displayHeight;

    // Convert points to flat array of coordinates in original image space
    const coords: number[] = [];
    for (const point of points) {
      coords.push(Math.round(point.x * scaleX));
      coords.push(Math.round(point.y * scaleY));
    }

    onAreaCreated({
      name: areaName || "New Polygon",
      shape: "poly",
      coords,
      areaType,
      tooltip: `Interact with ${areaName || "this area"}`,
    });

    // Reset polygon drawing
    setIsDrawingPolygon(false);
    setPoints([]);
  };

  // Key handler for canceling polygon drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDrawingPolygon) {
          setIsDrawingPolygon(false);
          setPoints([]);
        } else if (isDrawing) {
          setIsDrawing(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawingPolygon, isDrawing]);

  // Double click to finish polygon
  const handleDoubleClick = () => {
    if (isDrawingPolygon && points.length > 2) {
      finishPolygon();
    }
  };

  return (
    <div className="area-drawing-tool">
      <div className="drawing-controls">
        <div className="control-group">
          <label htmlFor="shape">Shape:</label>
          <select
            id="shape"
            value={shape}
            onChange={(e) =>
              setShape(e.target.value as "rect" | "circle" | "poly")
            }
          >
            <option value="rect">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="poly">Polygon</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="areaType">Area Type:</label>
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

        <div className="control-group">
          <label htmlFor="areaName">Name:</label>
          <input
            type="text"
            id="areaName"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            placeholder={`New ${shape === "rect" ? "Rectangle" : shape === "circle" ? "Circle" : "Polygon"}`}
          />
        </div>
      </div>

      <div className="drawing-instructions">
        {shape === "poly" ? (
          isDrawingPolygon ? (
            <div className="instructions">
              <p>
                Click to add points to your polygon. Click near the starting
                point or double-click to complete it.
              </p>
              <p>Press ESC to cancel.</p>
              <button onClick={finishPolygon} disabled={points.length < 3}>
                Finish Polygon
              </button>
            </div>
          ) : (
            <p>Click anywhere on the image to start creating a polygon.</p>
          )
        ) : (
          <p>
            Click and drag to create a{" "}
            {shape === "rect" ? "rectangle" : "circle"}.
          </p>
        )}
      </div>

      <div
        className="drawing-canvas-container"
        ref={containerRef}
        style={{ position: "relative" }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Room Background"
          className="drawing-image"
          style={{ display: "block", maxWidth: "100%" }}
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          style={{
            position: "absolute",
            top: imageRef.current ? imageRef.current.offsetTop : 0,
            left: imageRef.current ? imageRef.current.offsetLeft : 0,
            width: imgRect.width,
            height: imgRect.height,
            pointerEvents: "all",
            cursor: isDrawingPolygon ? "crosshair" : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Treat leaving canvas as mouse up
          onDoubleClick={handleDoubleClick}
        />
      </div>

      <div className="existing-areas">
        <h3>Existing Areas ({areas.length})</h3>
        <div className="areas-list">
          {areas.map((area, index) => (
            <div
              key={area.id}
              className="area-item"
              onClick={() => onSelectArea(index)}
            >
              <span className="area-number">{index + 1}</span>
              <span className="area-name">{area.name}</span>
              <span className="area-type">{area.areaType}</span>
              <span className="area-shape">{area.shape}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
