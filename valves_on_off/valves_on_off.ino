
const int VALVE1 = 4;  // First solenoid valve
const int VALVE2 = 5;  // Second solenoid valve

void setup() {
  pinMode(VALVE1, OUTPUT);
  pinMode(VALVE2, OUTPUT);
}

void loop() {
  digitalWrite(VALVE1, HIGH);  // Turn on valve 1
  digitalWrite(VALVE2, LOW);   // Turn off valve 2
  delay(1000);                 // Wait 1 second

  digitalWrite(VALVE1, LOW);   // Turn off valve 1
  digitalWrite(VALVE2, HIGH);  // Turn on valve 2
  delay(1000);                 // Wait 1 second
}

