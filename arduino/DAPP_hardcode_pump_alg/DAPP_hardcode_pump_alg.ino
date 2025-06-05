#define MAX_ENTRIES 13  // Changed to 13 to match backend
#define v1stepPin 3
#define v2stepPin 10
#define v1dirPin 2
#define v2dirPin 9
#define v5v 13

// Arrays to store received data
int timestamps[MAX_ENTRIES];
float concentrations[MAX_ENTRIES];
int currentIndex = 0;

// Buffer for receiving Serial data
const int BUFFER_SIZE = 256;
char inputBuffer[BUFFER_SIZE];
int bufferIndex = 0;

float compositeFlowRate_mLmin = 10;
float currentGlucoseFlowRate_mLmin = 0.0;
float currentPBSFlowRate_mLmin = 0.0;
float channelInternalDiameter_mm = 1.5;
float preIntersectionChannelLength_mm = 650.0;
float C1_mmolL = 20;
float C2_mmolL = 10;
int delayC1_ms = 0;
int delayC2_ms = 0;

// Debug counter for steps
unsigned long steps1Count = 0;
unsigned long steps2Count = 0;

void setup() {
  // put your setup code here, to run once:
  pinMode(v1stepPin, OUTPUT);
  pinMode(v2stepPin, OUTPUT);
  pinMode(v1dirPin, OUTPUT);
  pinMode(v2dirPin, OUTPUT);
  digitalWrite(v1dirPin, LOW);
  digitalWrite(v2dirPin, HIGH);
  digitalWrite(v5v, HIGH);
  
  Serial.begin(9600);
  while (!Serial);
  
  Serial.println(F("Waiting for data from backend..."));
}

void loop() {
  if (readSerialData()) {
    // Print received data for verification
    Serial.println(F("Received data:"));
    for (int i = 0; i < MAX_ENTRIES; i++) {
      Serial.print(F("Time: "));
      Serial.print(timestamps[i]);
      Serial.print(F(" Concentration: "));
      Serial.println(concentrations[i], 2);
    }
    
    // Run the pump schedule with received data
    runPumpSchedule();
    
    // Clear buffer and wait for new data
    bufferIndex = 0;
    Serial.println(F("Ready for next data set..."));
  }
  
  delay(100); // Small delay to prevent busy-waiting
}

bool readSerialData() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    
    if (c == '\n') {
      // End of transmission, parse the data
      inputBuffer[bufferIndex] = '\0';
      return parseReceivedData();
    } else if (bufferIndex < BUFFER_SIZE - 1) {
      inputBuffer[bufferIndex++] = c;
    }
  }
  return false;
}

bool parseReceivedData() {
  char* token = strtok(inputBuffer, ",");
  currentIndex = 0;
  
  while (token != NULL && currentIndex < MAX_ENTRIES) {
    // Split time and concentration (format: "time:concentration")
    char* separator = strchr(token, ':');
    if (separator != NULL) {
      *separator = '\0';  // Split the string
      timestamps[currentIndex] = atoi(token);  // Convert time to integer
      concentrations[currentIndex] = atof(separator + 1);  // Convert concentration to float
      currentIndex++;
    }
    token = strtok(NULL, ",");
  }
  
  // Verify we got all expected data points
  if (currentIndex != MAX_ENTRIES) {
    Serial.print(F("Error: Expected "));
    Serial.print(MAX_ENTRIES);
    Serial.print(F(" data points, but received "));
    Serial.println(currentIndex);
    return false;
  }
  
  return true;
}

// ---------- Calculate Velocity from Flow Rate ----------
float convertFlowRateToVelocity(float totalFlowRate_mLmin, float innerDiameter_mm) {
  float Q_total = totalFlowRate_mLmin / (1e6 * 60.0);  // m³/s
  float diameter_m = innerDiameter_mm / 1000.0;
  float radius = diameter_m / 2.0;
  float area = 3.14159 * radius * radius;
  float velocity_m_per_sec = Q_total / area;
  return velocity_m_per_sec * 1000.0;  // mm/s
}

