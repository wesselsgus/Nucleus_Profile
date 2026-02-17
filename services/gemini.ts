
import { GoogleGenAI } from "@google/genai";

// Standardize simulation functions to use the recommended GoogleGenAI initialization pattern
export const simulateTroubleshooting = async (hostName: string, action: string) => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a terminal output for a system administrator running "${action}" on host "${hostName}". 
    Make it look highly technical and realistic. Include shell prompts like [admin@${hostName} ~]$. 
    Keep the output under 20 lines. Do not use markdown blocks, just raw text.`,
  });
  return response.text || "Error retrieving logs.";
};

export const simulateServerScan = async (hostName: string, verbose: boolean = false) => {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a comprehensive security and system health scan on host "${hostName}". 
    ${verbose ? "CRITICAL: This is a VERBOSE scan (--verbose). Include detailed memory address hex dumps, specific kernel system call traces (syscall), low-level disk I/O metrics, and granular process tree analysis." : "The script runs remotely via SSH, collects metrics, checks open ports, and then deletes itself."} 
    Output should show the script initialization, the scan phases (CPU, Memory, Network, FS), findings, and final cleanup log.
    Provide the output as raw terminal text.`,
  });
  return response.text || "Scan failed.";
};

export const simulateWebScan = async (url: string, tool: string) => {
  // Create a new GoogleGenAI instance right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a web vulnerability scan report for URL "${url}" using tool "${tool}". 
    Focus on OWASP Top 10 categories. Be specific with simulated CVE numbers or bug types. 
    Format it as high-density terminal output.`,
  });
  return response.text || "Vulnerability scan failed.";
};
