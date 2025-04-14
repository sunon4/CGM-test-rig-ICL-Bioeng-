#define MAX_ENTRIES 61
#define v1stepPin 2
#define v2stepPin 3
#define v1dirPin 4
#define v2dirPin 5
#include <AccelStepper.h>
#define motorInterfaceType 1  // For step + dir driver interface

AccelStepper stepper1(motorInterfaceType, v1stepPin, v1dirPin);  // Glucose pump
AccelStepper stepper2(motorInterfaceType, v2stepPin, v2dirPin);  // PBS pump


// -------- Hardcoded Simulated Glucose Profile --------
int timestamps[MAX_ENTRIES] = {
  0, 180, 360, 540, 720, 900, 1080, 1260, 1440, 1620, 1800, 1980, 
  2160, 2340, 2520, 2700, 2880, 3060, 3240, 3420, 3600, 3780, 3960, 
  4140, 4320, 4500, 4680, 4860, 5040, 5220, 5400, 5580, 5760, 5940, 
  6120, 6300, 6480, 6660, 6840, 7020
};

float concentrations[MAX_ENTRIES] = {
  158.0175575, 157.6244862, 156.6139257, 156.043794, 155.7174973, 
  155.438442, 155.0100343, 154.2356805, 152.9187868, 150.8627597, 
  147.9100874, 144.1377511, 139.9744704, 135.9271296, 132.5026127, 
  130.1580266, 129.0518159, 128.8944312, 129.2967692, 129.8697263, 
  130.2550412, 130.2795051, 130.0474881, 129.7250447, 129.478229, 
  129.4550522, 129.6952669, 130.0762372, 130.4392412, 130.625557, 
  130.4952797, 130.0214746, 129.351107, 128.6958405, 128.3230739, 
  128.5274378, 129.494667, 131.1984377, 133.5177998, 136.2902996
  };


int currentIndex = MAX_ENTRIES;

float compositeFlowRate_mLmin = 2.0;
float currentGlucoseFlowRate_mLmin = 0.0;
float currentPBSFlowRate_mLmin = 0.0;
float channelInternalDiameter_mm = 1.5;
float preIntersectionChannelLength_mm = 10.0;
float C1_mmolL = 20;
float C2_mmolL = 10;
int delayC1_ms = 0;
int delayC2_ms = 0;


void setup() {
  // put your setup code here, to run once:
  pinMode(v1stepPin, OUTPUT);
  pinMode(v2stepPin, OUTPUT);
  pinMode(v1dirPin, OUTPUT);
  pinMode(v2dirPin, OUTPUT);
  stepper1.setAcceleration(1000);  // Optional: smooth start
  stepper2.setAcceleration(1000);
  digitalWrite(v1dirPin, HIGH);
  digitalWrite(v2dirPin, HIGH);
  Serial.begin(9600);
  while (!Serial);
  Serial.println("Running built-in glucose profile...");
  runPumpSchedule();

}

void loop() {
  // put your main code here, to run repeatedly:
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
  float Q_total = compositeFlowRate_mLmin / (1e6 * 60.0);  // m³/s
  float deltaC = high_C1 - low_C2;
  float Q1 = (deltaC != 0) ? Q_total * (desiredConc - low_C2) / deltaC : 0;
  float Q2 = Q_total - Q1;

  currentGlucoseFlowRate_mLmin = Q1 * 1e6 * 60.0;
  currentPBSFlowRate_mLmin = Q2 * 1e6 * 60.0;
}

