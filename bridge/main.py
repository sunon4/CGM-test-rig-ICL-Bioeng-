import json
import os
import time
from typing import Optional
import serial
import paho.mqtt.client as mqtt
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
SERIAL_PORT = os.getenv("SERIAL_PORT", "/dev/ttyUSB0")
SERIAL_BAUD = int(os.getenv("SERIAL_BAUD", "115200"))

# MQTT topics
PUMP_COMMAND_TOPIC = "pump/+/command"  # + is a wildcard for pump ID
PUMP_STATUS_TOPIC = "pump/{}/status"

class PumpCommand(BaseModel):
    pump_id: int = Field(..., ge=1, le=2)
    enable: Optional[bool] = None
    direction: Optional[bool] = None  # True = clockwise, False = counterclockwise
    rpm: Optional[int] = Field(None, ge=0, le=200)
    microstep: Optional[int] = Field(None, ge=0, le=4)

class SerialBridge:
    def __init__(self):
        # Initialize serial connection
        self.serial = serial.Serial(
            port=SERIAL_PORT,
            baudrate=SERIAL_BAUD,
            timeout=1
        )
        time.sleep(2)  # Wait for Arduino to reset
        
        # Initialize MQTT client
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        
        # Connect to MQTT broker
        self.mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
    
    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected to MQTT broker with result code {rc}")
        # Subscribe to pump commands
        client.subscribe(PUMP_COMMAND_TOPIC)
    
    def on_message(self, client, userdata, msg):
        try:
            # Extract pump ID from topic
            pump_id = int(msg.topic.split('/')[1])
            
            # Parse command
            payload = json.loads(msg.payload)
            command = PumpCommand(pump_id=pump_id, **payload)
            
            # Convert to Arduino JSON format
            arduino_command = {
                "pump": command.pump_id
            }
            
            if command.enable is not None:
                arduino_command["enable"] = command.enable
            if command.direction is not None:
                arduino_command["direction"] = command.direction
            if command.rpm is not None:
                arduino_command["rpm"] = command.rpm
            if command.microstep is not None:
                arduino_command["microstep"] = command.microstep
            
            # Send to Arduino
            self.serial.write(json.dumps(arduino_command).encode() + b'\n')
            
            # Wait for acknowledgment
            response = self.serial.readline().decode().strip()
            response_data = json.loads(response)
            
            # Publish status
            if response_data.get("status") == "ok":
                status_topic = PUMP_STATUS_TOPIC.format(pump_id)
                self.mqtt_client.publish(status_topic, msg.payload)
            else:
                print(f"Error from Arduino: {response}")
                
        except Exception as e:
            print(f"Error processing message: {e}")
    
    def run(self):
        try:
            print("Starting serial bridge...")
            self.mqtt_client.loop_forever()
        except KeyboardInterrupt:
            print("Shutting down...")
        finally:
            self.serial.close()
            self.mqtt_client.disconnect()

if __name__ == "__main__":
    bridge = SerialBridge()
    bridge.run() 