// ---------- Calculate Pump Flow Rates ----------
void calculatePumpFlowRates_mLmin(float compositeFlowRate_mLmin, float desiredConc, float high_C1, float low_C2) {
  Serial.print(F("DEBUG: Calc - Target:"));
  Serial.println(desiredConc);
  
  float Q_total = compositeFlowRate_mLmin / (1e6 * 60.0);  // m³/s
  float deltaC = high_C1 - low_C2;
  float Q1 = (deltaC != 0) ? Q_total * (desiredConc - low_C2) / deltaC : 0;
  float Q2 = Q_total - Q1;

  currentGlucoseFlowRate_mLmin = Q1 * 1e6 * 60.0;
  currentPBSFlowRate_mLmin = Q2 * 1e6 * 60.0;
  
  Serial.print(F("DEBUG: GFlow="));
  Serial.print(currentGlucoseFlowRate_mLmin);
  Serial.print(F(" PFlow="));
  Serial.println(currentPBSFlowRate_mLmin);
}

// ---------- Calculate Synchronization Delays ----------
void getPumpDelays_ms(float flowRate1_mLmin, float flowRate2_mLmin, float innerDiameter_mm, float channelLength_mm) {
  // Convert flow rates from mL/min to m^3/s
  float Q1 = flowRate1_mLmin / (1e6 * 60.0);
  float Q2 = flowRate2_mLmin / (1e6 * 60.0);

  // Convert inner diameter from mm to meters and calculate area
  float diameter_m = innerDiameter_mm / 1000.0;
  float radius = diameter_m / 2.0;
  float area = 3.14159 * radius * radius;

  // Calculate velocities in m/s based on available flow
  float v1 = (Q1 > 0) ? Q1 / area : 0;
  float v2 = (Q2 > 0) ? Q2 / area : 0;

  // Calculate times (in seconds) needed for the fluid to traverse the channel length
  float t1 = (v1 > 0) ? (channelLength_mm / 1000.0) / v1 : -1;
  float t2 = (v2 > 0) ? (channelLength_mm / 1000.0) / v2 : -1;

  // Print all the computed values to the Serial monitor
  Serial.println("---- Pump Delay Calculation ----");

  Serial.print("Flow Rate 1 (mL/min): ");
  Serial.println(flowRate1_mLmin);
  Serial.print("Flow Rate 2 (mL/min): ");
  Serial.println(flowRate2_mLmin);

  Serial.print("Inner Diameter (mm): ");
  Serial.println(innerDiameter_mm);
  Serial.print("Channel Length (mm): ");
  Serial.println(channelLength_mm);

  Serial.print("Q1 (m^3/s): ");
  Serial.println(Q1, 6);  // prints Q1 with 6 decimal places
  Serial.print("Q2 (m^3/s): ");
  Serial.println(Q2, 6);

  Serial.print("Diameter (m): ");
  Serial.println(diameter_m, 6);
  Serial.print("Radius (m): ");
  Serial.println(radius, 6);
  Serial.print("Area (m^2): ");
  Serial.println(area, 6);

  Serial.print("v1 (m/s): ");
  Serial.println(v1, 6);
  Serial.print("v2 (m/s): ");
  Serial.println(v2, 6);

  Serial.print("t1 (s): ");
  Serial.println(t1, 6);
  Serial.print("t2 (s): ");
  Serial.println(t2, 6);



  delayC1_ms = 0;
  delayC2_ms = 0;

  if (t1 < 0 || t2 < 0) {
    Serial.println(F("DEBUG: Negative travel time!"));
    return;
  }

  if (t1 > t2) {
    delayC2_ms = (int)((t1 - t2) * 1000);
    Serial.print(F("DEBUG: Delay PBS="));
    Serial.println(delayC2_ms);
  } else if (t2 > t1) {
    delayC1_ms = (int)((t2 - t1) * 1000);
    Serial.print(F("DEBUG: Delay Gluc="));
    Serial.println(delayC1_ms);
  }
}

