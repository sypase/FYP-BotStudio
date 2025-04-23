import { BotStudioClient } from './src/index';

const API_KEY = 'U0MPFmmIMMypZpwhyDncwhOab34B4N2J';
const BASE_URL = 'http://localhost:8087';

console.log('Initializing BotStudio client...');
const client = new BotStudioClient(API_KEY, BASE_URL);

async function testClient() {
  try {
    // Test 1: List all bots
    console.log('\n=== Testing: List all bots ===');
    const bots = await client.listBots();
    console.log(`Found ${bots.length} bots:`);
    bots.forEach((bot, index) => {
      console.log(`\nBot ${index + 1}:`);
      console.log(`  ID: ${bot._id}`);
      console.log(`  Name: ${bot.name}`);
      console.log(`  Status: ${bot.isActive ? 'Active' : 'Inactive'}`);
      console.log(`  Category: ${bot.category}`);
      console.log(`  Total Interactions: ${bot.totalInteractions}`);
    });

    if (bots.length > 0) {
      const firstBot = bots[0];

      // Test 2: Get bot details
      console.log('\n=== Testing: Get bot details ===');
      const botDetails = await client.getBot(firstBot._id);
      console.log('Bot details:', JSON.stringify(botDetails, null, 2));

      // Test 3: Interact with bot
      console.log('\n=== Testing: Bot interaction ===');
      const testMessage = 'Hello, bot! How are you today?';
      console.log(`Sending message: "${testMessage}"`);
      const response = await client.interactWithBot(firstBot._id, testMessage);
      console.log('Bot response:', response);
    }

    // Test 4: Get credit balance
    console.log('\n=== Testing: Get credit balance ===');
    const creditBalance = await client.getCreditBalance();
    console.log('Credit balance:', JSON.stringify(creditBalance, null, 2));

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('\nError during testing:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

console.log('Starting BotStudio client tests...');
testClient();

async function testBotInteraction() {
  console.log('\n=== Testing: Bot interaction ===');
  const botId = '67f7e33095e62432d976e94d';
  const message = 'what courses are there in the college?';
  
  console.log(`Sending message to bot ${botId}: "${message}"`);
  
  try {
    const response = await client.interactWithBot(botId, message);
    console.log('\nBot response:', response.data.response);
    console.log('Remaining credits:', response.data.remainingCredits);
    console.log('Processing time:', response.data.processingTime, 'ms');
    console.log('Token usage:', response.data.usage);
  } catch (error: unknown) {
    console.error('\nError during interaction:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}

// Run the test
testBotInteraction().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error('Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } else {
    console.error('Test failed with unknown error:', error);
  }
  process.exit(1);
}); 