const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { WebSocketServer } = require("ws");

const app = express();

const port = new SerialPort({
  path: "COM8",
  baudRate: 115200
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

let estado = {
  caixa: 0,
  peso: 0,
  ruido: 0,
  // colmeia
  // localizacao
  status: "NORMAL"
};

parser.on("data", (data) => {
  const valores = data.trim().split(",");
  if (valores.length !== 3) return;

  const [a, b, c] = valores.map(Number);
  if ([a, b, c].some(isNaN)) return;

  estado.caixa = a; // Preto 13
  estado.peso = b; // Branco 15
  estado.ruido = c; // Verde 33

  console.log(a, b, c);

  const furto = (estado.caixa === 1 && estado.peso === 1) ||
    (estado.caixa === 1 && estado.ruido === 1);
  const estresse = (estado.ruido === 1 && estado.caixa === 0);

  if (furto) {
    estado.status = "🚨 POSSÍVEL FURTO";
  } else if (estresse) {
    estado.status = "⚠️ ESTRESSE NAS ABELHAS";
  } else {
    estado.status = "✅ NORMAL";
  }

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(estado));
    }
  });
});

app.use(express.static("public"));

const server = app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Cliente WebSocket conectado");
  ws.send(JSON.stringify(estado));
});