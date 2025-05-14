import { Puzzle } from "../App";

// Define puzzles with templates for each language
export const puzzles: Puzzle[] = [
  {
    id: "puzzle1",
    title: "String Reversal",
    description:
      "Complete the reverseString function to reverse the input string.",
    templates: {
      javascript: `// PUZZLE: String Reversal
// Complete the function to reverse the input string
// Example: reverseString("hello") should return "olleh"

function reverseString(str) {
    // Your code here
    
}`,
      python: `# PUZZLE: String Reversal
# Complete the function to reverse the input string
# Example: reverse_string("hello") should return "olleh"

def reverse_string(s):
    # Your code here
    pass`,
      java: `// PUZZLE: String Reversal
// Complete the function to reverse the input string
// Example: reverseString("hello") should return "olleh"

public class StringReversal {
    public static String reverseString(String str) {
        // Your code here
        
        return "";
    }
}`,
      cpp: `// PUZZLE: String Reversal
// Complete the function to reverse the input string
// Example: reverseString("hello") should return "olleh"

#include <string>

std::string reverseString(const std::string& str) {
    // Your code here
    
    return "";
}`,
      csharp: `// PUZZLE: String Reversal
// Complete the function to reverse the input string
// Example: ReverseString("hello") should return "olleh"

using System;

public class StringUtils {
    public static string ReverseString(string str) {
        // Your code here
        
        return "";
    }
}`,
      go: `// PUZZLE: String Reversal
// Complete the function to reverse the input string
// Example: reverseString("hello") should return "olleh"

package main

func reverseString(str string) string {
    // Your code here
    
    return ""
}`,
      rust: `// PUZZLE: String Reversal
// Complete the function to reverse the input string
// Example: reverse_string("hello") should return "olleh"

fn reverse_string(s: &str) -> String {
    // Your code here
    
    String::new()
}`,
      typescript: `// PUZZLE: String Reversal
// Complete the function to reverse the input string
// Example: reverseString("hello") should return "olleh"

function reverseString(str: string): string {
    // Your code here
    
    return "";
}`,
    },
    tests: [
      { input: ["hello"], expected: "olleh" },
      { input: ["javascript"], expected: "tpircsavaj" },
    ],
  },
  {
    id: "puzzle2",
    title: "Find the Missing Number",
    description:
      "Find the missing number in an array containing numbers from 1 to 10.",
    templates: {
      javascript: `// PUZZLE: Find the Missing Number
// The array contains numbers from 1 to 10 with one number missing
// Complete the findMissingNumber function to return the missing number

function findMissingNumber(numbers) {
    // Your code here
    
}`,
      python: `# PUZZLE: Find the Missing Number
# The array contains numbers from 1 to 10 with one number missing
# Complete the find_missing_number function to return the missing number

def find_missing_number(numbers):
    # Your code here
    pass`,
      java: `// PUZZLE: Find the Missing Number
// The array contains numbers from 1 to 10 with one number missing
// Complete the findMissingNumber function to return the missing number

public class MissingNumber {
    public static int findMissingNumber(int[] numbers) {
        // Your code here
        
        return 0;
    }
}`,
      cpp: `// PUZZLE: Find the Missing Number
// The array contains numbers from 1 to 10 with one number missing
// Complete the findMissingNumber function to return the missing number

#include <vector>

int findMissingNumber(const std::vector<int>& numbers) {
    // Your code here
    
    return 0;
}`,
      csharp: `// PUZZLE: Find the Missing Number
// The array contains numbers from 1 to 10 with one number missing
// Complete the FindMissingNumber function to return the missing number

using System;
using System.Collections.Generic;

public class NumberFinder {
    public static int FindMissingNumber(List<int> numbers) {
        // Your code here
        
        return 0;
    }
}`,
      go: `// PUZZLE: Find the Missing Number
// The array contains numbers from 1 to 10 with one number missing
// Complete the findMissingNumber function to return the missing number

package main

func findMissingNumber(numbers []int) int {
    // Your code here
    
    return 0
}`,
      rust: `// PUZZLE: Find the Missing Number
// The array contains numbers from 1 to 10 with one number missing
// Complete the find_missing_number function to return the missing number

fn find_missing_number(numbers: &[i32]) -> i32 {
    // Your code here
    
    0
}`,
      typescript: `// PUZZLE: Find the Missing Number
// The array contains numbers from 1 to 10 with one number missing
// Complete the findMissingNumber function to return the missing number

function findMissingNumber(numbers: number[]): number {
    // Your code here
    
    return 0;
}`,
    },
    tests: [{ input: [[1, 2, 3, 5, 6, 7, 8, 9, 10]], expected: 4 }],
  },
  {
    id: "puzzle3",
    title: "Secret Message Decoder",
    description:
      "Decode the secret message by implementing the decoder function.",
    templates: {
      javascript: `// PUZZLE: Secret Message Decoder
// The message has been encoded by shifting each letter in the alphabet
// by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
// Complete the decodeMessage function to decode the message

function decodeMessage(encodedMessage) {
    // Your code here
    
}`,
      python: `# PUZZLE: Secret Message Decoder
# The message has been encoded by shifting each letter in the alphabet
# by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
# Complete the decode_message function to decode the message

def decode_message(encoded_message):
    # Your code here
    pass`,
      java: `// PUZZLE: Secret Message Decoder
// The message has been encoded by shifting each letter in the alphabet
// by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
// Complete the decodeMessage function to decode the message

public class MessageDecoder {
    public static String decodeMessage(String encodedMessage) {
        // Your code here
        
        return "";
    }
}`,
      cpp: `// PUZZLE: Secret Message Decoder
// The message has been encoded by shifting each letter in the alphabet
// by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
// Complete the decodeMessage function to decode the message

#include <string>

std::string decodeMessage(const std::string& encodedMessage) {
    // Your code here
    
    return "";
}`,
      csharp: `// PUZZLE: Secret Message Decoder
// The message has been encoded by shifting each letter in the alphabet
// by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
// Complete the DecodeMessage function to decode the message

using System;

public class Decoder {
    public static string DecodeMessage(string encodedMessage) {
        // Your code here
        
        return "";
    }
}`,
      go: `// PUZZLE: Secret Message Decoder
// The message has been encoded by shifting each letter in the alphabet
// by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
// Complete the decodeMessage function to decode the message

package main

func decodeMessage(encodedMessage string) string {
    // Your code here
    
    return ""
}`,
      rust: `// PUZZLE: Secret Message Decoder
// The message has been encoded by shifting each letter in the alphabet
// by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
// Complete the decode_message function to decode the message

fn decode_message(encoded_message: &str) -> String {
    // Your code here
    
    String::new()
}`,
      typescript: `// PUZZLE: Secret Message Decoder
// The message has been encoded by shifting each letter in the alphabet
// by 3 positions (e.g., 'a' becomes 'd', 'b' becomes 'e', etc.)
// Complete the decodeMessage function to decode the message

function decodeMessage(encodedMessage: string): string {
    // Your code here
    
    return "";
}`,
    },
    tests: [{ input: ["frgh euhdnhu"], expected: "code breaker" }],
  },
];

