import { PuzzleTest, TestResult, Language, Puzzle } from '../App';
import React from 'react';

// Execute JavaScript code, potentially with test verification
export const executeJavaScript = (
  code: string, 
  functionName?: string,
  tests?: PuzzleTest[]
): string | TestResult[] => {
  try {
    // Capture console output
    const logs: string[] = [];
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      logs.push(args.map(arg => String(arg)).join(' '));
      originalConsoleLog.apply(console, args);
    };
    
    try {
      // If we're in puzzle mode with tests
      if (functionName && tests) {
        // Execute the code to define the function
        // Use a function constructor to evaluate the code in the global scope
        const func = new Function(code + `\nreturn ${functionName};`)();
        
        if (typeof func !== 'function') {
          // Fallback: try attaching to window if direct return fails
          new Function(code)(); 
          const userFunction = (window as any)[functionName];
          if (typeof userFunction !== 'function') {
            return `Error: Function '${functionName}' not defined or not accessible.`;
          }
          // Run tests against the function found on window
          return runTests(userFunction, tests);
        }
        
        // Run tests against the function returned by the constructor
        return runTests(func, tests);
      } else {
        // Regular execution without tests
        new Function(code)();
        return logs.join('\n') || 'Code executed successfully (no output)';
      }
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
    }
  } catch (error: any) {
    return `Error: ${error.message}`;
  }
};

// Run tests with the user's function
const runTests = (userFunction: Function, tests: PuzzleTest[]): TestResult[] => {
  const results: TestResult[] = [];
  
  for (const test of tests) {
    try {
      // Clone input to prevent modification by user function (if applicable)
      const inputClone = JSON.parse(JSON.stringify(test.input)); 
      const output = userFunction.apply(null, inputClone);
      
      // Use deep comparison for objects/arrays, otherwise shallow comparison
      let passed = false;
      if (typeof test.expected === 'object' && test.expected !== null) {
        passed = JSON.stringify(output) === JSON.stringify(test.expected);
      } else {
        passed = output == test.expected; // Using == for type coercion for primitives
      }
      
      results.push({
        input: JSON.stringify(test.input),
        expected: test.expected,
        actual: output,
        passed: passed
      });
    } catch (error: any) {
      results.push({
        input: JSON.stringify(test.input),
        expected: test.expected,
        actual: `Error: ${error.message}`,
        passed: false
      });
    }
  }
  
  return results;
};

// Mock execute code for non-JavaScript languages
export const mockExecuteCode = (
  language: Language, 
  puzzle: Puzzle,
  displayTestResults: (results: TestResult[]) => void // Accept the display function
) => {
  // Simulate test execution for non-JavaScript languages
  const allPassed = Math.random() > 0.3; // Random result for demo purposes
  
  const mockResults: TestResult[] = puzzle.tests.map((test, index) => ({
    input: JSON.stringify(test.input),
    expected: test.expected,
    // Simulate actual output based on pass/fail
    actual: allPassed ? test.expected : `Simulated incorrect output for test ${index + 1}`,
    passed: allPassed || Math.random() > 0.5 // Allow some individual passes even if overall fails
  }));

  // Simulate a slight delay to mimic execution time
  setTimeout(() => {
    // Use the passed display function to show results
    displayTestResults(mockResults);
  }, 500); 
}; 