// pin connections 
const int valve1 = 2; // direction pin 
const int valve2 = 3; // step pin 

void setup() { 
  pinMode(valve1, OUTPUT); 
  pinMode(valve2, OUTPUT); 
} 

void loop() {
  // Turn valve1 HIGH, valve2 LOW
  digitalWrite(valve1, HIGH);
  digitalWrite(valve2, LOW);
  delay(5000); // wait for 5 seconds

  // Turn valve1 LOW, valve2 HIGH
  digitalWrite(valve1, LOW);
  digitalWrite(valve2, HIGH);
  delay(5000); // wait for 5 seconds
}
