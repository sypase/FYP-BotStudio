import axios from 'axios';

export interface Bot {
  _id: string;
  name: string;
  botModelId: string;
  trainingStatus: 'pending' | 'completed' | 'failed';
  isPublic: boolean;
  isActive: boolean;
  category: string;
  totalInteractions: number;
  rating: number;
  createdAt: string;
}

export interface BotResponse {
  success: boolean;
  data: {
    response: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    processingTime: number;
    remainingCredits: number;
  };
  error?: string;
}

export interface CreditBalance {
  balance: number;
  lastUpdated: string;
}

export class BotStudioClient {
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey: string, baseURL: string = 'http://localhost:8087') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  private getHeaders() {
    return {
      'x-api-key': this.apiKey
    };
  }

  /**
   * List all bots for the API key user
   */
  async listBots(): Promise<Bot[]> {
    try {
      const response = await axios.get(`${this.baseURL}/api-key/bots`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch bots');
      }
      throw error;
    }
  }

  /**
   * Get details of a specific bot
   */
  async getBot(botId: string): Promise<Bot> {
    try {
      const response = await axios.get(`${this.baseURL}/api-key/bot/${botId}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch bot details');
      }
      throw error;
    }
  }

  /**
   * Interact with a bot
   */
  async interactWithBot(botId: string, message: string): Promise<BotResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/api-key/bot/${botId}/interact`,
        { message },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorResponse = error.response?.data;
        throw new Error(errorResponse?.error || 'Failed to interact with bot');
      }
      throw error;
    }
  }

  /**
   * Get credit balance
   */
  async getCreditBalance(): Promise<CreditBalance> {
    try {
      const response = await axios.get(`${this.baseURL}/api-key/credits`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to fetch credit balance');
      }
      throw error;
    }
  }
} 