const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const clients = new Map();

function createClient(id) {
  return new Promise((resolve, reject) => {
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

    client.on('qr', async (qr) => {
      try {
        const qrImage = await qrcode.toDataURL(qr);
        client.__qr = qrImage;
        resolve({ client, qr: qrImage });
      } catch (err) {
        reject(err);
      }
    });

    client.on('ready', () => {
      console.log(`Client ${id} is ready.`);
    });

    client.on('disconnected', () => {
      console.log(`Client ${id} disconnected.`);
    });

    client.initialize();
  });
}

async function initClient(clientId) {
  if (clients.has(clientId)) {
    return { status: 'already_initialized' };
  }

  const { client, qr } = await createClient(clientId);
  clients.set(clientId, client);
  return { qr, status: 'created' };
}

function getClient(clientIds) {
  if (Array.isArray(clientIds)) {
    const readyClients = clientIds
      .map(id => ({ id, client: clients.get(id) }))
      .filter(({ client }) => client && client.info); 

    if (readyClients.length === 0) return null;

    const randIndex = Math.floor(Math.random() * readyClients.length);
    return readyClients[randIndex].client;
  }

  const client = clients.get(clientIds);
  return client && client.info ? client : null;
}

function getClientStatus(clientId) {
  const client = clients.get(clientId);
  if (!client) return { status: 'not_initialized' };
  if (client.info) return { status: 'ready' };
  if (client.__qr) return { status: 'qr_pending', qr: client.__qr };
  return { status: 'initializing' };
}

async function logoutClient(clientId) {
  const client = clients.get(clientId);
  if (client) {
    await client.destroy();
    clients.delete(clientId);
  } 
  const sessionPath = path.join(__dirname, `.wwebjs_auth/session-client_${clientId}`);
  if (fs.existsSync(sessionPath)) {
    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log(`clientId ${clientId} deleted from session...`);
    return { success: true };
  } 

  return { success: false, message: 'Client not found.' };
}

async function restoreAllClients() {
  const authPath = path.join(__dirname, `.wwebjs_auth`);
  if (!fs.existsSync(authPath)) return;

  const clientDirs = fs.readdirSync(authPath).filter(name => name.startsWith('session-client_'));
  for (const dir of clientDirs) {
    const id = dir.replace('session-client_', '');
    try {
      console.log(`Restoring client ${id} from session...`);
      const { client } = await createClient(id);
      clients.set(id, client);
    } catch (err) {
      console.error(`Failed to restore client ${id}:`, err);
    }
  }
}

module.exports = {
  initClient,
  getClient,
  getClientStatus,
  logoutClient,
  restoreAllClients
};
