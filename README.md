# Peristaltic Pump Control System

A distributed system for controlling peristaltic pumps with a web interface, designed for both development and Raspberry Pi deployment.

## Architecture Overview

- **Microcontroller Layer**: Arduino Uno/Nano with A4988 stepper drivers
- **Serial Bridge**: Python service for Arduino communication
- **Message Bus**: MQTT for decoupled communication
- **API Gateway**: FastAPI for REST + WebSocket endpoints
- **Frontend**: React-based web interface
- **Security**: Caddy 2 reverse proxy with automatic TLS

## Directory Structure

```
.
├── arduino/           # Arduino firmware
├── bridge/           # Python serial bridge service
├── api/              # FastAPI backend service
├── frontend/         # React frontend
├── docker/           # Docker and deployment configs
└── docs/            # Documentation
```

## Development Setup

1. Install dependencies:
   - Arduino IDE
   - Python 3.9+
   - Node.js 16+
   - Docker & Docker Compose

2. Configure environment:
   ```bash
   # Clone repository
   git clone [repository-url]
   cd pump-control-system

   # Set up Python virtual environment
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt

   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. Start development servers:
   ```bash
   # Terminal 1: Start MQTT broker
   docker-compose up mosquitto

   # Terminal 2: Start API server
   cd api
   uvicorn main:app --reload

   # Terminal 3: Start frontend
   cd frontend
   npm run dev
   ```

## Production Deployment

1. Build Docker images:
   ```bash
   docker-compose build
   ```

2. Start services:
   ```bash
   docker-compose up -d
   ```

## License

MIT License 