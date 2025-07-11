import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private readonly apiKey: string | undefined;
  private client: GoogleGenAI;

  constructor(api_Key: string) {
    this.apiKey = api_Key
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async getModel() {
    try {
      const response = await this.client.models.list();
      return response;
    } catch (err) {
      throw err;
    }
  }

  async getChatCompletion(model: string, message: string) {
    try {
      const response = await this.client.models.generateContent({
        model: model,
        contents: message,
        config: {
          systemInstruction: "You are a helpful assistant.",
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
      return response.text;
    } catch (err) {
      throw err;
    }
  }
}

export default GeminiService;