// ---------- Calculate Synchronization Delays ----------
void getPumpDelays_ms(float flowRate1_mLmin, float flowRate2_mLmin, float innerDiameter_mm, float channelLength_mm) {
  float Q1 = flowRate1_mLmin / (1e6 * 60.0);
  float Q2 = flowRate2_mLmin / (1e6 * 60.0);

  float diameter_m = innerDiameter_mm / 1000.0;
  float radius = diameter_m / 2.0;
  float area = 3.14159 * radius * radius;

  float v1 = (Q1 > 0) ? Q1 / area : 0;
  float v2 = (Q2 > 0) ? Q2 / area : 0;

  float t1 = (v1 > 0) ? (channelLength_mm / 1000.0) / v1 : -1;
  float t2 = (v2 > 0) ? (channelLength_mm / 1000.0) / v2 : -1;

  delayC1_ms = 0;
  delayC2_ms = 0;

  if (t1 < 0 || t2 < 0) return;

  if (t1 > t2) {
    delayC2_ms = (int)((t1 - t2) * 1000);
  } else if (t2 > t1) {
    delayC1_ms = (int)((t2 - t1) * 1000);
    
  }
}


void runTwoPumps(int rpm1, int rpm2, int delay1_ms, int delay2_ms, int runtime1_ms, int runtime2_ms) {
  const int stepsPerRev = 200;

  float speed1_sps = (rpm1 / 60.0) * stepsPerRev;  // steps per sec
  float speed2_sps = (rpm2 / 60.0) * stepsPerRev;

  stepper1.setMaxSpeed(speed1_sps);
  stepper2.setMaxSpeed(speed2_sps);
  stepper1.setSpeed(speed1_sps);
  stepper2.setSpeed(speed2_sps);

  unsigned long startTime = millis();
  bool stepper1Active = false;
  bool stepper2Active = false;

  while (true) {
    unsigned long now = millis();
    unsigned long elapsed = now - startTime;

    if (!stepper1Active && elapsed >= delay1_ms) {
      stepper1Active = true;
    }

    if (!stepper2Active && elapsed >= delay2_ms) {
      stepper2Active = true;
    }

    if (stepper1Active && elapsed < delay1_ms + runtime1_ms) {
      stepper1.runSpeed();
    }

    if (stepper2Active && elapsed < delay2_ms + runtime2_ms) {
      stepper2.runSpeed();
    }

    if (elapsed >= max(delay1_ms + runtime1_ms, delay2_ms + runtime2_ms)) {
      break;
    }
  }

  // Stop after complete
  stepper1.setSpeed(0);
  stepper2.setSpeed(0);
}



// ---------- Main Control Loop ----------
void runPumpSchedule() {
  for (int i = 0; i < (currentIndex-1); i++) {
    float targetConc = (concentrations[i]/18.01559);

    calculatePumpFlowRates_mLmin(compositeFlowRate_mLmin, targetConc, C1_mmolL, C2_mmolL);
    getPumpDelays_ms(currentGlucoseFlowRate_mLmin, currentPBSFlowRate_mLmin,
                     channelInternalDiameter_mm, preIntersectionChannelLength_mm);
    int pump1_rpm = (int)((currentGlucoseFlowRate_mLmin+0.2537)/0.1185);
    int pump2_rpm = (int)((currentPBSFlowRate_mLmin+0.2537)/0.1185);
    int time_run_pump1 = (timestamps[i+1] - timestamps[i])*1000;
    int time_run_pump2 = (timestamps[i+1] - timestamps[i])*1000;
   
    Serial.print("Minute ");
    Serial.print(i);
    Serial.print(" | Target Conc: ");
    Serial.print(targetConc, 5);
    Serial.print(" M | G Flow: ");
    Serial.print(currentGlucoseFlowRate_mLmin, 3);
    Serial.print(" mL/min | PBS Flow: ");
    Serial.print(currentPBSFlowRate_mLmin, 3);
    Serial.print(" mL/min | Delay G: ");
    Serial.print(delayC1_ms);
    Serial.print(" ms | Delay P: ");
    Serial.print(delayC2_ms);
    Serial.println(" ms");

    runTwoPumps(pump1_rpm, pump2_rpm, delayC1_ms, delayC2_ms, time_run_pump1, time_run_pump2);
  }
}

