from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Tuple
import serial
import json
from fastapi.responses import Response
import serial.tools.list_ports
import time  # Add this import

app = FastAPI()

# Enable CORS for all origins (since frontend runs on different device)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTML template for simulation interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Arduino Simulation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        #output { white-space: pre-wrap; }
        .data-section { margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Arduino Simulation Interface</h1>
    
    <div class="data-section">
        <h2>Input Data</h2>
        <div id="input-data">No data received yet</div>
    </div>
    
    <div class="data-section">
        <h2>Simulation Results</h2>
        <div id="output">No simulation results yet</div>
    </div>

    <script>
        // Function to run simulation with data
        async function runSimulation(data) {
            try {
                const response = await fetch('/simulate-arduino', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ data: data })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                document.getElementById('input-data').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                document.getElementById('output').innerHTML = '<pre>' + result.simulation.join('\\n') + '</pre>';
            } catch (error) {
                document.getElementById('output').textContent = 'Error: ' + error.message;
            }
        }

        // Listen for messages from the parent window
        window.addEventListener('message', function(event) {
            if (event.data && Array.isArray(event.data)) {
                runSimulation(event.data);
            }
        });

        // Function to parse URL parameters
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        // Check if data was passed in URL
        const urlData = getQueryParam('data');
        if (urlData) {
            try {
                const data = JSON.parse(decodeURIComponent(urlData));
                runSimulation(data);
            } catch (error) {
                console.error('Error parsing URL data:', error);
            }
        }
    </script>
</body>
</html>
"""

@app.get("/simulate", response_class=HTMLResponse)
async def simulation_interface():
    """Provide a web interface for the simulation"""
    return HTML_TEMPLATE

@app.get("/")
def root():
    return {"message": "Server is running"}


@app.get("/favicon.ico")
def favicon():
    return Response(status_code=204)  # 204 No Content


@app.get("/list-ports")
def list_ports():
    """List all available serial ports"""
    ports = [{"port": port.device, "description": port.description}
             for port in serial.tools.list_ports.comports()]
    return {"available_ports": ports}


# Serial configuration
SERIAL_PORT = 'COM7'  # Change this if needed for Windows (e.g., 'COM3')
BAUD_RATE = 9600
MONITOR_DURATION = 10  # How many seconds to monitor Arduino's response

class DataPayload(BaseModel):
    data: List[List[float]]  # Expected format: [[time, concentration], ...]

def format_data_for_arduino(data: List[List[float]]) -> str:
    """
    Convert the 13x2 array into Arduino-compatible string format
    Format: "time1:conc1,time2:conc2,...\n"
    """
    formatted_pairs = [f"{int(time)}:{concentration:.1f}" for time, concentration in data]
    return ','.join(formatted_pairs) + '\n'

def send_to_arduino(formatted_data: str) -> None:
    """Send data to Arduino and monitor its response"""
    try:
        # List available ports
        available_ports = [port.device for port in serial.tools.list_ports.comports()]
        print("\n=== Serial Communication Start ===")
        print(f"Available ports: {available_ports}")
        print(f"Using port: {SERIAL_PORT} at {BAUD_RATE} baud")
        print(f"\nSending data: {formatted_data.strip()}")
        
        with serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1) as ser:
            # Wait for Arduino to initialize
            print("\nWaiting for Arduino to initialize...")
            time.sleep(2)
            
            # Clear any existing data
            ser.reset_input_buffer()
            ser.reset_output_buffer()
            
            # Send the data
            print("Sending data to Arduino...")
            ser.write(formatted_data.encode())
            
            # Monitor Arduino's response
            print("\n=== Arduino Response Monitor ===")
            print(f"Monitoring for {MONITOR_DURATION} seconds...")
            
            monitor_start = time.time()
            while time.time() - monitor_start < MONITOR_DURATION:
                if ser.in_waiting:
                    try:
                        response = ser.readline().decode().strip()
                        if response:  # Only print non-empty responses
                            print(f"Arduino >> {response}")
                    except UnicodeDecodeError:
                        print("Warning: Received non-text data from Arduino")
                time.sleep(0.1)
            
            print("\n=== Serial Communication End ===")
            
    except serial.SerialException as e:
        error_msg = f"Serial error: {str(e)}"
        print(f"\nERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(f"\nERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/send-data")
async def send_data(payload: DataPayload):
    """
    Receive data from frontend, format it, and send to Arduino
    """
    try:
        # Validate data length
        if len(payload.data) != 13:
            raise HTTPException(
                status_code=400,
                detail="Data must contain exactly 13 time points"
            )

        print("\n=== New Data Transmission ===")
        print(f"Received data points: {len(payload.data)}")
        
        # Format data for Arduino
        formatted_data = format_data_for_arduino(payload.data)
        
        # Send to Arduino and monitor response
        send_to_arduino(formatted_data)
        
        return {"status": "success", "message": "Data sent to Arduino and monitoring complete"}
    
    except Exception as e:
        error_msg = f"Error processing request: {str(e)}"
        print(f"\nERROR: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# Arduino simulation constants (matching Arduino code)
COMPOSITE_FLOW_RATE = 10.0  # mL/min
C1_MMOL_L = 20.0  # High concentration (mmol/L)
C2_MMOL_L = 10.0  # Low concentration (PBS) (mmol/L)

def calculate_pump_flow_rates(desired_conc):
    """Simulate Arduino's calculatePumpFlowRates_mLmin function"""
    Q_total = COMPOSITE_FLOW_RATE / (1e6 * 60.0)  # m³/s
    delta_C = C1_MMOL_L - C2_MMOL_L
    Q1 = (Q_total * (desired_conc - C2_MMOL_L) / delta_C) if delta_C != 0 else 0
    Q2 = Q_total - Q1

    glucose_flow_rate = Q1 * 1e6 * 60.0  # Convert back to mL/min
    pbs_flow_rate = Q2 * 1e6 * 60.0      # Convert back to mL/min
    
    return glucose_flow_rate, pbs_flow_rate

