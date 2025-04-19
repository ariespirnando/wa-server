const express = require('express');
const bodyParser = require('body-parser');
const { initClients, getClient } = require('./clients');
const { messageQueue } = require('./queue');
require('./sender'); // Auto-run sender logic

const app = express();
app.use(bodyParser.json());

// Init WhatsApp Clients
initClients();

// Send API
app.post('/send', async (req, res) => {
  try {
    const { phoneNumber, messageText } = req.body;
    if (!phoneNumber || !messageText) {
      return res.status(400).json({ error: 'Missing parameters.' });
    }
    
    // Push to Redis queue
    await messageQueue.add({ phoneNumber, messageText });
    res.status(200).json({ success: true, message: 'Message added to queue.' });

  } catch (err) {
    console.error('Error /send:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Server
const port = 3000;
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
