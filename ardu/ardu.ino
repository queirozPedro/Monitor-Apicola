#define T_CAIXA 13
#define T_PESO  15
#define T_RUIDO 33

unsigned long ultimoEnvio = 0;
const unsigned long INTERVALO = 2000;

void setup() {
  Serial.begin(115200);
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "PING") Serial.println("PONG");
  }

  if (millis() - ultimoEnvio >= INTERVALO) {
    ultimoEnvio = millis();
    Serial.printf("%d,%d,%d\n",
      touchRead(T_CAIXA),
      touchRead(T_PESO),
      touchRead(T_RUIDO)
    );
  }
}
