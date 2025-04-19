# BotStudio Client

Official TypeScript client library for BotStudio API - A platform for creating and managing AI-powered chatbots.

## Installation

```bash
npm install botstudio-client
```

## Usage

```typescript
import { BotStudioClient } from 'botstudio-client';

// Initialize the client with your API key
const client = new BotStudioClient('your-api-key');

// List all your bots
const bots = await client.listBots();

// Get details of a specific bot
const bot = await client.getBot('bot-id');

// Interact with a bot
const response = await client.interactWithBot('bot-id', 'Hello!');

// Get your credit balance
const balance = await client.getCreditBalance();
```

## API Reference

### BotStudioClient

#### Constructor
```typescript
constructor(apiKey: string, baseURL?: string)
```

#### Methods

##### listBots()
Returns a promise that resolves to an array of `Bot` objects.

##### getBot(botId: string)
Returns a promise that resolves to a `Bot` object.

##### interactWithBot(botId: string, message: string)
Returns a promise that resolves to a `BotResponse` object.

##### getCreditBalance()
Returns a promise that resolves to a `CreditBalance` object.

### Types

#### Bot
```typescript
interface Bot {
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
```

#### BotResponse
```typescript
interface BotResponse {
  response: string;
  timestamp: string;
}
```

#### CreditBalance
```typescript
interface CreditBalance {
  balance: number;
  lastUpdated: string;
}
```

## License

MIT 