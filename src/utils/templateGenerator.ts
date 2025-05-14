// src/utils/templateGenerator.ts
import { Language } from "../App";

export interface PuzzleSpec {
  name: string; // Function/method name (in camelCase)
  description: string; // Description of the puzzle
  returnType: string; // Return type (e.g., "number", "string", "boolean")
  returnDescription: string; // Description of what to return
  parameters?: Parameter[]; // Optional parameters
  hints?: string[]; // Optional hints
  defaultReturnValue?: string; // Default return value for templates
}

export interface Parameter {
  name: string; // Parameter name
  type: string; // Parameter type
  description: string; // Parameter description
}

/**
 * Converts camelCase to snake_case for Python and Rust
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converts camelCase to PascalCase for C#
 */
function toPascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates appropriate type annotations for different languages
 */
function getTypeAnnotation(type: string, language: Language): string {
  switch (language) {
    case "typescript":
      return type;
    case "python":
      // Python uses type hints in comments or docstrings
      return type.toLowerCase();
    case "java":
      // Convert JavaScript types to Java types
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
      // Convert JavaScript types to C++ types
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
      // Convert JavaScript types to C# types
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
      // Convert JavaScript types to Go types
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
      // Convert JavaScript types to Rust types
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

/**
 * Get the default return value for the given language and type
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
 * Generate language-specific function names
 */
export function generateFunctionNames(
  spec: PuzzleSpec,
): Record<Language, string> {
  const functionNames: Record<Language, string> = {
    javascript: spec.name,
    typescript: spec.name,
    python: toSnakeCase(spec.name),
    java: `PuzzleClass.${spec.name}`,
    cpp: spec.name,
    csharp: `PuzzleClass.${toPascalCase(spec.name)}`,
    go: spec.name,
    rust: toSnakeCase(spec.name),
  };

  return functionNames;
}

/**
 * Generate templates for all supported languages
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
 * Generate JavaScript template
 */
function generateJavaScriptTemplate(spec: PuzzleSpec): string {
  const params = (spec.parameters || []).map((p) => p.name).join(", ");

  const paramsDoc = (spec.parameters || [])
    .map((p) => ` * @param {${p.type}} ${p.name} - ${p.description}`)
    .join("\n");

  const hintsDoc = (spec.hints || [])
    .map((hint) => ` * Hint: ${hint}`)
    .join("\n");

  const returnDoc = ` * @returns {${spec.returnType}} ${spec.returnDescription}`;

  return `/**
 * ${spec.description}
${paramsDoc ? paramsDoc + "\n" : ""}${hintsDoc ? hintsDoc + "\n" : ""}${returnDoc}
 */
function ${spec.name}(${params}) {
  // Your code here
  
  return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "javascript")}; // Replace with your solution
}`;
}

/**
 * Generate TypeScript template
 */
function generateTypeScriptTemplate(spec: PuzzleSpec): string {
  const params = (spec.parameters || [])
    .map((p) => `${p.name}: ${getTypeAnnotation(p.type, "typescript")}`)
    .join(", ");

  const paramsDoc = (spec.parameters || [])
    .map((p) => ` * @param {${p.type}} ${p.name} - ${p.description}`)
    .join("\n");

  const hintsDoc = (spec.hints || [])
    .map((hint) => ` * Hint: ${hint}`)
    .join("\n");

  const returnDoc = ` * @returns {${spec.returnType}} ${spec.returnDescription}`;

  return `/**
 * ${spec.description}
${paramsDoc ? paramsDoc + "\n" : ""}${hintsDoc ? hintsDoc + "\n" : ""}${returnDoc}
 */
function ${spec.name}(${params}): ${getTypeAnnotation(spec.returnType, "typescript")} {
  // Your code here
  
  return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "typescript")}; // Replace with your solution
}`;
}

/**
 * Generate Python template
 */
function generatePythonTemplate(spec: PuzzleSpec): string {
  const funcName = toSnakeCase(spec.name);

  const params = (spec.parameters || []).map((p) => p.name).join(", ");

  const hintsDoc = (spec.hints || [])
    .map((hint) => `    Hint: ${hint}`)
    .join("\n");

  return `"""
${spec.description}

${(spec.parameters || [])
  .map(
    (p) => `Args:
    ${p.name}: ${p.description}`,
  )
  .join("\n")}
${hintsDoc ? "\n" + hintsDoc : ""}

Returns:
    ${getTypeAnnotation(spec.returnType, "python")}: ${spec.returnDescription}
"""
def ${funcName}(${params}):
    # Your code here
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "python")}  # Replace with your solution`;
}

/**
 * Generate Java template
 */
function generateJavaTemplate(spec: PuzzleSpec): string {
  const params = (spec.parameters || [])
    .map((p) => `${getTypeAnnotation(p.type, "java")} ${p.name}`)
    .join(", ");

  const hintsDoc = (spec.hints || [])
    .map((hint) => ` * Hint: ${hint}`)
    .join("\n");

  return `/**
 * ${spec.description}
${(spec.parameters || []).map((p) => ` * @param ${p.name} ${p.description}`).join("\n")}
${hintsDoc ? hintsDoc + "\n" : ""} * @return ${spec.returnDescription}
 */
public class PuzzleClass {
    public static ${getTypeAnnotation(spec.returnType, "java")} ${spec.name}(${params}) {
        // Your code here
        
        return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "java")}; // Replace with your solution
    }
}`;
}

/**
 * Generate C++ template
 */
function generateCppTemplate(spec: PuzzleSpec): string {
  const params = (spec.parameters || [])
    .map((p) => `${getTypeAnnotation(p.type, "cpp")} ${p.name}`)
    .join(", ");

  const hintsDoc = (spec.hints || [])
    .map((hint) => ` * Hint: ${hint}`)
    .join("\n");

  return `/**
 * ${spec.description}
${(spec.parameters || []).map((p) => ` * @param ${p.name} ${p.description}`).join("\n")}
${hintsDoc ? hintsDoc + "\n" : ""} * @return ${spec.returnDescription}
 */
${getTypeAnnotation(spec.returnType, "cpp")} ${spec.name}(${params}) {
    // Your code here
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "cpp")}; // Replace with your solution
}`;
}

/**
 * Generate C# template
 */
function generateCSharpTemplate(spec: PuzzleSpec): string {
  const funcName = toPascalCase(spec.name);

  const params = (spec.parameters || [])
    .map((p) => `${getTypeAnnotation(p.type, "csharp")} ${p.name}`)
    .join(", ");

  const hintsDoc = (spec.hints || [])
    .map((hint) => ` * Hint: ${hint}`)
    .join("\n");

  return `/**
 * ${spec.description}
${(spec.parameters || []).map((p) => ` * @param ${p.name} ${p.description}`).join("\n")}
${hintsDoc ? hintsDoc + "\n" : ""} * @return ${spec.returnDescription}
 */
public class PuzzleClass {
    public static ${getTypeAnnotation(spec.returnType, "csharp")} ${funcName}(${params}) {
        // Your code here
        
        return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "csharp")}; // Replace with your solution
    }
}`;
}

/**
 * Generate Go template
 */
function generateGoTemplate(spec: PuzzleSpec): string {
  const params = (spec.parameters || [])
    .map((p) => `${p.name} ${getTypeAnnotation(p.type, "go")}`)
    .join(", ");

  const hintsDoc = (spec.hints || [])
    .map((hint) => ` * Hint: ${hint}`)
    .join("\n");

  return `/**
 * ${spec.description}
${(spec.parameters || []).map((p) => ` * @param ${p.name} ${p.description}`).join("\n")}
${hintsDoc ? hintsDoc + "\n" : ""} * @return ${spec.returnDescription}
 */
package main

func ${spec.name}(${params}) ${getTypeAnnotation(spec.returnType, "go")} {
    // Your code here
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "go")} // Replace with your solution
}`;
}

/**
 * Generate Rust template
 */
function generateRustTemplate(spec: PuzzleSpec): string {
  const funcName = toSnakeCase(spec.name);

  const params = (spec.parameters || [])
    .map((p) => `${p.name}: ${getTypeAnnotation(p.type, "rust")}`)
    .join(", ");

  const hintsDoc = (spec.hints || [])
    .map((hint) => ` * Hint: ${hint}`)
    .join("\n");

  return `/**
 * ${spec.description}
${(spec.parameters || []).map((p) => ` * @param ${p.name} ${p.description}`).join("\n")}
${hintsDoc ? hintsDoc + "\n" : ""} * @return ${spec.returnDescription}
 */
fn ${funcName}(${params}) -> ${getTypeAnnotation(spec.returnType, "rust")} {
    // Your code here
    
    return ${spec.defaultReturnValue || getDefaultReturnValue(spec.returnType, "rust")}; // Replace with your solution
}`;
}
