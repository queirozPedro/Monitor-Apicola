const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { WebSocketServer } = require("ws");

const app = express();

let estado = {
  caixa: 0,
  peso: 0,
  ruido: 0
};

app.use(express.static("public"));

const server = app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Cliente WebSocket conectado");
  ws.send(JSON.stringify(estado));
});

// SERIAL (DESATIVADO SE SIMULAÇÃO ATIVA)

let port = null;
let parser = null;

const MODO_SIMULACAO = false;

if (!MODO_SIMULACAO) {
  port = new SerialPort({
    path: "COM8",
    baudRate: 115200
  });

  parser = port.pipe(
    new ReadlineParser({ delimiter: "\n" })
  );

  parser.on("data", (data) => {
    const valores = data.trim().split(",");
    if (valores.length !== 3) return;

    const [a, b, c] = valores.map(Number);
    if ([a, b, c].some(isNaN)) return;

    processarDados(a, b, c);
  });
}

// ENVIO BRUTO (SEM LÓGICA)

function processarDados(a, b, c) {
  estado.caixa = a;
  estado.peso = b;
  estado.ruido = c;

  const payload = {
    caixa: a,
    peso: b,
    ruido: c,
    timestamp: Date.now()
  };

  console.log(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(payload));
    }
  });
}

// SIMULAÇÃO

function sensorSimulado() {
  const tocado = Math.random() < 0.25;

  return tocado
    ? 250 + Math.floor(Math.random() * 30)
    : 1200 + Math.floor(Math.random() * 50);
}

function gerarLeituraSimulada() {
  const a = sensorSimulado();
  const b = sensorSimulado();
  const c = sensorSimulado();

  processarDados(a, b, c);
}

if (MODO_SIMULACAO) {
  setInterval(gerarLeituraSimulada, 2000);
}