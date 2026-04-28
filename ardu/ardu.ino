#define T_CAIXA 13
#define T_PESO 15
#define T_RUIDO 33

const int LIMIAR = 500;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int caixa = touchRead(T_CAIXA) < LIMIAR ? 1 : 0;
  int peso  = touchRead(T_PESO)  < LIMIAR ? 1 : 0;
  int ruido = touchRead(T_RUIDO) < LIMIAR ? 1 : 0;

  Serial.printf("%d,%d,%d\n", caixa, peso, ruido);

  delay(1000);
}