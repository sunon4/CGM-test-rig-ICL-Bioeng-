#include <ArduinoJson.h>

// Pin definitions for Pump 1
#define PUMP1_STEP_PIN 2
#define PUMP1_DIR_PIN 3
#define PUMP1_ENABLE_PIN 4
#define PUMP1_MS1_PIN 5
#define PUMP1_MS2_PIN 6
#define PUMP1_MS3_PIN 7

// Pin definitions for Pump 2
#define PUMP2_STEP_PIN 8
#define PUMP2_DIR_PIN 9
#define PUMP2_ENABLE_PIN 10
#define PUMP2_MS1_PIN 11
#define PUMP2_MS2_PIN 12
#define PUMP2_MS3_PIN 13

// Microstepping modes
enum MicrostepMode {
  FULL_STEP = 0,
  HALF_STEP = 1,
  QUARTER_STEP = 2,
  EIGHTH_STEP = 3,
  SIXTEENTH_STEP = 4
};

// Pump state structure
struct PumpState {
  bool enabled;
  bool direction;  // true = clockwise, false = counterclockwise
  int rpm;
  MicrostepMode microstepMode;
  unsigned long lastStepTime;
  unsigned int stepInterval;  // microseconds between steps
};

PumpState pump1 = {false, true, 0, FULL_STEP, 0, 0};
PumpState pump2 = {false, true, 0, FULL_STEP, 0, 0};

// JSON document for serial communication
StaticJsonDocument<200> doc;

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  
  // Configure pump 1 pins
  pinMode(PUMP1_STEP_PIN, OUTPUT);
  pinMode(PUMP1_DIR_PIN, OUTPUT);
  pinMode(PUMP1_ENABLE_PIN, OUTPUT);
  pinMode(PUMP1_MS1_PIN, OUTPUT);
  pinMode(PUMP1_MS2_PIN, OUTPUT);
  pinMode(PUMP1_MS3_PIN, OUTPUT);
  
  // Configure pump 2 pins
  pinMode(PUMP2_STEP_PIN, OUTPUT);
  pinMode(PUMP2_DIR_PIN, OUTPUT);
  pinMode(PUMP2_ENABLE_PIN, OUTPUT);
  pinMode(PUMP2_MS1_PIN, OUTPUT);
  pinMode(PUMP2_MS2_PIN, OUTPUT);
  pinMode(PUMP2_MS3_PIN, OUTPUT);
  
  // Disable both pumps initially
  digitalWrite(PUMP1_ENABLE_PIN, HIGH);
  digitalWrite(PUMP2_ENABLE_PIN, HIGH);
}

void setMicrostepMode(int pump, MicrostepMode mode) {
  int ms1Pin = (pump == 1) ? PUMP1_MS1_PIN : PUMP2_MS1_PIN;
  int ms2Pin = (pump == 1) ? PUMP1_MS2_PIN : PUMP2_MS2_PIN;
  int ms3Pin = (pump == 1) ? PUMP1_MS3_PIN : PUMP2_MS3_PIN;
  
  switch (mode) {
    case FULL_STEP:
      digitalWrite(ms1Pin, LOW);
      digitalWrite(ms2Pin, LOW);
      digitalWrite(ms3Pin, LOW);
      break;
    case HALF_STEP:
      digitalWrite(ms1Pin, HIGH);
      digitalWrite(ms2Pin, LOW);
      digitalWrite(ms3Pin, LOW);
      break;
    case QUARTER_STEP:
      digitalWrite(ms1Pin, LOW);
      digitalWrite(ms2Pin, HIGH);
      digitalWrite(ms3Pin, LOW);
      break;
    case EIGHTH_STEP:
      digitalWrite(ms1Pin, HIGH);
      digitalWrite(ms2Pin, HIGH);
      digitalWrite(ms3Pin, LOW);
      break;
    case SIXTEENTH_STEP:
      digitalWrite(ms1Pin, HIGH);
      digitalWrite(ms2Pin, HIGH);
      digitalWrite(ms3Pin, HIGH);
      break;
  }
}

void updatePump(PumpState& pump, int stepPin, int dirPin, int enablePin) {
  digitalWrite(dirPin, pump.direction);
  digitalWrite(enablePin, !pump.enabled);
  
  if (pump.enabled && pump.rpm > 0) {
    unsigned long currentMicros = micros();
    if (currentMicros - pump.lastStepTime >= pump.stepInterval) {
      digitalWrite(stepPin, HIGH);
      delayMicroseconds(10);
      digitalWrite(stepPin, LOW);
      pump.lastStepTime = currentMicros;
    }
  }
}

void processCommand() {
  if (Serial.available()) {
    DeserializationError error = deserializeJson(doc, Serial);
    
    if (error) {
      Serial.println("{\"error\": \"Invalid JSON\"}");
      return;
    }
    
    int pumpId = doc["pump"];
    PumpState& pump = (pumpId == 1) ? pump1 : pump2;
    int stepPin = (pumpId == 1) ? PUMP1_STEP_PIN : PUMP2_STEP_PIN;
    int dirPin = (pumpId == 1) ? PUMP1_DIR_PIN : PUMP2_DIR_PIN;
    int enablePin = (pumpId == 1) ? PUMP1_ENABLE_PIN : PUMP2_ENABLE_PIN;
    
    if (doc.containsKey("enable")) {
      pump.enabled = doc["enable"];
    }
    
    if (doc.containsKey("direction")) {
      pump.direction = doc["direction"];
    }
    
    if (doc.containsKey("rpm")) {
      pump.rpm = doc["rpm"];
      // Calculate step interval based on RPM and microstep mode
      float stepsPerRevolution = 200.0 * (1 << pump.microstepMode);
      pump.stepInterval = (unsigned int)(60000000.0 / (pump.rpm * stepsPerRevolution));
    }
    
    if (doc.containsKey("microstep")) {
      pump.microstepMode = (MicrostepMode)doc["microstep"].as<int>();
      setMicrostepMode(pumpId, pump.microstepMode);
    }
    
    // Send acknowledgment
    Serial.print("{\"status\": \"ok\", \"pump\": ");
    Serial.print(pumpId);
    Serial.println("}");
  }
}

void loop() {
  processCommand();
  updatePump(pump1, PUMP1_STEP_PIN, PUMP1_DIR_PIN, PUMP1_ENABLE_PIN);
  updatePump(pump2, PUMP2_STEP_PIN, PUMP2_DIR_PIN, PUMP2_ENABLE_PIN);
} 