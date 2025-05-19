// src/utils/templateGenerator.ts - Updated with universal function name

import { Language } from "../App";

export interface PuzzleSpec {
  name: string; // Original puzzle identifier (for internal use)
  description: string; // Description of the puzzle
  returnType: string; // Return type (e.g., "number", "string", "boolean")
  returnDescription: string; // Description of what to return
  parameters?: Parameter[]; // Optional parameters (for UI display, not used in function)
  hints?: string[]; // Optional hints
  defaultReturnValue?: string; // Default return value for templates
  puzzleId?: string; // Add puzzle identifier for templates
}

export interface Parameter {
  name: string; // Parameter name
  type: string; // Parameter type
  description: string; // Parameter description
}

// UNIVERSAL FUNCTION NAME - All puzzles use this
const UNIVERSAL_FUNCTION_NAME = "solution";

/**
 * Generate language-specific function names - now always returns the same universal name
 */
export function generateFunctionNames(
  spec: PuzzleSpec,
): Record<Language, string> {
  // All languages use the same function name
  const functionNames: Record<Language, string> = {
    javascript: UNIVERSAL_FUNCTION_NAME,
    typescript: UNIVERSAL_FUNCTION_NAME,
    python: UNIVERSAL_FUNCTION_NAME,
    java: `PuzzleClass.${UNIVERSAL_FUNCTION_NAME}`,
    cpp: UNIVERSAL_FUNCTION_NAME,
    csharp: `PuzzleClass.${UNIVERSAL_FUNCTION_NAME.charAt(0).toUpperCase() + UNIVERSAL_FUNCTION_NAME.slice(1)}`,
    go: UNIVERSAL_FUNCTION_NAME,
    rust: UNIVERSAL_FUNCTION_NAME,
  };

  return functionNames;
}

/**
 * Generate templates for all supported languages with universal function name
 */
export function generateTemplates(spec: PuzzleSpec): Record<Language, string> {
  const templates: Record<Language, string> = {
    javascript: generateJavaScriptTemplate(spec),
    typescript: generateTypeScriptTemplate(spec),
    python: generatePythonTemplate(spec),
    java: generateJavaTemplate(spec),
    cpp: generateCppTemplate(spec),
    csharp: generateCSharpTemplate(spec),
    go: generateGoTemplate(spec),
    rust: generateRustTemplate(spec),
  };

  return templates;
}

/**
 * Get puzzle header with clear identification
 */
function getPuzzleHeader(spec: PuzzleSpec): string {
  const headerLines = [
    "=".repeat(50),
    `PUZZLE: ${spec.name.toUpperCase()}`,
    "=".repeat(50),
    spec.description,
    "",
  ];

  if (spec.hints && spec.hints.length > 0) {
    headerLines.push("HINTS:");
    spec.hints.forEach((hint, index) => {
      headerLines.push(`  ${index + 1}. ${hint}`);
    });
    headerLines.push("");
  }

  headerLines.push(
    `Expected Return: ${spec.returnType} - ${spec.returnDescription}`,
    "",
    "IMPORTANT: Your function must be named 'solution()' exactly!",
    "=".repeat(50),
  );

  return headerLines.join("\n");
}

/**
 * Get default return value for the given language and type
 */
function getDefaultReturnValue(
  type: string,
  language: Language,
  defaultValue?: string,
): string {
  if (defaultValue) return defaultValue;

  switch (language) {
    case "rust":
      switch (type.toLowerCase()) {
        case "number":
        case "i32":
          return "0";
        case "string":
          return "String::new()";
        case "boolean":
        case "bool":
          return "false";
        default:
          return "()";
      }
    default:
      switch (type.toLowerCase()) {
        case "number":
        case "int":
          return "0";
        case "string":
          return '""';
        case "boolean":
        case "bool":
          return "false";
        default:
          return "null";
      }
  }
}

/**
 * Generate JavaScript template with universal function name
 */
function generateJavaScriptTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);

  return `/*
${header}
*/

function ${UNIVERSAL_FUNCTION_NAME}() {
    // Your solution code goes here
    // Remember: This function should return ${spec.returnType}
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "javascript")}; // Replace with your solution
}

// Test your function (optional - you can run this to see if it works)
// console.log("Result:", ${UNIVERSAL_FUNCTION_NAME}());`;
}

/**
 * Generate TypeScript template with universal function name
 */
function generateTypeScriptTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);
  const returnType = getTypeAnnotation(spec.returnType, "typescript");

  return `/*
${header}
*/

function ${UNIVERSAL_FUNCTION_NAME}(): ${returnType} {
    // Your solution code goes here
    // Remember: This function should return ${spec.returnType}
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "typescript")}; // Replace with your solution
}

// Test your function (optional - you can run this to see if it works)
// console.log("Result:", ${UNIVERSAL_FUNCTION_NAME}());`;
}

