from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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