void runTwoPumps(int pump1_rpm, int pump2_rpm, int delay1_ms, int delay2_ms, int runTime1_ms, int runTime2_ms) {
  Serial.print(F("DEBUG: RPM1="));
  Serial.print(pump1_rpm);
  Serial.print(F(" RPM2="));
  Serial.println(pump2_rpm);
  
  const int stepsPerRevolution = 200;
  unsigned long interval1_us = 60000000UL / (pump1_rpm * stepsPerRevolution);
  unsigned long interval2_us = 60000000UL / (pump2_rpm * stepsPerRevolution);
  
  unsigned long startTime = millis();
  unsigned long delayEnd1 = startTime + delay1_ms;
  unsigned long delayEnd2 = startTime + delay2_ms;
  unsigned long stopTime1 = delayEnd1 + runTime1_ms;
  unsigned long stopTime2 = delayEnd2 + runTime2_ms;
  
  Serial.print(F("DEBUG: StartTime="));
  Serial.println(startTime);

  unsigned long lastStepTime1 = micros();
  unsigned long lastStepTime2 = micros();
  
  // Reset step counters
  steps1Count = 0;
  steps2Count = 0;
  unsigned long lastDebugPrint = millis();
  
  Serial.println(F("DEBUG: Pumps starting..."));

  while (millis() < max(stopTime1, stopTime2)) {
    unsigned long now = micros();
    unsigned long now_ms = millis();

    // Pump 1 stepping logic
    if (now_ms >= delayEnd1 && now_ms < stopTime1 && (now - lastStepTime1 >= interval1_us)) {
      digitalWrite(v1stepPin, HIGH);
      delayMicroseconds(10);
      digitalWrite(v1stepPin, LOW);
      lastStepTime1 = now;
      steps1Count++;
    }

    // Pump 2 stepping logic
    if (now_ms >= delayEnd2 && now_ms < stopTime2 && (now - lastStepTime2 >= interval2_us)) {
      digitalWrite(v2stepPin, HIGH);
      delayMicroseconds(10);
      digitalWrite(v2stepPin, LOW);
      lastStepTime2 = now;
      steps2Count++;
    }

    // Less frequent debug output (10 seconds)
    if (now_ms - lastDebugPrint >= 10000) {
      Serial.print(F("DEBUG: Runtime="));
      Serial.print((now_ms - startTime) / 1000);
      Serial.print(F("s Steps1="));
      Serial.print(steps1Count);
      Serial.print(F(" Steps2="));
      Serial.println(steps2Count);
      lastDebugPrint = now_ms;
    }

    // Optional sleep to reduce CPU usage
    delayMicroseconds(50);
  }
  
  Serial.print(F("DEBUG: Pumps end. Steps1="));
  Serial.print(steps1Count);
  Serial.print(F(" Steps2="));
  Serial.println(steps2Count);
}

// ---------- Main Control Loop ----------
void runPumpSchedule() {
  Serial.print(F("DEBUG: Steps="));
  Serial.println(currentIndex-1);
  
  for (int i = 0; i < (currentIndex-1); i++) {
    Serial.print(F("Step "));
    Serial.print(i+1);
    Serial.print(F("/"));
    Serial.println(currentIndex-1);
    
    float targetConc = concentrations[i];
    Serial.print(F("Target="));
    Serial.println(targetConc);

    calculatePumpFlowRates_mLmin(compositeFlowRate_mLmin, targetConc, C1_mmolL, C2_mmolL);
    Serial.print("Q1 and Q2");
    Serial.print(currentGlucoseFlowRate_mLmin);
    Serial.print(currentPBSFlowRate_mLmin);

    getPumpDelays_ms(currentGlucoseFlowRate_mLmin, currentPBSFlowRate_mLmin,
                     channelInternalDiameter_mm, preIntersectionChannelLength_mm);
                     
    int pump1_rpm = (int)((currentGlucoseFlowRate_mLmin+0.2537)*2/0.1185);
    int pump2_rpm = (int)((currentPBSFlowRate_mLmin+0.2537)*2/0.1185);
    int time_run_pump1 = (timestamps[i+1] - timestamps[i])*1000;
    int time_run_pump2 = (timestamps[i+1] - timestamps[i])*1000;
    
    runTwoPumps(pump1_rpm, pump2_rpm, delayC1_ms, delayC2_ms, time_run_pump1, time_run_pump2);

    // Print status summary for each step with minimal formatting
    Serial.print(F("Min"));
    Serial.print(i);
    Serial.print(F("|Tgt:"));
    Serial.print(targetConc);
    Serial.print(F("|GF:"));
    Serial.print(currentGlucoseFlowRate_mLmin);
    Serial.print(F("|PF:"));
    Serial.print(currentPBSFlowRate_mLmin);
    Serial.print(F("|D1:"));
    Serial.print(delayC1_ms);
    Serial.print(F("|D2:"));
    Serial.println(delayC2_ms);

    // Add small delay to let serial buffer clear
    delay(100);
    Serial.flush();
  }
  
  Serial.println(F("DEBUG: Schedule complete"));
  delay(100);
  Serial.flush(); // Ensure all data is sent
}