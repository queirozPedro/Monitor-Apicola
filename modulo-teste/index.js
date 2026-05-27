const EventEmitter = require('events');
const config = require('../servidor/config');

class SimulacaoSource extends EventEmitter {
  constructor() {
    super();
    this._timer = null;
  }

  start() {
    if (this._timer) return;
    console.log('Modo simulação ativo');
    process.nextTick(() => this.emit('connected'));
    this._timer = setInterval(() => {
      this.emit('data', {
        caixa: this._sensorSimulado(),
        peso:  this._sensorSimulado(),
        ruido: this._sensorSimulado(),
      });
    }, config.SIM_INTERVAL_MS);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    process.nextTick(() => this.emit('disconnected'));
  }

  _sensorSimulado() {
    const tocado = Math.random() < config.SIM_TRIGGER_PROB;
    return tocado
      ? config.SIM_TRIGGERED_MIN + Math.floor(Math.random() * config.SIM_TRIGGERED_RANGE)
      : config.SIM_CALM_MIN      + Math.floor(Math.random() * config.SIM_CALM_RANGE);
  }
}

module.exports = SimulacaoSource;
