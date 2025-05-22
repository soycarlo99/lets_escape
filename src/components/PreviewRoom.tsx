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
  const [offset, setOffset] = useState({ left: 0, top: 0 });

  // State for image natural size and rendered size
  const [naturalSize, setNaturalSize] = useState({ width: 16, height: 9 });
  const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Track image natural and rendered size
  useEffect(() => {
    setImageLoaded(false);
    const updateSizes = () => {
      if (imageRef.current) {
        setNaturalSize({
          width: imageRef.current.naturalWidth,
          height: imageRef.current.naturalHeight,
        });
        const rect = imageRef.current.getBoundingClientRect();
        setRenderedSize({ width: rect.width, height: rect.height });
        setImageLoaded(true);
      }
    };
    if (imageRef.current) {
      imageRef.current.onload = updateSizes;
      if (imageRef.current.complete) updateSizes();
      const resizeObserver = new window.ResizeObserver(updateSizes);
      resizeObserver.observe(imageRef.current);
      window.addEventListener("resize", updateSizes);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", updateSizes);
      };
    }
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
    const isHovered = hoveredAreaId === area.id;
    const colors = getAreaTypeColor(area.areaType);
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
      return <rect x={x} y={y} width={width} height={height} {...shapeProps} />;
    } else if (area.shape === "circle") {
      const [cx, cy, r] = area.coords;
      return <circle cx={cx} cy={cy} r={r} {...shapeProps} />;
    } else if (area.shape === "poly") {
      const points = area.coords
        .map((coord, i) => (i % 2 === 0 ? `${coord},` : coord))
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
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          aspectRatio: `${naturalSize.width} / ${naturalSize.height}`,
          background: "#222",
        }}
      >
        <img
          ref={imageRef}
          src={imageSrc}
          alt="Room Preview"
          className="preview-image"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
        {imageLoaded && renderedSize.width > 0 && renderedSize.height > 0 && (
          <svg
            ref={svgRef}
            className="preview-svg"
            width={renderedSize.width}
            height={renderedSize.height}
            viewBox={`0 0 ${naturalSize.width} ${naturalSize.height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {areas.map(renderShape)}
            {/* Tooltips */}
            {hoveredAreaId && (
              <g>
                {areas
                  .filter((area) => area.id === hoveredAreaId && area.tooltip)
                  .map((area) => {
                    let tooltipX, tooltipY;
                    if (area.shape === "rect") {
                      const [x, y, width] = area.coords;
                      tooltipX = x + width / 2;
                      tooltipY = y - 10;
                    } else if (area.shape === "circle") {
                      const [cx, cy, r] = area.coords;
                      tooltipX = cx;
                      tooltipY = cy - r - 10;
                    } else {
                      tooltipX = area.coords[0];
                      tooltipY = area.coords[1] - 10;
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
