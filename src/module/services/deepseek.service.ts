import OpenAI from "openai";

class DeepSeekService {
  private readonly apiKey: string | undefined;
  private client: OpenAI;

  constructor(api_Key: string) {
    this.apiKey = api_Key
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.deepseek.com/v1'
    });
  }

  async getModel() {
    try {
      const response = await this.client.models.list();
      return response.data;
    } catch (err) {
      throw err;
    }
  }

  async getChatCompletion(model: string, message: string) {
    try {
      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        n: 1
      })
      return response.choices[0].message.content;
    } catch (err) {
      throw err;
    }
  }
}

export default DeepSeekService;
