'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/ui/code-block";

export default function DocsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">BotStudio API Documentation</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="text-gray-600 mb-4">
          The BotStudio API client provides a simple way to interact with your bots programmatically.
          This documentation will guide you through installation, setup, and usage of the client.
        </p>
      </div>

      <Tabs defaultValue="installation" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="installation">
          <Card>
            <CardHeader>
              <CardTitle>Installation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Install the BotStudio client using npm:</p>
              <CodeBlock language="bash">
                npm install botstudio-client
              </CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Import and initialize the client:</p>
              <CodeBlock language="typescript">
                {`import { BotStudioClient } from 'botstudio-client';

// Initialize with your API key
const client = new BotStudioClient('YOUR_API_KEY');

// Optionally specify a custom base URL
const client = new BotStudioClient('YOUR_API_KEY', 'http://custom-url.com');`}
              </CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>API Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">List Bots</h3>
                <p className="text-gray-600 mb-2">Get all bots associated with your API key.</p>
                <CodeBlock language="typescript">
                  {`const bots = await client.listBots();
console.log(bots);`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Get Bot Details</h3>
                <p className="text-gray-600 mb-2">Get detailed information about a specific bot.</p>
                <CodeBlock language="typescript">
                  {`const botDetails = await client.getBot('BOT_ID');
console.log(botDetails);`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Interact with Bot</h3>
                <p className="text-gray-600 mb-2">Send a message to a bot and get its response.</p>
                <CodeBlock language="typescript">
                  {`const response = await client.interactWithBot('BOT_ID', 'Hello, bot!');
console.log(response);`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Get Credit Balance</h3>
                <p className="text-gray-600 mb-2">Check your current credit balance.</p>
                <CodeBlock language="typescript">
                  {`const balance = await client.getCreditBalance();
console.log(balance);`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Complete Example</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="typescript">
                {`import { BotStudioClient } from 'botstudio-client';

async function main() {
  // Initialize client
  const client = new BotStudioClient('YOUR_API_KEY');

  try {
    // List all bots
    const bots = await client.listBots();
    console.log('Available bots:', bots);

    if (bots.length > 0) {
      const firstBot = bots[0];

      // Get bot details
      const botDetails = await client.getBot(firstBot._id);
      console.log('Bot details:', botDetails);

      // Interact with bot
      const response = await client.interactWithBot(
        firstBot._id,
        'Hello, how are you?'
      );
      console.log('Bot response:', response);
    }

    // Check credit balance
    const balance = await client.getCreditBalance();
    console.log('Credit balance:', balance);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();`}
              </CodeBlock>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
        <p className="text-gray-600 mb-4">
          The client includes built-in error handling for common scenarios:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>Invalid API key</li>
          <li>Bot not found</li>
          <li>Unauthorized access</li>
          <li>Inactive bot</li>
          <li>Network errors</li>
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Response Types</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Bot Object</h3>
            <CodeBlock language="typescript">
              {`interface Bot {
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
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Bot Response</h3>
            <CodeBlock language="typescript">
              {`interface BotResponse {
  response: string;
  timestamp: string;
}`}
            </CodeBlock>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Credit Balance</h3>
            <CodeBlock language="typescript">
              {`interface CreditBalance {
  balance: number;
  lastUpdated: string;
}`}
            </CodeBlock>
          </div>
        </div>
      </div>
    </div>
  );
}
