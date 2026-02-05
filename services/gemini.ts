import { GoogleGenAI } from "@google/genai";

// Support both standard process.env and Vite's import.meta.env for local development
const getApiKey = () => {
  return (process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY || "");
};

const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

export const simulateTroubleshooting = async (hostName: string, action: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a terminal output for a system administrator running "${action}" on host "${hostName}". 
    Make it look highly technical and realistic. Include shell prompts like [admin@${hostName} ~]$. 
    Keep the output under 20 lines. Do not use markdown blocks, just raw text.`,
  });
  return response.text || "Error retrieving logs.";
};

export const simulateServerScan = async (hostName: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a comprehensive security and system health scan on host "${hostName}". 
    The script runs remotely via SSH, collects metrics, checks open ports, and then deletes itself. 
    Output should show the script initialization, the scan phases (CPU, Memory, Network, FS), findings, and final cleanup log.
    Provide the output as raw terminal text.`,
  });
  return response.text || "Scan failed.";
};

export const simulateWebScan = async (url: string, tool: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate a web vulnerability scan report for URL "${url}" using tool "${tool}". 
    Focus on OWASP Top 10 categories. Be specific with simulated CVE numbers or bug types. 
    Format it as high-density terminal output.`,
  });
  return response.text || "Vulnerability scan failed.";
};
