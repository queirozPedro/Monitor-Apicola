#define T_CAIXA 13
#define T_PESO 15
#define T_RUIDO 33

void setup() {
  Serial.begin(115200);
}

void loop() {

  Serial.printf("%d,%d,%d\n",
    touchRead(T_CAIXA),
    touchRead(T_PESO),
    touchRead(T_RUIDO)
  );

  delay(2000);
}