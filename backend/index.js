require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000", // Alternative dev server
      "http://127.0.0.1:5173", // Alternative localhost
    ],
    credentials: true,
  }),
);
app.use(express.json());

// Language mapping from your app to Judge0 IDs
const LANGUAGE_MAP = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++ (GCC 9.2.0)
  csharp: 51, // C# (.NET Core)
  go: 60, // Go
  rust: 73, // Rust
  typescript: 74, // TypeScript
};

// Helper function to check if a string is base64 encoded
function isBase64(str) {
  if (!str) return false;
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch (err) {
    return false;
  }
}

// Helper function to safely decode base64 or return plain text
function safeDecodeBase64(str) {
  if (!str) return "";

  // If it's base64 encoded, decode it
  if (isBase64(str)) {
    try {
      return Buffer.from(str, "base64").toString();
    } catch (err) {
      console.warn("Failed to decode base64:", err.message);
      return str; // Return as-is if decoding fails
    }
  }

  // Otherwise, return as plain text
  return str;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", judge0: JUDGE0_URL });
});

// Test Judge0 connection endpoint
app.get("/api/test-judge0", async (req, res) => {
  try {
    console.log("Testing Judge0 connection to:", JUDGE0_URL);

    // Test 1: Get languages
    const languagesResponse = await axios.get(`${JUDGE0_URL}/languages`, {
      timeout: 10000, // 10 second timeout
    });
    console.log(
      "✓ Languages endpoint works:",
      languagesResponse.data.length,
      "languages found",
    );

    // Test 2: Submit a simple code
    const testSubmission = {
      source_code: 'print("test")', // Send as plain text
      language_id: 71, // Python
    };

    console.log("Testing submission to:", `${JUDGE0_URL}/submissions`);
    const submissionResponse = await axios.post(
      `${JUDGE0_URL}/submissions`,
      testSubmission,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✓ Submission works, token:", submissionResponse.data.token);

    res.json({
      status: "OK",
      languages: languagesResponse.data.length,
      submissionToken: submissionResponse.data.token,
      judge0Url: JUDGE0_URL,
    });
  } catch (error) {
    console.error("Judge0 connection test failed:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);

    res.status(500).json({
      error: "Cannot connect to Judge0",
      details: {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      },
      judge0Url: JUDGE0_URL,
    });
  }
});

// Execute code endpoint
app.post("/api/execute", async (req, res) => {
  try {
    console.log("\n=== NEW EXECUTION REQUEST ===");
    console.log("Received execute request:", {
      language: req.body.language,
      codeLength: req.body.code?.length,
      judge0Url: JUDGE0_URL,
    });
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { code, language, stdin = "" } = req.body;

    if (!code || !language) {
      console.log("❌ Missing code or language");
      return res.status(400).json({ error: "Code and language are required" });
    }

    const languageId = LANGUAGE_MAP[language];
    if (!languageId) {
      console.log("❌ Unsupported language:", language);
      return res
        .status(400)
        .json({ error: `Unsupported language: ${language}` });
    }

    console.log("✓ Language mapped:", language, "->", languageId);
    console.log("⏳ Submitting to Judge0...", {
      languageId,
      judge0Url: JUDGE0_URL,
    });

    // Submit code to Judge0 with timeout and better error handling
    let submissionResponse;
    const submissionPayload = {
      source_code: code, // Send as plain text
      language_id: languageId,
      stdin: stdin, // Send as plain text
    };

    console.log(
      "Submission payload (first 100 chars of code):",
      JSON.stringify(
        {
          ...submissionPayload,
          source_code: submissionPayload.source_code.substring(0, 100) + "...",
        },
        null,
        2,
      ),
    );

    try {
      submissionResponse = await axios.post(
        `${JUDGE0_URL}/submissions`,
        submissionPayload,
        {
          timeout: 10000, // 10 second timeout
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );
      console.log(
        "✓ Submission response:",
        submissionResponse.status,
        submissionResponse.data,
      );
    } catch (submissionError) {
      console.error("\n❌ SUBMISSION ERROR:");
      console.error("Message:", submissionError.message);
      console.error("Code:", submissionError.code);
      console.error("Response status:", submissionError.response?.status);
      console.error("Response data:", submissionError.response?.data);
      console.error("Request URL:", submissionError.config?.url);

      if (submissionError.code === "ECONNREFUSED") {
        return res.status(503).json({
          error: "Cannot connect to Judge0 service",
          details: "Connection refused to " + JUDGE0_URL,
        });
      } else if (submissionError.code === "ENOTFOUND") {
        return res.status(503).json({
          error: "Judge0 host not found",
          details: "Cannot resolve " + JUDGE0_URL,
        });
      } else if (submissionError.response?.status === 500) {
        return res.status(503).json({
          error: "Judge0 internal error",
          details: submissionError.response.data || "Judge0 returned 500 error",
        });
      } else {
        throw submissionError;
      }
    }

    const token = submissionResponse.data.token;
    console.log("✓ Submission successful, token:", token);
    console.log("⏳ Polling for results...");

    // Poll for results with better error handling
    let result;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

      try {
        result = await axios.get(`${JUDGE0_URL}/submissions/${token}`, {
          timeout: 5000,
        });

        console.log(
          `Attempt ${attempts + 1}: Status ${result.data.status.id} (${result.data.status.description})`,
        );

        // Status codes: 1 = In Queue, 2 = Processing, 3 = Accepted, 4+ = Various errors
        if (result.data.status.id > 2) {
          console.log(
            "✓ Execution completed with status:",
            result.data.status.description,
          );
          break;
        }
      } catch (pollError) {
        console.error("Error polling result:", pollError.message);
        // Continue polling in case of network hiccup
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log("❌ Execution timeout");
      return res.status(408).json({ error: "Code execution timeout" });
    }

    if (!result) {
      console.log("❌ No result received");
      return res.status(500).json({ error: "Failed to get execution result" });
    }

    // Debug: Log raw response from Judge0
    console.log("Raw Judge0 response:", {
      stdout: result.data.stdout,
      stderr: result.data.stderr,
      compile_output: result.data.compile_output,
      status: result.data.status,
    });

    // Safely decode results (handle both base64 and plain text responses)
    const response = {
      stdout: safeDecodeBase64(result.data.stdout),
      stderr: safeDecodeBase64(result.data.stderr),
      compile_output: safeDecodeBase64(result.data.compile_output),
      status: result.data.status,
      time: result.data.time,
      memory: result.data.memory,
    };

    console.log("✓ Final response:");
    console.log("  Status:", response.status.description);
    console.log("  Stdout:", response.stdout);
    console.log("  Stderr:", response.stderr);
    console.log("  Compile output:", response.compile_output);
    console.log("=== END EXECUTION ===\n");

    res.json(response);
  } catch (error) {
    console.error("\n❌ UNEXPECTED ERROR:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Response:", error.response?.data);
    console.error("=== END ERROR ===\n");

    if (error.response?.status === 429) {
      res
        .status(429)
        .json({ error: "Too many requests. Please wait a moment." });
    } else if (error.code === "ECONNREFUSED") {
      res.status(503).json({
        error:
          "Judge0 service unavailable. Make sure Docker containers are running.",
      });
    } else {
      res
        .status(500)
        .json({ error: `Internal server error: ${error.message}` });
    }
  }
});

// Test puzzle execution endpoint
app.post("/api/test-puzzle", async (req, res) => {
  try {
    console.log("Received puzzle test request:", {
      language: req.body.language,
      functionName: req.body.functionName,
    });

    const { code, language, functionName, tests } = req.body;

    if (!code || !language || !functionName || !tests) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const results = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`Running test ${i + 1}/${tests.length}`);

      // Prepare test code based on language
      let testCode = "";
      let expectedOutput = "";

      switch (language) {
        case "javascript":
          testCode = `
${code}

// Test execution
try {
  const result = ${functionName}(${test.input.map((arg) => JSON.stringify(arg)).join(", ")});
  console.log(JSON.stringify(result));
} catch (error) {
  console.error('Error:', error.message);
}
          `;
          expectedOutput = JSON.stringify(test.expected);
          break;

        case "python":
          const snakeCaseFunctionName = functionName
            .replace(/([A-Z])/g, "_$1")
            .toLowerCase();
          testCode = `
import json

${code}

# Test execution
try:
    result = ${snakeCaseFunctionName}(${test.input.map((arg) => JSON.stringify(arg)).join(", ")})
    print(json.dumps(result))
except Exception as e:
    print(f"Error: {e}")
          `;
          expectedOutput = JSON.stringify(test.expected);
          break;

        case "java":
          testCode = `
${code}

public class Main {
    public static void main(String[] args) {
        try {
            Object result = ${functionName}(${test.input
              .map((arg) => {
                if (typeof arg === "string") return `"${arg}"`;
                return String(arg);
              })
              .join(", ")});
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
          `;
          expectedOutput = String(test.expected);
          break;

        default:
          return res
            .status(400)
            .json({ error: `Testing not implemented for ${language}` });
      }

      // Execute the test
      const languageId = LANGUAGE_MAP[language];

      try {
        const submission = await axios.post(`${JUDGE0_URL}/submissions`, {
          source_code: testCode, // Send as plain text
          language_id: languageId,
        });

        // Poll for results
        let result;
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          result = await axios.get(
            `${JUDGE0_URL}/submissions/${submission.data.token}`,
          );
          if (result.data.status.id > 2) break;
          attempts++;
        }

        // Use the safe decode function for test results too
        const stdout = safeDecodeBase64(result.data.stdout).trim();
        const stderr = safeDecodeBase64(result.data.stderr);
        const compileOutput = safeDecodeBase64(result.data.compile_output);

        let actual;
        let passed = false;

        if (result.data.status.id === 3 && !stderr && !compileOutput) {
          // Accepted
          try {
            // For JSON responses
            if (language === "javascript" || language === "python") {
              actual = JSON.parse(stdout);
              passed = JSON.stringify(actual) === JSON.stringify(test.expected);
            } else {
              // For simple string/number responses
              actual = stdout;
              passed = stdout === expectedOutput;
            }
          } catch {
            actual = stdout;
            passed = stdout === expectedOutput;
          }
        } else {
          actual =
            stderr ||
            compileOutput ||
            `Execution failed: ${result.data.status.description}`;
        }

        results.push({
          input: JSON.stringify(test.input),
          expected: test.expected,
          actual: actual,
          passed: passed,
        });
      } catch (testError) {
        console.error(`Error executing test ${i + 1}:`, testError.message);
        results.push({
          input: JSON.stringify(test.input),
          expected: test.expected,
          actual: `Test execution error: ${testError.message}`,
          passed: false,
        });
      }
    }

    console.log(
      `Puzzle tests completed. Passed: ${results.filter((r) => r.passed).length}/${results.length}`,
    );
    res.json(results);
  } catch (error) {
    console.error("Puzzle test execution error:", error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
});

// Test Judge0 status endpoint
app.get("/api/judge0-status", async (req, res) => {
  try {
    // Check system info
    const systemInfoResponse = await axios.get(`${JUDGE0_URL}/system_info`);

    // Check workers status
    const workersResponse = await axios.get(`${JUDGE0_URL}/workers`);

    // Test a simple submission
    const testSubmission = await axios.post(`${JUDGE0_URL}/submissions`, {
      source_code: 'print("test")', // Send as plain text
      language_id: 71,
    });

    res.json({
      systemInfo: systemInfoResponse.data,
      workers: workersResponse.data,
      testSubmission: testSubmission.data,
    });
  } catch (error) {
    console.error(
      "Judge0 status check failed:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      error: "Judge0 status check failed",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Judge0 URL: ${JUDGE0_URL}`);

  // Test Judge0 connection on startup
  axios
    .get(`${JUDGE0_URL}/languages`)
    .then(() => console.log("✓ Judge0 connection successful"))
    .catch((err) => console.log("✗ Judge0 connection failed:", err.message));
});
