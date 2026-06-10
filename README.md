# Monitor-Apicola

Sistema de monitoramento de colmeias em tempo real com ESP32, Node.js e WebSocket.

---

## 1. Instale as dependências

```bash
npm install
```

---

## 2. Inicie o servidor

```bash
npm start
```

Mantenha esse terminal aberto. O servidor ficará disponível em **http://localhost:3000**.

---

## 3. Conecte uma fonte de dados

Abra um **segundo terminal** e escolha uma das opções abaixo.

### Com ESP32 (hardware real)

Antes de rodar, abra `src/config.js` e ajuste `SERIAL_PORT` para a porta do seu ESP32:
- Windows: `COM3`, `COM4`, `COM8`...
- Linux/Mac: `/dev/ttyUSB0`, `/dev/ttyACM0`...

```bash
npm run colmeia
```

### Sem hardware (simulação)

```bash
npm run teste
```

Gera leituras simuladas a cada 2 segundos, sem precisar de ESP32.

---

## 4. Abra o cliente no navegador

```
http://localhost:3000
```

---

## Usando IDs personalizados

Cada fonte se identifica com um ID ao conectar. Os IDs padrão são `colmeia-1` e `teste-1`. Para usar um ID diferente:

```bash
npm run colmeia -- colmeia-2
npm run teste -- teste-2
```

---

## Painel de status

```
http://localhost:3000/admin
```
