# PrehKeyTec COM Port Bridge Service

Bridges PrehKeyTec MC147 scanner (COM port mode) to web applications via WebSocket.

## Architecture

```
PrehKeyTec MC147 Scanner
        │
        ▼ (SITA/ARINC Protocol)
    COM29 (Virtual COM Port)
        │
        ▼
  com_bridge.py (Python Service)
        │
        ▼ (WebSocket ws://localhost:8765)
    GreenPay Web App
```

## Requirements

- Python 3.8+
- PrehKeyTec CheckinPackage installed (creates COM29)
- PrehKeyTec VCOM Service running

## Installation

```bash
cd python-com-bridge
pip install -r requirements.txt
```

## Usage

```bash
# Start the bridge service
python com_bridge.py
```

The service will:
1. Connect to COM29 (PrehKeyTec Virtual COM Port)
2. Start WebSocket server on ws://localhost:8765
3. Read MRZ data when passports are scanned
4. Broadcast parsed data to connected web clients

## Configuration

Edit `com_bridge.py` CONFIG section:

```python
CONFIG = {
    'COM_PORT': 'COM29',           # Change if your COM port is different
    'BAUD_RATE': 9600,             # PrehKeyTec default
    'WEBSOCKET_HOST': 'localhost',
    'WEBSOCKET_PORT': 8765,
}
```

## WebSocket Messages

### Server → Client

**MRZ Scan Result:**
```json
{
  "type": "mrz",
  "success": true,
  "passportNumber": "AB1234567",
  "surname": "DOE",
  "givenName": "JOHN",
  "nationality": "Australian",
  "nationalityCode": "AUS",
  "dateOfBirth": "1990-01-15",
  "sex": "Male",
  "dateOfExpiry": "2030-12-31",
  "timestamp": "2026-01-10T10:30:00.000Z"
}
```

**Barcode/QR Scan:**
```json
{
  "type": "barcode",
  "success": true,
  "value": "ABC123456789",
  "timestamp": "2026-01-10T10:30:00.000Z"
}
```

**Connection Status:**
```json
{
  "type": "connected",
  "message": "PrehKeyTec COM Bridge connected"
}
```

### Client → Server

**Ping:**
```json
{"command": "ping"}
```

**Status Request:**
```json
{"command": "status"}
```

## Troubleshooting

### "Access is denied" on COM29

Another process is using the COM port:
1. Close CheckinConfigurator if open
2. Stop other applications using COM29
3. Check if the passport_ocr_service.exe is running

### "No such port" COM29

1. Verify PrehKeyTec VCOM Service is running:
   - Open Windows Services (services.msc)
   - Find "PrehKeyTec VCOM Service" (pktvcoms)
   - Ensure it's running

2. Check if COM29 exists:
   - Open Device Manager
   - Expand "Ports (COM & LPT)"
   - Look for "PrehKeyTec Virtual COM Port (COM29)"

### Scanner not sending data

1. Verify scanner is connected and powered
2. Check CheckinConfigurator "MSR OCR AUX Test" tab
3. Ensure correct firmware (SITA or ARINC) is loaded

## Integration with GreenPay

See `/src/hooks/useComBridgeScanner.js` for React hook that connects to this service.
