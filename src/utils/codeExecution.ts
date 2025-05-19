import { PuzzleTest, TestResult, Language, Puzzle } from "../App";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Execute JavaScript code locally (keep for offline mode)
export const executeJavaScriptLocal = (
  code: string,
  functionName?: string,
  tests?: PuzzleTest[],
): string | TestResult[] => {
  try {
    // Capture console output
    const logs: string[] = [];
    const originalConsoleLog = console.log;

    console.log = function (...args) {
      logs.push(args.map((arg) => String(arg)).join(" "));
      originalConsoleLog.apply(console, args);
    };

    try {
      // If we're in puzzle mode with tests
      if (functionName && tests) {
        // Execute the code to define the function
        const func = new Function(code + `\nreturn ${functionName};`)();

        if (typeof func !== "function") {
          new Function(code)();
          const userFunction = (window as any)[functionName];
          if (typeof userFunction !== "function") {
            return `Error: Function '${functionName}' not defined or not accessible.`;
          }
          return runTests(userFunction, tests);
        }

        return runTests(func, tests);
      } else {
        // Regular execution without tests
        new Function(code)();
        return logs.join("\n") || "Code executed successfully (no output)";
      }
    } finally {
      console.log = originalConsoleLog;
    }
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
};

// Execute code using backend API
export const executeCode = async (
  code: string,
  language: Language,
  functionName?: string,
  tests?: PuzzleTest[],
): Promise<string | TestResult[]> => {
  try {
    // For JavaScript, you can still use local execution for immediate feedback
    if (language === "javascript" && !tests) {
      return executeJavaScriptLocal(code);
    }

    // For puzzle testing, use the backend API
    if (functionName && tests) {
      const response = await fetch(`${BACKEND_URL}/api/test-puzzle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
          functionName,
          tests,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute tests");
      }

      const results: TestResult[] = await response.json();
      return results;
    } else {
      // Regular code execution
      const response = await fetch(`${BACKEND_URL}/api/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute code");
      }

      const result = await response.json();

      if (result.stderr && result.stderr.trim()) {
        return `Error: ${result.stderr}`;
      }

      if (result.compile_output && result.compile_output.trim()) {
        return `Compilation Error: ${result.compile_output}`;
      }

      return result.stdout || "Code executed successfully (no output)";
    }
  } catch (error: any) {
    console.error("Code execution error:", error);
    return `Error: ${error.message}`;
  }
};

// Keep the local test runner for JavaScript
const runTests = (
  userFunction: Function,
  tests: PuzzleTest[],
): TestResult[] => {
  const results: TestResult[] = [];

  for (const test of tests) {
    try {
      const inputClone = JSON.parse(JSON.stringify(test.input));
      const output = userFunction.apply(null, inputClone);

      let passed = false;
      if (typeof test.expected === "object" && test.expected !== null) {
        passed = JSON.stringify(output) === JSON.stringify(test.expected);
      } else {
        passed = output == test.expected;
      }

      results.push({
        input: JSON.stringify(test.input),
        expected: test.expected,
        actual: output,
        passed: passed,
      });
    } catch (error: any) {
      results.push({
        input: JSON.stringify(test.input),
        expected: test.expected,
        actual: `Error: ${error.message}`,
        passed: false,
      });
    }
  }

  return results;
};

// Updated mock execute function - now calls real execution
export const mockExecuteCode = async (
  language: Language,
  puzzle: Puzzle,
  displayTestResults: (results: TestResult[]) => void,
) => {
  // Extract function name from puzzle
  const functionName = extractFunctionName(puzzle, language);

  if (!functionName) {
    displayTestResults([
      {
        input: "N/A",
        expected: "N/A",
        actual: "Error: Could not determine function name for testing",
        passed: false,
      },
    ]);
    return;
  }

  // Get the code template for this language
  let code = "";
  if (puzzle.puzzleSpec) {
    try {
      // Import the template generator dynamically
      const { generateTemplates } = await import("./templateGenerator");
      const templates = generateTemplates(puzzle.puzzleSpec);
      code = templates[language];
    } catch (error) {
      console.error("Error importing template generator:", error);
    }
  } else if (puzzle.templates && puzzle.templates[language]) {
    code = puzzle.templates[language];
  } else {
    displayTestResults([
      {
        input: "N/A",
        expected: "N/A",
        actual: "Error: No code template available for this language",
        passed: false,
      },
    ]);
    return;
  }

  try {
    const results = await executeCode(
      code,
      language,
      functionName,
      puzzle.tests,
    );
    if (Array.isArray(results)) {
      displayTestResults(results);
    } else {
      displayTestResults([
        {
          input: "N/A",
          expected: "N/A",
          actual: results,
          passed: false,
        },
      ]);
    }
  } catch (error: any) {
    displayTestResults([
      {
        input: "N/A",
        expected: "N/A",
        actual: `Error: ${error.message}`,
        passed: false,
      },
    ]);
  }
};

// Helper function to extract function name from puzzle
function extractFunctionName(
  puzzle: Puzzle,
  language: Language,
): string | null {
  if (puzzle.puzzleSpec) {
    // Import dynamically to avoid circular dependencies
    return extractFunctionNameFromPuzzleSpec(puzzle.puzzleSpec, language);
  }

  // Fallback: try to extract from template
  if (puzzle.templates && puzzle.templates[language]) {
    const code = puzzle.templates[language];
    return extractFunctionNameFromCode(code, language);
  }

  return null;
}

// Helper function to extract function name from puzzle spec
function extractFunctionNameFromPuzzleSpec(
  puzzleSpec: any,
  language: Language,
): string {
  // Simple mapping based on language
  switch (language) {
    case "python":
    case "rust":
      return toSnakeCase(puzzleSpec.name);
    case "java":
    case "csharp":
      return `PuzzleClass.${puzzleSpec.name}`;
    default:
      return puzzleSpec.name;
  }
}

// Simple snake_case converter
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Helper function to extract function name from code
function extractFunctionNameFromCode(
  code: string,
  language: Language,
): string | null {
  let match;
  switch (language) {
    case "javascript":
    case "typescript":
      match = code.match(/function\s+([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    case "python":
      match = code.match(/def\s+([a-zA-Z0-9_]+)/);
      return match ? match[1] : null;
    case "java":
    case "csharp":
      match = code.match(
        /(?:public|private|protected|static)?\s*(?:static\s+)?[a-zA-Z0-9_<>,\[\]\s]+\s+([a-zA-Z0-9_]+)\s*\(/,
      );
      return match ? `PuzzleClass.${match[1]}` : null;
    case "cpp":
      match = code.match(/[a-zA-Z0-9_<>,\[\]\s]+\s+([a-zA-Z0-9_]+)\s*\(/);
      return match ? match[1] : null;
    case "go":
      match = code.match(/func\s+([a-zA-Z0-9_]+)\s*\(/);
      return match ? match[1] : null;
    case "rust":
      match = code.match(/fn\s+([a-zA-Z0-9_]+)\s*\(/);
      return match ? match[1] : null;
    default:
      return null;
  }
}
