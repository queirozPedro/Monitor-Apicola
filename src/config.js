module.exports = Object.freeze({
  HTTP_PORT:   process.env.PORT || 3000,
  WS_URL:      process.env.WS_URL || 'ws://localhost:3000',
  SERIAL_PORT: 'COM8',
  BAUD_RATE:   115200,
  RECONNECT_MS:    3000,
  SIM_INTERVAL_MS: 2000,
  LATITUDE:  -3.7319,
  LONGITUDE: -38.5267,
  SIM_TRIGGER_PROB:    0.05,
  SIM_TRIGGERED_MIN:   250,
  SIM_TRIGGERED_RANGE:  30,
  SIM_CALM_MIN:        1200,
  SIM_CALM_RANGE:        50,
  PING_INTERVAL_MS:    5000,
  SENSOR_RAW_MAX:      1200, // valor de fundo do touch (sem toque)
  SENSOR_NORM_MAX:       20, // teto da escala normalizada (peso/ruido)
  // Normaliza a leitura crua do sensor touch (~0-1200) para a faixa 0-20.
  normalizarSensor: (raw) =>
    +Math.min(20, Math.max(0, (raw / 1200) * 20)).toFixed(1),
});
