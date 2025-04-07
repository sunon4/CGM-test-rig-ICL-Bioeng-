// pin connections
const int dirPin = 2;
const int stepPin = 3;
const int ms1 = 7;
const int ms2 = 6;
const int ms3 = 5;

void setup() {
  pinMode(dirPin, OUTPUT);
  pinMode(stepPin, OUTPUT);
  pinMode(ms1, OUTPUT);
  pinMode(ms2, OUTPUT);
  pinMode(ms3, OUTPUT);
  // set direction of rotation to clockwise
  digitalWrite(dirPin, LOW);
  // set stepping mode to quarter step
  digitalWrite(ms1, LOW);
  digitalWrite(ms2, LOW);
  digitalWrite(ms3, LOW);
}

void loop() {
  // take one step
  digitalWrite(stepPin, HIGH);
  delayMicroseconds(2000);  // step pulse width
  // pause before taking next step
  digitalWrite(stepPin, LOW);
  delayMicroseconds(2000);  // step pulse width
}
