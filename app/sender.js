// const { messageQueue } = require('./queue');
// const { getClient } = require('./clients');

// // Process messages one by one
// messageQueue.process(async (job, done) => {
//   const { phoneNumber, messageText, clientIds } = job.data;

//   try {
//     const client = getClient(clientIds);
//     const formattedNumber = phoneNumber.replace(/\D/g, '');
//     const chatId = `${formattedNumber}@c.us`;

//     const isRegistered = await client.isRegisteredUser(chatId);
//     if (!isRegistered) {
//       console.error(`Number not registered: ${phoneNumber}`);
//       return done(new Error('Number not registered.'));
//     }

//     await client.sendMessage(chatId, messageText);
//     console.log(`Message sent to ${phoneNumber}: ${messageText}`);

//     // Add a slight delay (throttle)
//     await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 sec

//     done();

//   } catch (err) {
//     console.error('Error sending message:', err);
//     done(err);
//   }
// });

const { messageQueue } = require('./queue');
const { getClient } = require('./clients');

// Helper to sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

messageQueue.process(async (job, done) => {
  const { phoneNumber, messageText, clientIds } = job.data;

  try {
    const client = getClient(clientIds);
    if (!client) {
      console.error('No client instance available for:', clientIds);
      return done(new Error('Client not available.'));
    }

    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const chatId = `${formattedNumber}@c.us`;

    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      console.warn(`Number not registered: ${phoneNumber}`);
      return done(new Error('Number not registered.'));
    }

    // Anti-ban behavior
    const chat = await client.getChatById(chatId);
    await chat.sendStateTyping(); // simulate typing
    await sleep(Math.floor(Math.random() * 2000) + 1500); // 1.5 - 3.5s delay

    await client.sendPresenceAvailable();
    await client.sendMessage(chatId, messageText);
    await sleep(500); // Short delay after send

    console.log(`message sent to ${phoneNumber}: ${messageText}`);
    done();

  } catch (err) {
    console.error(`error sending message to ${phoneNumber}:`, err);
    done(err); // Optionally retry
  }
});
