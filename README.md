# 🐝 Monitor-Apicola

Sistema de monitoramento de colmeias em tempo real utilizando **ESP32 + Node.js + WebSocket + Interface Web**.

---

## 📦 Instalação e Execução

### 1. Clone o projeto

```bash
git clone [https://github.com/queirozPedro/Monitor-Apicola](https://github.com/queirozPedro/Monitor-Apicola)
cd Monitor-Apicola
```

### 2. Instale as dependências

Você pode instalar todas as dependências do projeto com o comando padrão:

```bash
npm install
```

*(Opcional)* Se preferir instalar os pacotes manualmente, utilize:

```bash
npm install express serialport @serialport/parser-readline ws
```

### 3. Execute o servidor e o cliente

Inicie o servidor Node.js executando:

```bash
npm start
```

Inicie o cliente index.html executando:

```bash
start public/index.html
```