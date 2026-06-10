const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const config = require('../config');

let wsClient = null;
let port = null;
let stopped = false;
let id = null;

function conectarSerial() {
  if (stopped || !wsClient || wsClient.readyState !== WebSocket.OPEN) return;

  console.log(`[${id}] buscando conexão com ESP32...`);

  port = new SerialPort({ path: config.SERIAL_PORT, baudRate: config.BAUD_RATE, autoOpen: false });

  port.open((err) => {
    if (err) {
      console.log(`[${id}] falha ao abrir porta: ${err.message}`);
      if (!stopped) setTimeout(conectarSerial, config.RECONNECT_MS);
      return;
    }

    console.log(`[${id}] ESP32 conectado!`);

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (line) => {
      const parts = line.trim().split(',');
      if (parts.length !== 3) return;
      const [caixa, peso, ruido] = parts.map(Number);
      if ([caixa, peso, ruido].some(isNaN)) return;
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({ caixa, peso, ruido }));
      }
    });

    port.on('close', () => {
      console.log(`[${id}] ESP32 desconectado.`);
      port = null;
      if (!stopped) setTimeout(conectarSerial, config.RECONNECT_MS);
    });

    port.on('error', (err) => console.error(`[${id}] erro serial:`, err.message));
  });
}

function conectar() {
  if (stopped) return;

  wsClient = new WebSocket(config.WS_URL);

  wsClient.on('open', () => {
    console.log('[colmeia] conectado ao servidor, aguardando ID...');
    wsClient.send(JSON.stringify({ tipo: 'fonte', classe: 'colmeia' }));
  });

  wsClient.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.tipo === 'id-atribuido') {
      id = msg.id;
      console.log(`[colmeia] ID atribuído: ${id}`);
      conectarSerial();
    }
  });

  wsClient.on('close', () => {
    if (port && port.isOpen) port.close();
    port = null;
    console.log(`[${id ?? 'colmeia'}] desconectado do servidor, reconectando...`);
    if (!stopped) setTimeout(conectar, config.RECONNECT_MS);
  });

  wsClient.on('error', () => wsClient.close());
}

process.on('SIGINT', () => {
  stopped = true;
  if (port && port.isOpen) port.close();
  if (wsClient) wsClient.close();
  process.exit(0);
});

console.log('[colmeia] iniciada. Conectando ao servidor...');
conectar();
