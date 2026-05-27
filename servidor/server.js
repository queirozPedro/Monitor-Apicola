const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const config = require('./config');
const SerialSource = require('./serial');
const SimulacaoSource = require('../modulo-teste/index');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../cliente')));

const server = app.listen(config.HTTP_PORT, () => {
  console.log(`Servidor rodando em http://localhost:${config.HTTP_PORT}`);
});

const wss = new WebSocketServer({ server });

let modoAtual = 'serial';
let fonte = null;
let esp32Conectado = false;

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ conectado: esp32Conectado, modo: modoAtual }));
});

function attachSource(source) {
  fonte = source;

  source.on('connected', () => {
    esp32Conectado = true;
    console.log(`[fonte] conectada (modo: ${modoAtual})`);
    broadcast({ conectado: true, modo: modoAtual });
  });

  source.on('disconnected', () => {
    esp32Conectado = false;
    console.log('[fonte] desconectada');
    broadcast({ conectado: false });
  });

  source.on('data', ({ caixa, peso, ruido }) => {
    broadcast({
      conectado: true,
      caixa,
      peso,
      ruido,
      latitude:  config.LATITUDE,
      longitude: config.LONGITUDE,
      timestamp: Date.now(),
    });
  });

  source.start();
}

function trocarModo(novoModo) {
  if (novoModo !== 'serial' && novoModo !== 'simulacao') {
    throw new Error('Modo inválido: ' + novoModo);
  }
  if (novoModo === modoAtual && fonte !== null) return;

  if (fonte) {
    fonte.removeAllListeners();
    fonte.stop();
    fonte = null;
  }

  esp32Conectado = false;
  modoAtual = novoModo;

  const Fonte = novoModo === 'serial' ? SerialSource : SimulacaoSource;
  attachSource(new Fonte());
  console.log(`[server] modo alterado para: ${novoModo}`);
}

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/status', (req, res) => {
  res.json({ modo: modoAtual, conectado: esp32Conectado });
});

app.post('/api/modo', (req, res) => {
  const { modo } = req.body;
  try {
    trocarModo(modo);
    res.json({ ok: true, modo: modoAtual });
  } catch (e) {
    res.status(400).json({ ok: false, erro: e.message });
  }
});

trocarModo('serial');
