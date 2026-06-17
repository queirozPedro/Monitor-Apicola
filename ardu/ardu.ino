#define TRIG    5
#define ECHO    18
#define T_PESO  13
#define T_RUIDO 33

unsigned long ultimoEnvio = 0;
const unsigned long INTERVALO = 2000;

float lerDistancia() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  long dur = pulseIn(ECHO, HIGH, 30000);
  return dur == 0 ? 0.0 : dur * 0.034 / 2.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "PING") Serial.println("PONG");
  }

  if (millis() - ultimoEnvio >= INTERVALO) {
    ultimoEnvio = millis();
    Serial.printf("%.1f,%d,%d\n",
      lerDistancia(),
      touchRead(T_PESO),
      touchRead(T_RUIDO)
    );
  }
}
