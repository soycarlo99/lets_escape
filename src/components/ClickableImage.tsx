import React, { useState, useEffect, useRef } from "react";
import { ClickableArea } from "../types/clickableAreas.ts";

interface ClickableImageProps {
  imageSrc?: string;
  areas?: ClickableArea[]; // Allow passing areas as props (optional)
}

export const ClickableImage: React.FC<ClickableImageProps> = ({
  imageSrc,
  areas = [], // Default to empty array if not provided
}) => {
  // Track which area is being hovered
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<ClickableArea | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set the actual dimensions of your image here
  const originalWidth = 1920;
  const originalHeight = 1080;

  // Handle mouse movement to track coordinates
  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert screen coordinates to original image coordinates
    const scaleX = originalWidth / rect.width;
    const scaleY = originalHeight / rect.height;

    const originalX = Math.round(x * scaleX);
    const originalY = Math.round(y * scaleY);

    setMousePosition({ x: originalX, y: originalY });
  };

  // Define clickable areas (combine with any passed in props)
  const clickableAreas: ClickableArea[] = [...areas];

  // Update dimensions when image loads or resizes
  useEffect(() => {
    if (!imgRef.current) return;

    // Function to update dimensions based on the actual rendered image
    const updateDimensions = () => {
      if (imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial update when image loads
    imgRef.current.onload = updateDimensions;

    // Handle already loaded images
    if (imgRef.current.complete) {
      updateDimensions();
    }

    // Use ResizeObserver for more accurate size tracking than window.resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === imgRef.current) {
          updateDimensions();
        }
      }
    });

    // Start observing the image
    resizeObserver.observe(imgRef.current);

    // Also listen for window resize events as a fallback
    window.addEventListener("resize", updateDimensions);

    // Cleanup
    return () => {
      if (imgRef.current) {
        resizeObserver.unobserve(imgRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Function to handle going back from zoomed view
  const handleBackClick = () => {
    setIsZooming(false);
    // Add a timeout to clear the image only after the fade out animation completes
    setTimeout(() => {
      setZoomedImage(null);
      setImageError(null); // Reset any error state
    }, 500); // This should match the transition duration in CSS
  };

  // Handle image loading error
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    console.error("Error loading image:", e);
    setImageError(`Failed to load image: ${zoomedImage}`);
  };

  // Toggle the info panel
  const toggleInfoPanel = () => {
    // If there's no selected area yet, use the last hovered area
    if (!selectedArea && hoveredAreaId) {
      const area = clickableAreas.find((a) => a.id === hoveredAreaId);
      if (area) {
        setSelectedArea(area);
      }
    }

    setShowInfoPanel(!showInfoPanel);
  };

  // Handle click on any clickable area
  const handleAreaClick = (area: ClickableArea) => {
    console.log(`Clicked on area: ${area.id}`);

    // Set the selected area for the info panel
    setSelectedArea(area);

    switch (area.action) {
      case "mirror":
        if (area.detailImage) {
          console.log(`Setting zoomed image to: ${area.detailImage}`);
          setZoomedImage(area.detailImage);
          setIsZooming(true);
          setImageError(null); // Reset any previous errors
        } else {
          alert(
            `You examine the ${area.name}. It reflects a distorted image of yourself.`,
          );
        }
        break;
      case "door":
        alert(`You try the ${area.name}. It appears to be locked.`);
        break;
      case "desk":
        alert(
          `You look at the ${area.name}. There are some papers and a drawer.`,
        );
        break;
      default:
        alert(`You interact with the ${area.name}.`);
    }
  };

  const imagePath = imageSrc || "/haunted-room.jpg";

  // Helper function to render different SVG shapes based on the area type
  const renderShape = (area: ClickableArea) => {
    const isHovered = hoveredAreaId === area.id;
    const fill = isHovered
      ? area.fillColor || "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0)";
    const stroke = isHovered
      ? area.strokeColor || "rgba(255, 255, 255, 0.6)"
      : "rgba(0, 0, 0, 0)";

    if (area.shape === "rect") {
      const [x, y, width, height] = area.coords;
      return (
        <rect
          key={area.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          className="clickable-shape"
          onClick={() => handleAreaClick(area)}
          onMouseEnter={() => setHoveredAreaId(area.id)}
          onMouseLeave={() => setHoveredAreaId(null)}
        />
      );
    } else if (area.shape === "circle") {
      const [cx, cy, r] = area.coords;
      return (
        <circle
          key={area.id}
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          className="clickable-shape"
          onClick={() => handleAreaClick(area)}
          onMouseEnter={() => setHoveredAreaId(area.id)}
          onMouseLeave={() => setHoveredAreaId(null)}
        />
      );
    } else if (area.shape === "poly") {
      const points = area.coords
        .map((coord, i) => {
          return i % 2 === 0 ? `${coord},` : coord;
        })
        .join(" ");
      return (
        <polygon
          key={area.id}
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth="2"
          className="clickable-shape"
          onClick={() => handleAreaClick(area)}
          onMouseEnter={() => setHoveredAreaId(area.id)}
          onMouseLeave={() => setHoveredAreaId(null)}
        />
      );
    }

    return null;
  };

  return (
    <div ref={containerRef} className="clickable-image-container">
      {/* Background image */}
      <img
        ref={imgRef}
        src={imagePath}
        alt="Haunted Room"
        onMouseMove={handleMouseMove}
        className={isZooming ? "fade-out" : ""}
      />

      {/* SVG overlay - positioned absolutely to match image exactly */}
      {dimensions.width > 0 && !isZooming && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${originalWidth} ${originalHeight}`}
          className="svg-overlay"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Render all clickable areas */}
          {clickableAreas.map((area) => renderShape(area))}

          {/* Optional: Show tooltips for hovered areas */}
          {hoveredAreaId && (
            <g>
              {clickableAreas
                .filter((area) => area.id === hoveredAreaId && area.tooltip)
                .map((area) => {
                  // Calculate tooltip position based on area type
                  let tooltipX, tooltipY;
                  if (area.shape === "rect") {
                    const [x, y, width] = area.coords;
                    tooltipX = x + width / 2;
                    tooltipY = y - 10; // Position above the rectangle
                  } else if (area.shape === "circle") {
                    const [cx, cy, r] = area.coords;
                    tooltipX = cx;
                    tooltipY = cy - r - 10; // Position above the circle
                  } else {
                    // For polygons, use the first pair of coordinates
                    tooltipX = area.coords[0];
                    tooltipY = area.coords[1] - 10;
                  }

                  return (
                    <g key={`tooltip-${area.id}`}>
                      <rect
                        x={tooltipX - 60}
                        y={tooltipY - 20}
                        width={120}
                        height={24}
                        rx={5}
                        className="tooltip-background"
                      />
                      <text
                        x={tooltipX}
                        y={tooltipY - 5}
                        textAnchor="middle"
                        className="tooltip-text"
                      >
                        {area.tooltip}
                      </text>
                    </g>
                  );
                })}
            </g>
          )}
        </svg>
      )}

      {/* Read Button (Book Icon) */}
      {!isZooming && (
        <button
          onClick={toggleInfoPanel}
          className={`book-button ${showInfoPanel ? "active" : ""}`}
          style={{
            background: `url(/book.png) no-repeat center center`,
            backgroundSize: "contain",
          }}
          aria-label="Toggle Information Panel"
          title="Read Information"
        />
      )}

      {/* Information Panel */}
      {showInfoPanel && selectedArea && (
        <div className="info-panel">
          <h3>{selectedArea.name}</h3>
          <div>
            {selectedArea.description ||
              "No information available about this item."}
          </div>
          <button
            onClick={() => setShowInfoPanel(false)}
            className="close-button"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* ZOOMED IMAGE VIEW */}
      {isZooming && (
        <div className="zoomed-overlay">
          {/* Back button in top-left corner using back.svg */}
          <button
            onClick={handleBackClick}
            className="back-button"
            style={{
              background: `url(/back.svg) no-repeat center center`,
              backgroundSize: "contain",
            }}
            onMouseOver={(e) => {
              e.currentTarget.classList.add("hover");
            }}
            onMouseOut={(e) => {
              e.currentTarget.classList.remove("hover");
            }}
            aria-label="Return to Room"
            title="Return to Room"
          />

          {/* Show error message if image fails to load */}
          {imageError && (
            <div className="image-error-message">{imageError}</div>
          )}

          {/* Display the image */}
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt="Detailed view"
              className="zoomed-image"
              onError={handleImageError}
            />
          )}
        </div>
      )}

      {/* Debug overlay - show coordinates when moving over the image */}
      <div
        className="debug-coordinates"
        style={{
          display: isZooming ? "none" : "block",
        }}
      >
        Image coords: {mousePosition.x}, {mousePosition.y}
      </div>
    </div>
  );
};
