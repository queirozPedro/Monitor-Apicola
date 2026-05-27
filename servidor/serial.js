const EventEmitter = require('events');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const config = require('./config');

class SerialSource extends EventEmitter {
  constructor() {
    super();
    this._port = null;
    this._stopped = false;
  }

  start() {
    this._stopped = false;
    this._connect();
  }

  stop() {
    this._stopped = true;
    if (this._port && this._port.isOpen) {
      this._port.close();
    }
    this._port = null;
  }

  _connect() {
    if (this._stopped) return;

    console.log('Buscando conexão com ESP32...');

    const port = new SerialPort({
      path: config.SERIAL_PORT,
      baudRate: config.BAUD_RATE,
      autoOpen: false,
    });

    this._port = port;

    port.open((err) => {
      if (err) {
        console.log('Falha ao abrir porta:', err.message);
        if (!this._stopped) {
          setTimeout(() => this._connect(), config.RECONNECT_MS);
        }
        return;
      }

      console.log('ESP32 conectado!');
      this.emit('connected');

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

      parser.on('data', (line) => {
        const parts = line.trim().split(',');
        if (parts.length !== 3) return;
        const [caixa, peso, ruido] = parts.map(Number);
        if ([caixa, peso, ruido].some(isNaN)) return;
        this.emit('data', { caixa, peso, ruido });
      });

      port.on('close', () => {
        console.log('ESP32 desconectado.');
        this.emit('disconnected');
        if (!this._stopped) {
          setTimeout(() => this._connect(), config.RECONNECT_MS);
        }
      });

      port.on('error', (err) => {
        console.error('[serial] erro:', err.message);
      });
    });
  }
}

module.exports = SerialSource;
