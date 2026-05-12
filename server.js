const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { WebSocketServer } = require("ws");

const MODO_SIMULACAO = true;
const PORTA_SERIAL = "COM8";

const app = express();
app.use(express.static("public"));

const server = app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});

const wss = new WebSocketServer({ server });

let esp32Conectado = false;
let tentandoConectar = false;

function broadcast(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ conectado: esp32Conectado }));
});

function processarDados(a, b, c) {
  broadcast({
    conectado: true,
    caixa: a,
    peso: b,
    ruido: c,
    latitude: -3.7319,
    longitude: -38.5267,
    timestamp: Date.now()
  });
}

function iniciarSerial() {
  if (tentandoConectar) return;
  tentandoConectar = true;

  console.log("Buscando conexão com ESP32...");

  const port = new SerialPort({ path: PORTA_SERIAL, baudRate: 115200, autoOpen: false });

  port.open((err) => {
    if (err) {
      console.log("Falha ao abrir porta:", err.message);
      tentandoConectar = false;
      setTimeout(iniciarSerial, 3000);
      return;
    }

    console.log("ESP32 conectado!");
    esp32Conectado = true;

    const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

    parser.on("data", (data) => {
      const valores = data.trim().split(",");
      if (valores.length !== 3) return;

      const [a, b, c] = valores.map(Number);
      if ([a, b, c].some(isNaN)) return;

      processarDados(a, b, c);
    });

    port.on("close", () => {
      console.log("ESP32 desconectado.");
      esp32Conectado = false;
      tentandoConectar = false;
      broadcast({ conectado: false });
      setTimeout(iniciarSerial, 3000);
    });

    port.on("error", (err) => {
      console.log("Erro serial:", err.message);
    });
  });
}

function sensorSimulado() {
  const tocado = Math.random() < 0.05;
  return tocado
    ? 250 + Math.floor(Math.random() * 30)
    : 1200 + Math.floor(Math.random() * 50);
}

if (MODO_SIMULACAO) {
  esp32Conectado = true;
  console.log("Modo simulação ativo");
  setInterval(() => {
    processarDados(sensorSimulado(), sensorSimulado(), sensorSimulado());
  }, 2000);
} else {
  iniciarSerial();
}
