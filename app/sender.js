const { messageQueue } = require('./queue');
const { getClient } = require('./clients');

// Process messages one by one
messageQueue.process(async (job, done) => {
  const { phoneNumber, messageText } = job.data;

  try {
    const client = getClient();
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const chatId = `${formattedNumber}@c.us`;

    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      console.error(`Number not registered: ${phoneNumber}`);
      return done(new Error('Number not registered.'));
    }

    await client.sendMessage(chatId, messageText);
    console.log(`Message sent to ${phoneNumber}: ${messageText}`);

    // Add a slight delay (throttle)
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 sec

    done();

  } catch (err) {
    console.error('Error sending message:', err);
    done(err);
  }
});