/**
 * Generate Python template with universal function name
 */
function generatePythonTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);

  return `"""
${header}
"""

def ${UNIVERSAL_FUNCTION_NAME}():
    # Your solution code goes here
    # Remember: This function should return ${spec.returnType}
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "python")}  # Replace with your solution

# Test your function (optional - you can run this to see if it works)
# print("Result:", ${UNIVERSAL_FUNCTION_NAME}())`;
}

/**
 * Generate Java template with universal function name
 */
function generateJavaTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);
  const returnType = getTypeAnnotation(spec.returnType, "java");

  return `/*
${header}
*/

public class PuzzleClass {
    public static ${returnType} ${UNIVERSAL_FUNCTION_NAME}() {
        // Your solution code goes here
        // Remember: This function should return ${spec.returnType}
        
        return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "java")}; // Replace with your solution
    }
    
    // Test method (optional)
    // public static void main(String[] args) {
    //     System.out.println("Result: " + ${UNIVERSAL_FUNCTION_NAME}());
    // }
}`;
}

/**
 * Generate C++ template with universal function name
 */
function generateCppTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);
  const returnType = getTypeAnnotation(spec.returnType, "cpp");

  return `/*
${header}
*/

#include <iostream>
${spec.returnType.toLowerCase() === "string" ? "#include <string>" : ""}

${returnType} ${UNIVERSAL_FUNCTION_NAME}() {
    // Your solution code goes here
    // Remember: This function should return ${spec.returnType}
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "cpp")}; // Replace with your solution
}

// Test function (optional)
// int main() {
//     auto result = ${UNIVERSAL_FUNCTION_NAME}();
//     std::cout << "Result: " << result << std::endl;
//     return 0;
// }`;
}

/**
 * Generate C# template with universal function name
 */
function generateCSharpTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);
  const returnType = getTypeAnnotation(spec.returnType, "csharp");
  const funcName =
    UNIVERSAL_FUNCTION_NAME.charAt(0).toUpperCase() +
    UNIVERSAL_FUNCTION_NAME.slice(1);

  return `/*
${header}
*/

using System;

public class PuzzleClass {
    public static ${returnType} ${funcName}() {
        // Your solution code goes here
        // Remember: This function should return ${spec.returnType}
        
        return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "csharp")}; // Replace with your solution
    }
    
    // Test method (optional)
    // public static void Main() {
    //     Console.WriteLine("Result: " + ${funcName}());
    // }
}`;
}

/**
 * Generate Go template with universal function name
 */
function generateGoTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);
  const returnType = getTypeAnnotation(spec.returnType, "go");

  return `/*
${header}
*/

package main

import "fmt"

func ${UNIVERSAL_FUNCTION_NAME}() ${returnType} {
    // Your solution code goes here
    // Remember: This function should return ${spec.returnType}
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "go")} // Replace with your solution
}

// Test function (optional)
// func main() {
//     result := ${UNIVERSAL_FUNCTION_NAME}()
//     fmt.Println("Result:", result)
// }`;
}

/**
 * Generate Rust template with universal function name
 */
function generateRustTemplate(spec: PuzzleSpec): string {
  const header = getPuzzleHeader(spec);
  const returnType = getTypeAnnotation(spec.returnType, "rust");

  return `/*
${header}
*/

fn ${UNIVERSAL_FUNCTION_NAME}() -> ${returnType} {
    // Your solution code goes here
    // Remember: This function should return ${spec.returnType}
    
    ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "rust")} // Replace with your solution
}

// Test function (optional)
// fn main() {
//     let result = ${UNIVERSAL_FUNCTION_NAME}();
//     println!("Result: {:?}", result);
// }`;
}

/**
 * Generate appropriate type annotations for different languages
 */
function getTypeAnnotation(type: string, language: Language): string {
  switch (language) {
    case "typescript":
      return type;
    case "python":
      return type.toLowerCase();
    case "java":
      switch (type.toLowerCase()) {
        case "number":
          return "int";
        case "string":
          return "String";
        case "boolean":
          return "boolean";
        default:
          return type;
      }
    case "cpp":
      switch (type.toLowerCase()) {
        case "number":
          return "int";
        case "string":
          return "std::string";
        case "boolean":
          return "bool";
        default:
          return type;
      }
    case "csharp":
      switch (type.toLowerCase()) {
        case "number":
          return "int";
        case "string":
          return "string";
        case "boolean":
          return "bool";
        default:
          return type;
      }
    case "go":
      switch (type.toLowerCase()) {
        case "number":
          return "int";
        case "string":
          return "string";
        case "boolean":
          return "bool";
        default:
          return type;
      }
    case "rust":
      switch (type.toLowerCase()) {
        case "number":
          return "i32";
        case "string":
          return "String";
        case "boolean":
          return "bool";
        default:
          return type;
      }
    default:
      return type;
  }
}
