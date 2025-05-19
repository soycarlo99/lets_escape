import React, { useState, useEffect, useRef } from "react";
import { ClickableArea, getAreaAction } from "../types/clickableAreas";
import { Language } from "../App";
import {
  generateTemplates,
  generateFunctionNames,
} from "../utils/templateGenerator";

export interface ClickableImageProps {
  imageSrc?: string;
  areas?: ClickableArea[];
  currentCode?: string;
  currentLanguage?: Language;
  onPuzzleSolved?: (areaId: string) => void;
  onLoadCodeTemplate?: (template: string) => void;
  onSelectArea?: (area: ClickableArea) => void;
  onLoadData?: (data: any, hint?: string) => void;
}

export const ClickableImage: React.FC<ClickableImageProps> = ({
  imageSrc,
  areas = [],
  currentCode = "",
  currentLanguage = "javascript",
  onPuzzleSolved,
  onLoadCodeTemplate,
  onSelectArea,
  onLoadData,
}) => {
  // Enhanced state management
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Photo viewing state
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentAreas, setCurrentAreas] = useState<ClickableArea[]>(areas);
  const [imageStack, setImageStack] = useState<
    Array<{ image: string; areas: ClickableArea[] }>
  >([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Panel states
  const [selectedArea, setSelectedArea] = useState<ClickableArea | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showDataPanel, setShowDataPanel] = useState(false);

  // Completed puzzles tracking
  const [completedPuzzles, setCompletedPuzzles] = useState<Set<string>>(
    new Set(),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Image dimensions
  const originalWidth = 1920;
  const originalHeight = 1080;

  // Handle intelligent area clicks
  const handleAreaClick = (area: ClickableArea) => {
    console.log(`Clicked on ${area.areaType} area: ${area.id}`);

    // Set the selected area
    setSelectedArea(area);

    // Notify parent component
    if (onSelectArea) {
      onSelectArea(area);
    }

    // Handle different area types
    switch (area.areaType) {
      case "photo":
        handlePhotoArea(area);
        break;
      case "puzzle":
        handlePuzzleArea(area);
        break;
      case "info":
        handleInfoArea(area);
        break;
      case "data":
        handleDataArea(area);
        break;
      default:
        // Legacy support
        handleLegacyArea(area);
    }
  };

  // Handle photo areas with smooth transitions and nested areas
  const handlePhotoArea = (area: ClickableArea) => {
    if (!area.detailImage) {
      alert(`${area.name} doesn't have a detailed view available.`);
      return;
    }

    // Start transition
    setIsTransitioning(true);
    setImageError(null);

    // Save current state to stack
    const currentState = {
      image: currentImage || imageSrc || "/haunted-room.jpg",
      areas: currentAreas,
    };
    setImageStack((prev) => [...prev, currentState]);

    // Transition to new image
    setTimeout(() => {
      setCurrentImage(area.detailImage!);
      setCurrentAreas(area.nestedAreas || []);
      setIsTransitioning(false);
    }, 500); // Smooth fade transition

    // Show info panel with description
    setShowInfoPanel(true);
  };

  // Handle puzzle areas - load into editor
  const handlePuzzleArea = (area: ClickableArea) => {
    if (!area.puzzleSpec) {
      alert(`${area.name} doesn't have a puzzle to solve.`);
      return;
    }

    // Generate templates and function names
    if (area.puzzleSpec) {
      area.codeTemplates = generateTemplates(area.puzzleSpec);
      area.functionNames = generateFunctionNames(area.puzzleSpec);
    }

    // Load the template into the editor
    if (
      area.codeTemplates &&
      area.codeTemplates[currentLanguage] &&
      onLoadCodeTemplate
    ) {
      onLoadCodeTemplate(area.codeTemplates[currentLanguage]);
    }

    // Show info panel with puzzle description
    setShowInfoPanel(true);
  };

  // Handle info areas - display information
  const handleInfoArea = (area: ClickableArea) => {
    setShowInfoPanel(true);

    // If the area has data content, also provide it to the parent
    if (area.dataContent && onLoadData) {
      const comment = `/*
${area.name}
${area.description || ""}
${area.processingHint ? "\nHint: " + area.processingHint : ""}

Data:
${typeof area.dataContent === "string" ? area.dataContent : JSON.stringify(area.dataContent, null, 2)}
*/

// Your code here
`;
      onLoadData(comment, area.processingHint);
    }
  };

  // Handle data areas - provide data for processing
  const handleDataArea = (area: ClickableArea) => {
    setShowDataPanel(true);
    setShowInfoPanel(true);

    if (area.dataContent && onLoadData) {
      // Create a template with the data embedded
      let dataString = "";
      let templateCode = "";

      switch (area.dataType) {
        case "array":
          dataString = `const data = ${JSON.stringify(area.dataContent)};`;
          templateCode = `${dataString}

// ${area.description || "Process the data array"}
// ${area.processingHint || "Find the pattern in the numbers"}

function solution() {
    // Your code here
    // Example: return data.reduce((sum, num) => sum + num, 0);
    
    return 0; // Replace with your solution
}`;
          break;

        case "encrypted":
          templateCode = `// ${area.description || "Decrypt the message"}
// ${area.processingHint || "Use the appropriate decryption method"}

const encryptedMessage = "${area.dataContent}";

function solution() {
    // Your code here
    // Hint: Try different cipher methods
    
    return ""; // Replace with decrypted message
}`;
          break;

        case "stream":
          if (typeof area.dataContent === "object" && area.dataContent.data) {
            const streamData = area.dataContent.data;
            templateCode = `// ${area.description || "Process the data stream"}
// ${area.processingHint || "Parse the log entries"}

const logEntries = ${JSON.stringify(streamData, null, 2)};

function solution() {
    // Your code here
    // Example: Extract specific information from log entries
    
    return null; // Replace with your solution
}`;
          }
          break;

        case "json":
          templateCode = `// ${area.description || "Process the JSON data"}
// ${area.processingHint || "Extract the required information"}

const jsonData = ${JSON.stringify(area.dataContent, null, 2)};

function solution() {
    // Your code here
    
    return null; // Replace with your solution
}`;
          break;

        default:
          templateCode = `// ${area.description || "Process the data"}
// ${area.processingHint || ""}

const rawData = ${JSON.stringify(area.dataContent)};

function solution() {
    // Your code here
    
    return null; // Replace with your solution
}`;
      }

      if (onLoadCodeTemplate) {
        onLoadCodeTemplate(templateCode);
      }
    }
  };

  // Handle legacy areas (backward compatibility)
  const handleLegacyArea = (area: ClickableArea) => {
    switch (area.action) {
      case "mirror":
        if (area.detailImage) {
          handlePhotoArea(area);
        } else {
          alert(
            `You examine the ${area.name}. It reflects a distorted image of yourself.`,
          );
        }
        break;
      case "door":
        if (completedPuzzles.has(area.id)) {
          alert(`The ${area.name} unlocks and swings open!`);
        } else {
          handlePuzzleArea(area);
        }
        break;
      default:
        alert(getAreaAction(area));
    }
  };

  // Handle going back to previous image/area
  const goBack = () => {
    if (imageStack.length === 0) return;

    setIsTransitioning(true);

    const previousState = imageStack[imageStack.length - 1];
    setImageStack((prev) => prev.slice(0, -1));

    setTimeout(() => {
      setCurrentImage(
        previousState.image === (imageSrc || "/haunted-room.jpg")
          ? null
          : previousState.image,
      );
      setCurrentAreas(previousState.areas);
      setIsTransitioning(false);
    }, 500);

    // Close panels when going back
    setShowInfoPanel(false);
    setShowDataPanel(false);
  };

  // Check puzzle solution with universal function name
  const checkSolution = (area: ClickableArea) => {
    if (!currentCode || currentCode.trim() === "") {
      alert("Please write some code in the editor first.");
      return;
    }

    if (area.expectedValue === undefined) {
      alert("This area doesn't have a puzzle to solve.");
      return;
    }

    // Universal function name - same for all puzzles
    const UNIVERSAL_FUNCTION_NAME = "solution";

    console.log("Checking puzzle:", area.name);
    console.log("Expected value:", area.expectedValue);
    console.log("Using universal function name:", UNIVERSAL_FUNCTION_NAME);

    try {
      // Step 1: Execute user code to define functions
      try {
        eval(currentCode);
      } catch (evalError: any) {
        throw new Error(`Error in your code: ${evalError.message}`);
      }

      // Step 2: Try to call the universal function
      let userFunction;
      try {
        userFunction = eval(UNIVERSAL_FUNCTION_NAME);
      } catch (e) {
        // Function might not be in global scope, try as a property of window
        userFunction = (window as any)[UNIVERSAL_FUNCTION_NAME];
      }

      // Also try checking for language-specific function names as fallback
      if (typeof userFunction !== "function") {
        // For languages like Java/C# that use class methods
        const languageSpecificChecks = [
          "PuzzleClass.solution",
          "PuzzleClass.Solution",
          // Add any other patterns if needed
        ];

        for (const funcName of languageSpecificChecks) {
          try {
            userFunction = eval(funcName);
            if (typeof userFunction === "function") {
              console.log(`Found function using: ${funcName}`);
              break;
            }
          } catch (e) {
            // Continue to next check
          }
        }
      }

      if (typeof userFunction !== "function") {
        // Provide helpful error message
        const availableFunctions = Object.getOwnPropertyNames(window)
          .filter((name) => typeof (window as any)[name] === "function")
          .filter((name) => !name.startsWith("_") && name.length < 20) // Filter out system functions
          .join(", ");

        throw new Error(`Function 'solution()' is not defined. 

Expected: You should define a function named exactly 'solution()' (without parameters)

Available functions: ${availableFunctions || "none"}

Make sure your function is defined like this:
- JavaScript/TypeScript: function solution() { ... }
- Python: def solution(): ...
- Java: public static returnType solution() { ... }
- C#: public static ReturnType Solution() { ... }
- C++: returnType solution() { ... }
- Go: func solution() returnType { ... }
- Rust: fn solution() -> ReturnType { ... }`);
      }

      // Step 3: Call the function and get result
      const result = userFunction();
      console.log("Function result:", result);
      console.log("Expected:", area.expectedValue);
      console.log(
        "Types - Result:",
        typeof result,
        "Expected:",
        typeof area.expectedValue,
      );

      // Compare results (handle different types)
      let isCorrect = false;
      if (typeof result === typeof area.expectedValue) {
        isCorrect = result === area.expectedValue;
      } else {
        // Try loose comparison for number/string conversions
        isCorrect = result == area.expectedValue;
      }

      if (isCorrect) {
        // Mark as solved
        const newCompletedPuzzles = new Set(completedPuzzles);
        newCompletedPuzzles.add(area.id);
        setCompletedPuzzles(newCompletedPuzzles);

        // Notify parent
        if (onPuzzleSolved) {
          onPuzzleSolved(area.id);
        }

        alert(`🎉 Correct! You've solved the ${area.name} puzzle!

Your answer: ${result}
Expected: ${area.expectedValue}

Great job! The puzzle is now complete.`);
        setShowInfoPanel(false);
      } else {
        alert(`❌ Not quite right. Try again!

Your answer: ${result} (${typeof result})
Expected: ${area.expectedValue} (${typeof area.expectedValue})

Hint: Check your logic and make sure you're returning the right type of value.`);
      }
    } catch (error: any) {
      console.error("Error in checkSolution:", error);
      alert(`Error checking your solution: ${error.message}`);
    }
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = originalWidth / rect.width;
    const scaleY = originalHeight / rect.height;

    const originalX = Math.round(x * scaleX);
    const originalY = Math.round(y * scaleY);

    setMousePosition({ x: originalX, y: originalY });
  };

  // Update dimensions when image loads
  useEffect(() => {
    if (!imgRef.current) return;

    const updateDimensions = () => {
      if (imgRef.current) {
        const rect = imgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    imgRef.current.onload = updateDimensions;
    if (imgRef.current.complete) {
      updateDimensions();
    }

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(imgRef.current);

    window.addEventListener("resize", updateDimensions);

    return () => {
      if (imgRef.current) {
        resizeObserver.unobserve(imgRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [currentImage]);

  // Generate templates for areas with puzzle specs
  useEffect(() => {
    currentAreas.forEach((area) => {
      if (area.puzzleSpec) {
        area.codeTemplates = generateTemplates(area.puzzleSpec);
        area.functionNames = generateFunctionNames(area.puzzleSpec);
      }
    });
  }, [currentAreas, currentLanguage]);

  // Render shapes for SVG overlay
  const renderShape = (area: ClickableArea) => {
    const isHovered = hoveredAreaId === area.id;
    const isPuzzleSolved = completedPuzzles.has(area.id);

    // Color coding by area type
    let fillColor = "rgba(0, 0, 0, 0)";
    let strokeColor = "rgba(0, 0, 0, 0)";

    if (isPuzzleSolved) {
      fillColor = "rgba(0, 255, 0, 0.3)";
      strokeColor = "rgba(0, 255, 0, 0.6)";
    } else if (isHovered) {
      switch (area.areaType) {
        case "photo":
          fillColor = "rgba(255, 215, 0, 0.3)"; // Gold
          strokeColor = "rgba(255, 215, 0, 0.6)";
          break;
        case "puzzle":
          fillColor = "rgba(255, 165, 0, 0.3)"; // Orange
          strokeColor = "rgba(255, 165, 0, 0.6)";
          break;
        case "info":
          fillColor = "rgba(0, 191, 255, 0.3)"; // Deep sky blue
          strokeColor = "rgba(0, 191, 255, 0.6)";
          break;
        case "data":
          fillColor = "rgba(128, 0, 128, 0.3)"; // Purple
          strokeColor = "rgba(128, 0, 128, 0.6)";
          break;
        default:
          fillColor = area.fillColor || "rgba(255, 255, 255, 0.3)";
          strokeColor = area.strokeColor || "rgba(255, 255, 255, 0.6)";
      }
    }

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

  // Get current image source
  const getCurrentImageSrc = () => {
    return currentImage || imageSrc || "/haunted-room.jpg";
  };

  return (
    <div ref={containerRef} className="clickable-image-container">
      {/* Main image */}
      <img
        ref={imgRef}
        src={getCurrentImageSrc()}
        alt="Escape Room"
        onMouseMove={handleMouseMove}
        onError={() =>
          setImageError(`Failed to load image: ${getCurrentImageSrc()}`)
        }
        style={{
          opacity: isTransitioning ? 0 : 1,
          transition: "opacity 0.5s ease-in-out",
          filter: isTransitioning ? "blur(5px)" : "none",
        }}
      />

      {/* SVG overlay for clickable areas */}
      {dimensions.width > 0 && !isTransitioning && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${originalWidth} ${originalHeight}`}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
          preserveAspectRatio="xMidYMid slice"
        >
          {currentAreas.map(renderShape)}

          {/* Tooltips */}
          {hoveredAreaId && (
            <g>
              {currentAreas
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

      {/* Back button (only show if we have a navigation stack) */}
      {imageStack.length > 0 && (
        <button
          onClick={goBack}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "40px",
            height: "40px",
            background: "url(/back.svg) no-repeat center center",
            backgroundSize: "contain",
            border: "none",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: "50%",
            cursor: "pointer",
            filter: "invert(1)",
            transition: "transform 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          title="Go Back"
        />
      )}

      {/* Enhanced Info Panel */}
      {showInfoPanel && selectedArea && (
        <div
          className="info-panel"
          style={{
            position: "fixed",
            bottom: "100px",
            right: "20px",
            width: "350px",
            maxHeight: "60vh",
            overflowY: "auto",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            border: "2px solid #555",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.7)",
            zIndex: 999,
          }}
        >
          <button
            onClick={() => setShowInfoPanel(false)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "none",
              border: "none",
              color: "white",
              fontSize: "18px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>

          <h3
            style={{
              margin: "0 0 15px 0",
              color: completedPuzzles.has(selectedArea.id)
                ? "#7FFF7F"
                : "#ffd700",
              fontSize: "22px",
            }}
          >
            {selectedArea.name} {completedPuzzles.has(selectedArea.id) && "✓"}
            <span
              style={{
                fontSize: "12px",
                color: "#aaa",
                marginLeft: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              [{selectedArea.areaType}]
            </span>
          </h3>

          <div style={{ marginBottom: "15px", lineHeight: "1.6" }}>
            {selectedArea.description || "No description available."}
          </div>

          {/* Enhanced puzzle info display */}
          {selectedArea.areaType === "puzzle" && (
            <div
              style={{
                marginTop: "15px",
                padding: "15px",
                background:
                  "linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))",
                borderLeft: "4px solid #ffd700",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  color: "#ffd700",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                🎯 ACTIVE PUZZLE: {selectedArea.name.toUpperCase()}
              </div>

              <div
                style={{
                  marginBottom: "10px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                }}
              >
                {selectedArea.description}
              </div>

              {selectedArea.expectedValue !== undefined && (
                <div
                  style={{
                    marginBottom: "10px",
                    padding: "8px",
                    backgroundColor: "rgba(0, 0, 0, 0.3)",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                >
                  <strong>🎲 Expected Result:</strong>{" "}
                  {String(selectedArea.expectedValue)} (
                  {typeof selectedArea.expectedValue})
                </div>
              )}

              <div
                style={{
                  padding: "10px",
                  backgroundColor: "rgba(0, 255, 0, 0.1)",
                  borderRadius: "4px",
                  fontSize: "12px",
                  border: "1px solid rgba(0, 255, 0, 0.3)",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  📝 FUNCTION NAME: solution()
                </div>
                <div>
                  ✅ Always use function name:{" "}
                  <code style={{ color: "#0f0" }}>solution()</code>
                  <br />
                  ✅ No parameters required
                  <br />
                  ✅ Must return the expected value
                  <br />✅ Same function name for all languages
                </div>
              </div>

              {selectedArea.codeTemplates &&
                selectedArea.codeTemplates[currentLanguage] &&
                !completedPuzzles.has(selectedArea.id) && (
                  <div style={{ marginTop: "10px" }}>
                    <button
                      onClick={() => {
                        if (onLoadCodeTemplate && selectedArea.codeTemplates) {
                          onLoadCodeTemplate(
                            selectedArea.codeTemplates[currentLanguage] || "",
                          );
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#ffd700",
                        color: "black",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "13px",
                      }}
                    >
                      📁 Load Template for {currentLanguage.toUpperCase()}
                    </button>
                  </div>
                )}

              {completedPuzzles.has(selectedArea.id) && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: "rgba(0, 255, 0, 0.1)",
                    borderRadius: "6px",
                    color: "#0f0",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  ✅ PUZZLE COMPLETED! 🎉
                </div>
              )}
            </div>
          )}

          {/* Show data content for info/data areas */}
          {(selectedArea.areaType === "info" ||
            selectedArea.areaType === "data") &&
            selectedArea.dataContent && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderLeft: "3px solid #4CAF50",
                  borderRadius: "5px",
                }}
              >
                <div
                  style={{
                    marginBottom: "10px",
                    color: "#4CAF50",
                    fontWeight: "bold",
                  }}
                >
                  DATA CONTENT ({selectedArea.dataType?.toUpperCase() || "TEXT"}
                  ):
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    whiteSpace: "pre-wrap",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "10px",
                    borderRadius: "3px",
                    maxHeight: "150px",
                    overflow: "auto",
                  }}
                >
                  {typeof selectedArea.dataContent === "string"
                    ? selectedArea.dataContent
                    : JSON.stringify(selectedArea.dataContent, null, 2)}
                </pre>
                {selectedArea.processingHint && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px",
                      backgroundColor: "rgba(255, 215, 0, 0.2)",
                      borderRadius: "3px",
                      fontSize: "12px",
                      color: "#ffd700",
                    }}
                  >
                    💡 Hint: {selectedArea.processingHint}
                  </div>
                )}
              </div>
            )}

          {/* Check Solution button for puzzle areas */}
          {selectedArea.areaType === "puzzle" &&
            selectedArea.expectedValue !== undefined &&
            !completedPuzzles.has(selectedArea.id) && (
              <button
                onClick={() => checkSolution(selectedArea)}
                style={{
                  width: "100%",
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                🔍 Check Solution
              </button>
            )}
        </div>
      )}

      {/* Debug coordinates */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          background: "rgba(0, 0, 0, 0.7)",
          color: "white",
          padding: "5px 10px",
          borderRadius: "3px",
          fontSize: "12px",
          fontFamily: "monospace",
          display: isTransitioning ? "none" : "block",
        }}
      >
        {mousePosition.x}, {mousePosition.y}
      </div>

      {/* Error display */}
      {imageError && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 0, 0, 0.9)",
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            fontSize: "16px",
          }}
        >
          {imageError}
        </div>
      )}
    </div>
  );
};
