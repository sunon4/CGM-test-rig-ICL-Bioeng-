import os
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import paho.mqtt.client as mqtt
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

app = FastAPI(title="Pump Control API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
        # Initialize MQTT client
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        self.mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
        self.mqtt_client.loop_start()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass
    
    def on_connect(self, client, userdata, flags, rc):
        print(f"Connected to MQTT broker with result code {rc}")
        client.subscribe("pump/+/status")
    
    def on_message(self, client, userdata, msg):
        # Forward MQTT messages to WebSocket clients
        message = {
            "topic": msg.topic,
            "payload": json.loads(msg.payload)
        }
        for connection in self.active_connections:
            try:
                connection.send_text(json.dumps(message))
            except:
                pass

manager = ConnectionManager()

class PumpCommand(BaseModel):
    enable: Optional[bool] = None
    direction: Optional[bool] = None  # True = clockwise, False = counterclockwise
    rpm: Optional[int] = Field(None, ge=0, le=200)
    microstep: Optional[int] = Field(None, ge=0, le=4)

@app.get("/")
async def root():
    return {"status": "ok", "message": "Pump Control API is running"}

@app.post("/pump/{pump_id}/command")
async def control_pump(pump_id: int, command: PumpCommand):
    if pump_id not in [1, 2]:
        raise HTTPException(status_code=400, detail="Invalid pump ID")
    
    # Publish command to MQTT
    topic = f"pump/{pump_id}/command"
    payload = command.dict(exclude_none=True)
    
    manager.mqtt_client.publish(topic, json.dumps(payload))
    return {"status": "ok", "message": "Command sent"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages (if any processing is needed)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 