def calculate_pump_rpm(flow_rate):
    """Simulate Arduino's pump RPM calculation"""
    return int((flow_rate + 0.2537) * 2 / 0.1185)

@app.post("/simulate-arduino")
async def simulate_arduino(payload: DataPayload):
    """
    Simulate Arduino's processing without sending data to the device.
    Shows all calculations and timing details.
    """
    try:
        if len(payload.data) != 13:
            raise HTTPException(
                status_code=400,
                detail="Data must contain exactly 13 time points"
            )

        # Format data as Arduino would receive it
        formatted_data = format_data_for_arduino(payload.data)
        simulation_output = []
        
        simulation_output.append("=== Arduino Simulation Start ===")
        simulation_output.append(f"Received data string: {formatted_data.strip()}")
        
        # Parse data as Arduino would
        timestamps = []
        concentrations = []
        for time, conc in payload.data:
            timestamps.append(int(time))
            concentrations.append(float(conc))
            
        simulation_output.append("\nParsed Data Arrays:")
        simulation_output.append(f"Timestamps (minutes): {timestamps}")
        simulation_output.append(f"Concentrations (mmol/L): {[round(c, 2) for c in concentrations]}")
        
        # Process each concentration point
        simulation_output.append("\nProcessing steps:")
        for i in range(len(timestamps)):
            target_conc = concentrations[i]
            simulation_output.append(f"\nStep {i+1}/{len(timestamps)}")
            simulation_output.append(f"Time: {timestamps[i]} minutes")
            simulation_output.append(f"Target Concentration: {target_conc:.2f} mmol/L")
            
            # Calculate flow rates
            glucose_flow, pbs_flow = calculate_pump_flow_rates(target_conc)
            simulation_output.append(f"Calculated Flow Rates:")
            simulation_output.append(f"  Glucose: {glucose_flow:.3f} mL/min")
            simulation_output.append(f"  PBS: {pbs_flow:.3f} mL/min")
            
            # Calculate pump RPMs
            pump1_rpm = calculate_pump_rpm(glucose_flow)
            pump2_rpm = calculate_pump_rpm(pbs_flow)
            simulation_output.append(f"Pump RPMs:")
            simulation_output.append(f"  Pump 1 (Glucose): {pump1_rpm} RPM")
            simulation_output.append(f"  Pump 2 (PBS): {pump2_rpm} RPM")
            
            # Calculate run time (if not the last step)
            if i < len(timestamps) - 1:
                time_diff_minutes = timestamps[i+1] - timestamps[i]
                run_time_ms = time_diff_minutes * 60 * 1000
                simulation_output.append(f"Timing:")
                simulation_output.append(f"  Step duration: {time_diff_minutes} minutes")
                simulation_output.append(f"  Run time: {run_time_ms} milliseconds")
                
                # Calculate expected steps (200 steps per revolution)
                steps_per_rev = 200
                interval1_us = 60000000 / (pump1_rpm * steps_per_rev) if pump1_rpm > 0 else 0
                interval2_us = 60000000 / (pump2_rpm * steps_per_rev) if pump2_rpm > 0 else 0
                expected_steps1 = (run_time_ms * 1000 / interval1_us) if pump1_rpm > 0 else 0
                expected_steps2 = (run_time_ms * 1000 / interval2_us) if pump2_rpm > 0 else 0
                
                simulation_output.append(f"Expected Steps:")
                simulation_output.append(f"  Pump 1: {int(expected_steps1)} steps (interval: {interval1_us:.1f}µs)")
                simulation_output.append(f"  Pump 2: {int(expected_steps2)} steps (interval: {interval2_us:.1f}µs)")
            else:
                simulation_output.append("Final concentration point - maintaining these settings until stopped")
        
        simulation_output.append("\n=== Simulation Complete ===")
        
        return {"simulation": simulation_output}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}"
        ) 