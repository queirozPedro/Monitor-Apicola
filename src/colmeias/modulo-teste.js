const WebSocket = require('ws');
const config = require('../config');

let wsClient = null;
let timer = null;
let stopped = false;
let id = null;

function sensorSimulado() {
  const tocado = Math.random() < config.SIM_TRIGGER_PROB;
  return tocado
    ? config.SIM_TRIGGERED_MIN + Math.floor(Math.random() * config.SIM_TRIGGERED_RANGE)
    : config.SIM_CALM_MIN      + Math.floor(Math.random() * config.SIM_CALM_RANGE);
}

function iniciarSimulacao() {
  timer = setInterval(() => {
    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) return;
    wsClient.send(JSON.stringify({
      caixa: sensorSimulado(),
      peso:  sensorSimulado(),
      ruido: sensorSimulado(),
    }));
  }, config.SIM_INTERVAL_MS);
}

function conectar() {
  if (stopped) return;

  wsClient = new WebSocket(config.WS_URL);

  wsClient.on('open', () => {
    console.log('[modulo-teste] conectado ao servidor, aguardando ID...');
    wsClient.send(JSON.stringify({ tipo: 'fonte', classe: 'teste' }));
  });

  wsClient.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.tipo === 'id-atribuido') {
      id = msg.id;
      console.log(`[modulo-teste] ID atribuído: ${id}`);
      iniciarSimulacao();
      return;
    }
    if (msg.tipo === 'ping') {
      wsClient.send(JSON.stringify({ tipo: 'pong', t: msg.t }));
    }
  });

  wsClient.on('close', () => {
    clearInterval(timer);
    timer = null;
    console.log(`[${id ?? 'modulo-teste'}] desconectado do servidor, reconectando...`);
    if (!stopped) setTimeout(conectar, config.RECONNECT_MS);
  });

  wsClient.on('error', () => wsClient.close());
}

process.on('SIGINT', () => {
  stopped = true;
  clearInterval(timer);
  if (wsClient) wsClient.close();
  process.exit(0);
});

console.log('[modulo-teste] iniciado. Conectando ao servidor...');
conectar();
