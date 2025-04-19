const express = require('express');
const bodyParser = require('body-parser');
const { initClient, getClientStatus, logoutClient, restoreAllClients } = require('./clients');
const { messageQueue } = require('./queue');
require('./sender'); // Auto-run sender logic

const app = express();
app.use(bodyParser.json());

(async () => {
  await restoreAllClients();
})();
 
// Send API
app.post('/register', async (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'Missing clientId.' });
    }

    const result = await initClient(clientId);

    if (result.status === 'already_initialized') {
      return res.status(200).json({ success: true, message: 'Client already registered.' });
    }

    res.status(200).json({
      success: true,
      message: 'Client registered successfully.',
      qr: result.qr
    });
  } catch (err) {
    console.error('Error /register:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send API
app.post('/send', async (req, res) => {
  try {
    const { phoneNumbers, messageText, clientIds } = req.body;

    if (
      !Array.isArray(phoneNumbers) || phoneNumbers.length === 0 ||
      !messageText ||
      !Array.isArray(clientIds) || clientIds.length === 0
    ) {
      return res.status(400).json({ error: 'Missing or invalid parameters.' });
    }

    for (const phoneNumber of phoneNumbers) {
      await messageQueue.add({ phoneNumber, messageText, clientIds });
    }

    res.status(200).json({ success: true, message: 'Messages added to queue.' });

  } catch (err) {
    console.error('Error /send:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Get client status
app.get('/status/:clientId', (req, res) => {
  try {
    const { clientId } = req.params;
    const status = getClientStatus(clientId);
    res.status(200).json({ clientId, ...status });
  } catch (err) {
    console.error('Error /status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout client
app.post('/logout', async (req, res) => {
  try {
    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'Missing clientId.' });
    }

    const result = await logoutClient(clientId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (err) {
    console.error('Error /logout:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Server
const port = 3000;
app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
