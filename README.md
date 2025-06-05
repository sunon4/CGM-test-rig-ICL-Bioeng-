# Pump Control System

This system consists of a web-based frontend interface and a backend server that communicates with an Arduino via serial connection.

## System Architecture

- **Frontend**: Web interface running on user's device (phone/laptop)
- **Backend**: FastAPI server running on a machine connected to Arduino
- **Arduino**: Connected to the backend machine via USB

## Setup Instructions

### Frontend Setup

1. Host the frontend files on a web server or use a local development server:
```bash
# Using Python's built-in HTTP server
cd frontend
python -m http.server 8080
```

2. Access the frontend at `http://localhost:8080/write.html`

3. Update the `BACKEND_URL` in `frontend/js/write.js` to match your backend machine's IP address

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Start the FastAPI server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

3. Ensure Arduino is connected via USB and the correct port is set in `main.py` (`SERIAL_PORT`)

## Usage

1. Use the frontend interface to configure the glucose concentration profile:
   - Manual Control: Set pump parameters
   - Simulator: Generate patterns
   - CSV Upload: Upload custom profile

2. Click "Start Process" to send the profile to the Arduino

3. The system will:
   - Send the 13x2 array to the backend
   - Format data for Arduino (`time:concentration` pairs)
   - Transmit via serial connection

## Data Format

- Frontend to Backend: JSON array of [time, concentration] pairs
- Backend to Arduino: String format "time1:conc1,time2:conc2,...\n"

## Troubleshooting

1. CORS Issues:
   - Ensure backend CORS settings allow your frontend origin
   - Check browser console for CORS errors

2. Serial Connection:
   - Verify correct port in `main.py`
   - Check Arduino connection
   - Ensure proper permissions for serial port access

3. Data Format:
   - Verify 13 time points (0-60 minutes, 5-minute steps)
   - Concentration values between 10-20 mM 