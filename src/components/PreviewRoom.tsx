import React, { useState, useRef, useEffect } from "react";
import { ClickableArea } from "../types/clickableAreas";

interface PreviewRoomProps {
  imageSrc: string;
  areas: ClickableArea[];
}

export const PreviewRoom: React.FC<PreviewRoomProps> = ({
  imageSrc,
  areas,
}) => {
  // State for hovering and displaying area information
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<ClickableArea | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Update dimensions when image loads
  useEffect(() => {
    const updateDimensions = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Update on image load
    if (imageRef.current) {
      if (imageRef.current.complete) {
        updateDimensions();
      } else {
        imageRef.current.onload = updateDimensions;
      }
    }

    // Update on window resize
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [imageSrc]);

  // Handle area click
  const handleAreaClick = (area: ClickableArea) => {
    setSelectedArea(area);
  };

  // Get color for area type
  const getAreaTypeColor = (type: string): { fill: string; stroke: string } => {
    switch (type) {
      case "photo":
        return {
          fill: "rgba(255, 215, 0, 0.3)",
          stroke: "rgba(255, 215, 0, 0.6)",
        };
      case "puzzle":
        return {
          fill: "rgba(255, 165, 0, 0.3)",
          stroke: "rgba(255, 165, 0, 0.6)",
        };
      case "info":
        return {
          fill: "rgba(0, 191, 255, 0.3)",
          stroke: "rgba(0, 191, 255, 0.6)",
        };
      case "data":
        return {
          fill: "rgba(128, 0, 128, 0.3)",
          stroke: "rgba(128, 0, 128, 0.6)",
        };
      default:
        return {
          fill: "rgba(255, 255, 255, 0.3)",
          stroke: "rgba(255, 255, 255, 0.6)",
        };
    }
  };

  // Render SVG shape for an area
  const renderShape = (area: ClickableArea) => {
    if (!imageRef.current) return null;

    const isHovered = hoveredAreaId === area.id;
    const colors = getAreaTypeColor(area.areaType);

    // Calculate scaling factors - this is key to correct display
    const displayWidth = dimensions.width;
    const displayHeight = dimensions.height;
    const naturalWidth = imageRef.current.naturalWidth;
    const naturalHeight = imageRef.current.naturalHeight;

    const scaleX = displayWidth / naturalWidth;
    const scaleY = displayHeight / naturalHeight;

    // Use custom colors if defined
    const fillColor = isHovered
      ? area.fillColor || colors.fill
      : "rgba(0, 0, 0, 0)";

    const strokeColor = isHovered
      ? area.strokeColor || colors.stroke
      : "rgba(0, 0, 0, 0)";

    const shapeProps = {
      key: area.id,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: "2",
      style: {
        cursor: "pointer",
        pointerEvents: "auto" as const,
        transition: "all 0.3s ease",
      },
      onClick: () => handleAreaClick(area),
      onMouseEnter: () => setHoveredAreaId(area.id),
      onMouseLeave: () => setHoveredAreaId(null),
    };

    if (area.shape === "rect") {
      const [x, y, width, height] = area.coords;
      // Scale coordinates from natural image size to display size
      return (
        <rect
          x={x * scaleX}
          y={y * scaleY}
          width={width * scaleX}
          height={height * scaleY}
          {...shapeProps}
        />
      );
    } else if (area.shape === "circle") {
      const [cx, cy, r] = area.coords;
      // Scale coordinates from natural image size to display size
      return (
        <circle
          cx={cx * scaleX}
          cy={cy * scaleY}
          r={r * scaleX}
          {...shapeProps}
        />
      );
    } else if (area.shape === "poly") {
      // Scale all polygon points
      const points = area.coords
        .map((coord, i) => {
          // Scale each coordinate based on whether it's x (even index) or y (odd index)
          const scaledCoord = i % 2 === 0 ? coord * scaleX : coord * scaleY;
          return i % 2 === 0 ? `${scaledCoord},` : scaledCoord;
        })
        .join(" ");

      return <polygon points={points} {...shapeProps} />;
    }

    return null;
  };

  return (
    <div className="preview-room" ref={containerRef}>
      <div className="preview-header">
        <h3>Interactive Preview</h3>
        <p>Hover over areas to see tooltips, click to view details</p>
      </div>

      <div className="preview-image-container">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Room Preview"
          className="preview-image"
        />

        {/* SVG overlay for interactive areas */}
        {dimensions.width > 0 && (
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            className="preview-svg"
            preserveAspectRatio="xMidYMid slice"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
            }}
          >
            {areas.map(renderShape)}

            {/* Tooltips */}
            {hoveredAreaId && imageRef.current && (
              <g>
                {areas
                  .filter((area) => area.id === hoveredAreaId && area.tooltip)
                  .map((area) => {
                    // Calculate scaling factors
                    const displayWidth = dimensions.width;
                    const displayHeight = dimensions.height;
                    const naturalWidth = imageRef.current!.naturalWidth;
                    const naturalHeight = imageRef.current!.naturalHeight;

                    const scaleX = displayWidth / naturalWidth;
                    const scaleY = displayHeight / naturalHeight;

                    let tooltipX, tooltipY;
                    if (area.shape === "rect") {
                      const [x, y, width] = area.coords;
                      tooltipX = (x + width / 2) * scaleX;
                      tooltipY = y * scaleY - 10;
                    } else if (area.shape === "circle") {
                      const [cx, cy, r] = area.coords;
                      tooltipX = cx * scaleX;
                      tooltipY = (cy - r) * scaleY - 10;
                    } else {
                      // For polygons, use first point
                      tooltipX = area.coords[0] * scaleX;
                      tooltipY = area.coords[1] * scaleY - 10;
                    }

                    return (
                      <g key={`tooltip-${area.id}`}>
                        <rect
                          x={tooltipX - 80}
                          y={tooltipY - 30}
                          width={160}
                          height={40}
                          rx={5}
                          fill="rgba(0, 0, 0, 0.8)"
                          stroke="white"
                          strokeWidth={1}
                        />
                        <text
                          x={tooltipX}
                          y={tooltipY - 15}
                          textAnchor="middle"
                          fill="white"
                          fontSize="14"
                          fontFamily="Arial"
                        >
                          {area.tooltip}
                        </text>
                        <text
                          x={tooltipX}
                          y={tooltipY - 2}
                          textAnchor="middle"
                          fill="#ccc"
                          fontSize="11"
                          fontFamily="Arial"
                        >
                          {area.areaType.toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Info panel for selected area */}
      {selectedArea && (
        <div className="preview-info-panel">
          <div className="preview-info-header">
            <h4>{selectedArea.name}</h4>
            <span
              className={`area-type-badge area-type-${selectedArea.areaType}`}
            >
              {selectedArea.areaType}
            </span>
            <button
              className="close-button"
              onClick={() => setSelectedArea(null)}
            >
              ×
            </button>
          </div>

          <div className="preview-info-content">
            {selectedArea.description && (
              <p className="description">{selectedArea.description}</p>
            )}

            {selectedArea.areaType === "photo" && selectedArea.detailImage && (
              <div className="detail-image">
                <h5>Detail Image:</h5>
                <img
                  src={selectedArea.detailImage}
                  alt={`${selectedArea.name} Detail`}
                  style={{ maxWidth: "100%", maxHeight: "200px" }}
                />
              </div>
            )}

            {selectedArea.areaType === "puzzle" && (
              <div className="puzzle-info">
                <h5>Puzzle Information:</h5>
                {selectedArea.puzzleSpec && (
                  <>
                    <p>
                      <strong>Challenge:</strong>{" "}
                      {selectedArea.puzzleSpec.description}
                    </p>
                    <p>
                      <strong>Return Type:</strong>{" "}
                      {selectedArea.puzzleSpec.returnType}
                    </p>
                    {selectedArea.expectedValue !== undefined && (
                      <p>
                        <strong>Expected Value:</strong>{" "}
                        {String(selectedArea.expectedValue)}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {(selectedArea.areaType === "info" ||
              selectedArea.areaType === "data") &&
              selectedArea.dataContent && (
                <div className="data-info">
                  <h5>{selectedArea.dataType || "Data"} Content:</h5>
                  <pre className="data-content">
                    {typeof selectedArea.dataContent === "string"
                      ? selectedArea.dataContent
                      : JSON.stringify(selectedArea.dataContent, null, 2)}
                  </pre>
                  {selectedArea.processingHint && (
                    <p className="processing-hint">
                      <strong>Hint:</strong> {selectedArea.processingHint}
                    </p>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Areas list */}
      <div className="preview-areas-list">
        <h4>All Areas</h4>
        <div className="areas-grid">
          {areas.map((area) => (
            <div
              key={area.id}
              className={`area-card ${selectedArea?.id === area.id ? "selected" : ""}`}
              onClick={() => handleAreaClick(area)}
            >
              <div className="area-card-header">
                <span className="area-name">{area.name}</span>
                <span
                  className={`area-type-indicator area-type-${area.areaType}`}
                >
                  {area.areaType}
                </span>
              </div>
              <div className="area-card-shape">
                {area.shape === "rect"
                  ? "Rectangle"
                  : area.shape === "circle"
                    ? "Circle"
                    : "Polygon"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
