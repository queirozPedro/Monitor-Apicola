# Monitor-Apicola

Sistema de monitoramento de colmeias em tempo real utilizando **ESP32 + Node.js + WebSocket + Interface Web**.

---

## Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- ESP32 conectado via USB (ou use o modo simulação para testar sem hardware)


## Estrutura do projeto

```
Monitor-Apicola/
├── colmeia/        # Firmware do ESP32
├── cliente/        # Interface web (navegador)
├── modulo-teste/   # Simulador de sensores
└── servidor/       # Servidor Node.js
```

## Instalação e Execução

### 1. Clone o repositório

```bash
git clone https://github.com/queirozPedro/Monitor-Apicola
cd Monitor-Apicola
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure a porta serial

Abra o arquivo `servidor/config.js` e ajuste `SERIAL_PORT` para a porta onde o ESP32 está conectado:

```js
SERIAL_PORT: 'COM8', // Windows: COM3, COM4... | Linux/Mac: /dev/ttyUSB0
```

Para descobrir a porta correta:
- **Windows:** Gerenciador de Dispositivos → Portas (COM e LPT)
- **Linux/Mac:** `ls /dev/tty*` no terminal

### 4. Inicie o servidor

```bash
npm start
```

O terminal deve exibir:

```
Servidor rodando em http://localhost:3000
Buscando conexão com ESP32...
```

### 5. Acesse a interface

Abra o navegador em **http://localhost:3000**

## Testando sem ESP32 (modo simulação)

Não é necessário alterar nenhum arquivo. Com o servidor rodando, acesse o painel admin:

**http://localhost:3000/admin**

Clique em **Simulação** para ativar leituras automáticas a cada 2 segundos. Para voltar ao hardware real, clique em **Serial (ESP32)**. A troca é feita em tempo real, sem reiniciar o servidor.

## Formato esperado do ESP32

O ESP32 deve enviar os dados pela serial no seguinte formato, uma linha por leitura:

```
<caixa>,<peso>,<ruido>
```

Exemplo:

```
1250,1180,1300
```

Valores abaixo de `500` indicam que o sensor foi acionado (toque/movimento detectado).
