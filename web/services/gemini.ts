

import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Theme } from '../types';

class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getSystemInstruction(theme: Theme): string {
    const base = `You are an automated Pattern Recognition Analyst for an offline-first telemetry system. 
    You will receive REDACTED / SANITIZED log snippets. 
    Your job is to analyze the PATTERN of events, not the specific identities.
    
    Rules:
    1. Acknowledge that PII has been scrubbed (e.g., "[REDACTED]").
    2. Assess the severity based on the sequence of events.
    3. Suggest immediate physical actions for the operator (Farmer, Captain, or Security Officer).
    4. Keep responses concise and military-grade professional.`;

    switch (theme) {
      case 'ranch':
        return `${base}
        Context: Agritech / Remote Farm.
        Potential Threats: Equipment theft, livestock predation, water pump failure, fire.
        Tone: Urgent, practical.`;
      case 'legal':
        return `${base}
        Context: Secure SCIF / Legal Archives.
        Potential Threats: Chain of custody breach, unauthorized device connection, after-hours physical access.
        Tone: Formal, compliance-focused.`;
      default:
        return `${base}
        Context: Maritime / Industrial IoT.
        Potential Threats: Engine vibration anomalies, cold chain temperature excursions, unauthorized bridge access.`;
    }
  }

  public initChat(theme: Theme) {
    this.chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: this.getSystemInstruction(theme),
      },
    });
  }

  public async sendMessage(message: string): Promise<string> {
    if (!this.chat) {
      this.initChat('edge');
    }

    try {
      if (!this.chat) throw new Error("Chat not initialized");
      
      const response: GenerateContentResponse = await this.chat.sendMessage({ message });
      return response.text || "Analysis failed.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Local Analysis Unavailable. Cloud Uplink Failed.";
    }
  }

  public async analyzeLog(sanitizedLog: string): Promise<string> {
    if (!this.chat) {
      this.initChat('edge');
    }

    try {
      if (!this.chat) throw new Error("Chat not initialized");
      
      const prompt = `[SYSTEM ALERT: INCOMING SANITIZED BUNDLE]\n\nLOG DATA:\n${sanitizedLog}\n\nAnalyze priority and recommended action.`;
      
      const response: GenerateContentResponse = await this.chat.sendMessage({ message: prompt });
      return response.text || "Analysis failed.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Local Analysis Unavailable. Cloud Uplink Failed.";
    }
  }
}

export const geminiService = new GeminiService();