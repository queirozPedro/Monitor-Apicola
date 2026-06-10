const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');
const config = require('./config');

const app = express();
app.use(express.static(path.join(__dirname, 'cliente')));

const server = app.listen(config.HTTP_PORT, () => {
  console.log(`Servidor rodando em http://localhost:${config.HTTP_PORT}`);
});

const wss = new WebSocketServer({ server });

// fontes: id → { ws, latencia, jitter, latenciaAnterior, pingTimer }
const fontes     = new Map();
const historicos = new Map(); // id → leitura[]
const contadores = { colmeia: 0, teste: 0 };
const viewers    = new Set();

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  viewers.forEach((ws) => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

function iniciarPing(fonteId) {
  const estado = fontes.get(fonteId);
  estado.pingTimer = setInterval(() => {
    if (estado.ws.readyState === 1) {
      estado.ws.send(JSON.stringify({ tipo: 'ping', t: Date.now() }));
    }
  }, config.PING_INTERVAL_MS);
}

wss.on('connection', (ws) => {
  let fonteId = null;

  viewers.add(ws);
  ws.send(JSON.stringify({
    tipo: 'estado-inicial',
    colmeias: [...fontes.keys()].map((id) => {
      const e = fontes.get(id);
      return {
        id,
        conectada:    true,
        ultimaLeitura: historicos.get(id)?.at(-1) ?? null,
        latencia:     e.latencia,
        jitter:       e.jitter,
      };
    }),
  }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // Registro de fonte
    if (!fonteId && msg.tipo === 'fonte') {
      const classe = msg.classe === 'teste' ? 'teste' : 'colmeia';
      contadores[classe] += 1;
      fonteId = `${classe}-${contadores[classe]}`;

      viewers.delete(ws);
      fontes.set(fonteId, { ws, latencia: null, jitter: null, latenciaAnterior: null, pingTimer: null });
      historicos.set(fonteId, []);

      ws.send(JSON.stringify({ tipo: 'id-atribuido', id: fonteId }));
      broadcast({ tipo: 'colmeia-conectada', id: fonteId });
      console.log(`[server] fonte registrada: ${fonteId}`);

      iniciarPing(fonteId);
      return;
    }

    // Resposta de pong
    if (fonteId && msg.tipo === 'pong') {
      const rtt    = Date.now() - msg.t;
      const estado = fontes.get(fonteId);
      const nova   = rtt / 2;

      estado.jitter = estado.latenciaAnterior !== null
        ? Math.abs(nova - estado.latenciaAnterior)
        : 0;
      estado.latenciaAnterior = estado.latencia;
      estado.latencia         = nova;

      broadcast({ tipo: 'latencia', id: fonteId, latencia: nova, jitter: estado.jitter });
      return;
    }

    // Leitura de sensor
    if (fonteId && msg.caixa !== undefined) {
      const leitura = {
        id:        fonteId,
        caixa:     msg.caixa,
        peso:      msg.peso,
        ruido:     msg.ruido,
        latitude:  config.LATITUDE,
        longitude: config.LONGITUDE,
        timestamp: Date.now(),
      };

      const hist = historicos.get(fonteId);
      hist.push(leitura);
      if (hist.length > 100) hist.shift();

      broadcast({ tipo: 'leitura', ...leitura });
    }
  });

  ws.on('close', () => {
    if (fonteId) {
      const estado = fontes.get(fonteId);
      if (estado) clearInterval(estado.pingTimer);
      fontes.delete(fonteId);
      broadcast({ tipo: 'colmeia-desconectada', id: fonteId });
      console.log(`[server] fonte desconectada: ${fonteId}`);
    } else {
      viewers.delete(ws);
    }
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'cliente', 'admin.html'));
});

app.get('/api/colmeias', (req, res) => {
  const lista = [...fontes.keys()].map((id) => {
    const e = fontes.get(id);
    return {
      id,
      conectada:    true,
      ultimaLeitura: historicos.get(id)?.at(-1) ?? null,
      latencia:     e.latencia,
      jitter:       e.jitter,
    };
  });
  res.json(lista);
});

app.get('/api/colmeias/:id/historico', (req, res) => {
  const hist = historicos.get(req.params.id);
  if (!hist) return res.status(404).json({ erro: 'Colmeia não encontrada' });
  res.json(hist);
});

app.get('/api/status', (req, res) => {
  res.json({ conectado: fontes.size > 0, total: fontes.size });
});
