import React, { useState, useEffect, useRef } from "react";
import { ClickableArea } from "../types/clickableAreas";
import { Language } from "../App";
import {
  generateTemplates,
  generateFunctionNames,
} from "../utils/templateGenerator";

// Update the onPuzzleSolved callback to also update the selected area in the parent component
export interface ClickableImageProps {
  imageSrc?: string;
  areas?: ClickableArea[]; // Allow passing areas as props (optional)
  currentCode?: string; // Current code from the editor
  currentLanguage?: Language; // Current selected language
  onPuzzleSolved?: (areaId: string) => void; // Callback when puzzle is solved
  onLoadCodeTemplate?: (template: string) => void; // Callback to load code template
  onSelectArea?: (area: ClickableArea) => void; // Callback when an area is selected
}

export const ClickableImage: React.FC<ClickableImageProps> = ({
  imageSrc,
  areas = [], // Default to empty array if not provided
  currentCode = "", // Default to empty string
  currentLanguage = "javascript", // Default to JavaScript
  onPuzzleSolved,
  onLoadCodeTemplate,
  onSelectArea,
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

  // Track completed puzzles locally
  const [completedPuzzles, setCompletedPuzzles] = useState<Set<string>>(
    new Set(),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Set the actual dimensions of your image here
  const originalWidth = 1920;
  const originalHeight = 1080;

  // Function to evaluate code and check if it produces the expected value
  const evaluateCode = (code: string, area: ClickableArea): any => {
    const functionName = area.functionNames?.[currentLanguage];

    if (!functionName) {
      console.error(`No function name provided for ${currentLanguage} in area ${area.id}`);
      // Optionally, alert the user or provide more direct feedback here if this configuration issue occurs
      return null;
    }

    try {
      // The script to be executed by new Function.
      // It includes the user's code and then attempts to call the specified function.
      const scriptToExecute = `
        ${code} // User's code is injected here.

        // After user's code, try to resolve the functionName to an actual function.
        // 'eval' here is used to resolve the function path (e.g., "myFunction" or "MyClass.myStaticMethod")
        // within the scope of this 'new Function' where 'code' has been executed.
        let callable;
        try {
          callable = eval('${functionName}');
        } catch (e) {
          // If eval throws (e.g., path doesn't exist or intermediate part is not an object),
          // callable will remain undefined, and the typeof check below will handle it.
        }

        if (typeof callable !== 'function') {
          throw new Error("Function or method '${functionName}' is not defined by your code, is not a function, or is not accessible with the specified path. Please check your function's definition and name.");
        }
        
        return callable(); // Call the resolved function/method.
      `;

      const evalFunc = new Function(scriptToExecute);
      return evalFunc();

    } catch (error) {
      // This catches errors from 'new Function' compilation or runtime errors from 'scriptToExecute'.
      console.error(`Error during code evaluation for function '${functionName}':`, error);
      // The checkSolution function, which calls this, will alert the user.
      return null;
    }
  };

  // Function to check if the solution is correct
  const checkSolution = (area: ClickableArea) => {
    if (!currentCode || currentCode.trim() === "") {
      alert("Please write some code in the editor first.");
      return;
    }

    if (area.expectedValue === undefined) {
      alert("This area doesn't have a puzzle to solve.");
      return;
    }

    // Make sure we have function names for this area
    if (!area.functionNames || !area.functionNames[currentLanguage]) {
      console.error(
        `No function name defined for ${currentLanguage} in area ${area.id}`,
      );
      alert(
        "Error: Could not determine the function to check. Please try again or reload the page.",
      );
      return;
    }

    try {
      const result = evaluateCode(currentCode, area);
      console.log("Code evaluation result:", result);

      if (result === area.expectedValue) {
        // Mark as solved locally
        const newCompletedPuzzles = new Set(completedPuzzles);
        newCompletedPuzzles.add(area.id);
        setCompletedPuzzles(newCompletedPuzzles);

        // Notify parent component
        if (onPuzzleSolved) {
          onPuzzleSolved(area.id);
        }

        alert(`Correct! You've solved the ${area.name} puzzle!`);
      } else {
        alert(`That doesn't seem to be the correct solution. Try again!`);
      }
    } catch (error: any) {
      alert(`Error checking your solution: ${error.message}`);
    }
  };

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

  // Generate templates for areas with puzzle specs based on current language
  useEffect(() => {
    // Process areas with puzzle specs
    areas.forEach((area) => {
      if (area.puzzleSpec) {
        // Generate templates and function names when needed
        area.codeTemplates = generateTemplates(area.puzzleSpec);
        area.functionNames = generateFunctionNames(area.puzzleSpec);
      }
    });

    // Re-select the current area to refresh its data if needed
    if (selectedArea) {
      const updatedArea = areas.find((a) => a.id === selectedArea.id);
      if (updatedArea) {
        setSelectedArea(updatedArea);
      }
    }
  }, [areas, currentLanguage]);

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
      const area = areas.find((a) => a.id === hoveredAreaId);
      if (area) {
        setSelectedArea(area);
      }
    }

    setShowInfoPanel(!showInfoPanel);
  };

  // Handle click on any clickable area
  const handleAreaClick = (area: ClickableArea) => {
    console.log(`Clicked on area: ${area.id}`);

    // Set the selected area for the info panel (ClickableImage's local state)
    setSelectedArea(area); // This updates ClickableImage's own local state for its info panel

    // Notify App.tsx about the selected area so it can update its own state
    if (typeof onSelectArea === "function") {
      onSelectArea(area); // This calls App.tsx's setSelectedArea function
    }

    // If this area has a code template for the current language, load it into the editor
    if (
      area.codeTemplates &&
      area.codeTemplates[currentLanguage] &&
      typeof onLoadCodeTemplate === "function"
    ) {
      onLoadCodeTemplate(area.codeTemplates[currentLanguage]);
    }

    // Show the info panel so users can check their solution
    setShowInfoPanel(true);

    // Handle specific actions based on the area type
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
        // Check if this puzzle has been completed
        if (completedPuzzles.has(area.id)) {
          alert(`The ${area.name} unlocks and swings open!`);
        } else {
          // Just show the info panel, don't show an alert
          console.log(`Door puzzle not yet solved. Showing info panel.`);
        }
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
    const isPuzzleSolved = completedPuzzles.has(area.id);

    // Change fill color if the puzzle is completed
    const fill = isPuzzleSolved
      ? "rgba(0, 255, 0, 0.3)" // Green for solved puzzles
      : isHovered
        ? area.fillColor || "rgba(255, 255, 255, 0.3)"
        : "rgba(0, 0, 0, 0)";

    const stroke = isPuzzleSolved
      ? "rgba(0, 255, 0, 0.6)" // Green for solved puzzles
      : isHovered
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
          style={{
            cursor: "pointer",
            pointerEvents: "auto",
            transition: "fill 0.3s ease",
          }}
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
          style={{
            cursor: "pointer",
            pointerEvents: "auto",
            transition: "fill 0.3s ease",
          }}
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
          style={{
            cursor: "pointer",
            pointerEvents: "auto",
            transition: "fill 0.3s ease",
          }}
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
        style={{
          opacity: isZooming ? 0 : 1,
          transition: "opacity 0.5s ease-in-out",
        }}
      />

      {/* SVG overlay - positioned absolutely to match image exactly */}
      {dimensions.width > 0 && !isZooming && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${originalWidth} ${originalHeight}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            opacity: isZooming ? 0 : 1,
            transition: "opacity 0.5s ease-in-out",
          }}
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Render all clickable areas */}
          {areas.map((area) => renderShape(area))}

          {/* Optional: Show tooltips for hovered areas */}
          {hoveredAreaId && (
            <g>
              {areas
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
                        fill="rgba(0, 0, 0, 0.7)"
                      />
                      <text
                        x={tooltipX}
                        y={tooltipY - 5}
                        textAnchor="middle"
                        fill="white"
                        fontSize="14"
                        fontFamily="Arial"
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
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "64px",
            height: "64px",
            background: `url(/book.png) no-repeat center center`,
            backgroundSize: "contain",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            transition: "transform 0.3s ease",
            transform: showInfoPanel ? "scale(1.1)" : "scale(1)",
          }}
          aria-label="Toggle Information Panel"
          title="Read Information"
        />
      )}

      {/* Information Panel with Check Solution button */}
      {showInfoPanel && selectedArea && (
        <div className="info-panel">
          <h3
            style={{
              margin: "0 0 10px 0",
              color: completedPuzzles.has(selectedArea.id)
                ? "#7FFF7F"
                : "#f5deb3",
              fontSize: "20px",
            }}
          >
            {selectedArea.name} {completedPuzzles.has(selectedArea.id) && "✓"}
          </h3>
          <div
            style={{
              fontSize: "16px",
              lineHeight: "1.5",
              marginBottom: "15px",
            }}
          >
            {selectedArea.description ||
              "No information available about this item."}
          </div>

          {/* Display code template if available */}
          {selectedArea?.puzzleSpec && selectedArea.codeTemplates?.[currentLanguage] &&
            !completedPuzzles.has(selectedArea.id) && (
              <div
                style={{
                  marginTop: "10px",
                  marginBottom: "15px",
                  padding: "10px",
                  background: "rgba(0, 0, 0, 0.5)",
                  borderLeft: "3px solid #4CAF50",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  overflow: "auto",
                  maxHeight: "150px",
                }}
              >
                <div
                  style={{
                    marginBottom: "8px",
                    color: "#4CAF50",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong>PUZZLE CODE TEMPLATE ({currentLanguage}):</strong>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>
                    Expected solution: {String(selectedArea.expectedValue)}
                  </div>
                </div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {selectedArea.codeTemplates[currentLanguage]}
                </pre>
                <button
                  onClick={() =>
                    onLoadCodeTemplate &&
                    selectedArea.codeTemplates &&
                    onLoadCodeTemplate(
                      selectedArea.codeTemplates[currentLanguage] || "",
                    )
                  }
                  style={{
                    marginTop: "10px",
                    padding: "5px 10px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Load Template
                </button>
              </div>
            )}

          {/* Add the Check Solution button only if this area has an expected value and is not solved */}
          {selectedArea.expectedValue !== undefined &&
            !completedPuzzles.has(selectedArea.id) && (
              <button
                onClick={() => checkSolution(selectedArea)}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  display: "block",
                  width: "100%",
                }}
              >
                Check Solution
              </button>
            )}

          <button
            onClick={() => setShowInfoPanel(false)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "transparent",
              border: "none",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
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
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              width: "40px",
              height: "40px",
              background: `url(/back.svg) no-repeat center center`,
              backgroundSize: "contain",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              zIndex: 10000,
              transition: "transform 0.2s ease",
              filter: "invert(1)", // Make SVG white for visibility on dark background
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            aria-label="Return to Room"
            title="Return to Room"
          />

          {/* Show error message if image fails to load */}
          {imageError && (
            <div style={{ color: "red", margin: "20px", fontSize: "18px" }}>
              {imageError}
            </div>
          )}

          {/* Display the image */}
          {zoomedImage && (
            <img
              src={zoomedImage}
              alt="Detailed view"
              style={{
                maxWidth: "90%",
                maxHeight: "80vh",
                border: "2px solid white",
              }}
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
          zIndex: 1000,
        }}
      >
        Image coords: {mousePosition.x}, {mousePosition.y}
      </div>

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .info-panel {
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 300px;
            background-color: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 999;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-family: Georgia, serif;
            animation: fadeIn 0.3s ease-in;
          }
          
          .zoomed-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
        `}
      </style>
    </div>
  );
};
