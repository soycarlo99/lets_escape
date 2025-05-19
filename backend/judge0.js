const axios = require("axios");

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

// Map our language names to Judge0 language IDs
const LANGUAGE_MAP = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java
  cpp: 54, // C++
  csharp: 51, // C#
  go: 60, // Go
  rust: 73, // Rust
};

// Safely decode base64 strings
function safeDecodeBase64(str) {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64").toString();
  } catch {
    return str;
  }
}

// Execute code through Judge0
async function executeCode(code, language) {
  const languageId = LANGUAGE_MAP[language];
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Submit code to Judge0
  const submission = await axios.post(
    `${JUDGE0_URL}/submissions`,
    {
      source_code: code,
      language_id: languageId,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const token = submission.data.token;

  // Poll for results
  let result;
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds max wait

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

    result = await axios.get(`${JUDGE0_URL}/submissions/${token}`);
    if (result.data.status.id > 2) break; // Status > 2 means execution completed
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Code execution timeout");
  }

  // Process the result
  const stdout = safeDecodeBase64(result.data.stdout);
  const stderr = safeDecodeBase64(result.data.stderr);
  const compileOutput = safeDecodeBase64(result.data.compile_output);

  if (result.data.status.id !== 3) {
    // Not accepted
    const error = stderr || compileOutput || result.data.status.description;
    return { error };
  }

  // Try to parse the output as JSON (for structured data)
  try {
    const output = JSON.parse(stdout);
    return { output };
  } catch {
    // If not JSON, return as string
    return { output: stdout.trim() };
  }
}

module.exports = {
  executeCode,
}; 