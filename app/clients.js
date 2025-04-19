const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const clients = [];
const clientCount = 5; // Number of phone numbers

function createClient(id) {
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: `client_${id}` }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log(`Client ${id} QR:`);
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    console.log(`Client ${id} is ready`);
  });

  client.initialize();
  return client;
}

function initClients() {
  for (let i = 0; i < clientCount; i++) {
    clients.push(createClient(i));
  }
}

function getClient() {
  // Pick a random available client
  const activeClients = clients.filter(c => c.info); // info = connected
  if (activeClients.length === 0) {
    throw new Error('No active WhatsApp clients.');
  }
  const randomIndex = Math.floor(Math.random() * activeClients.length);
  return activeClients[randomIndex];
}

module.exports = { initClients, getClient };
