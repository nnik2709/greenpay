"""
PrehKeyTec MC147 COM Port Bridge Service

Reads MRZ data from PrehKeyTec scanner via COM29 (Virtual COM Port)
and broadcasts parsed passport data to web applications via WebSocket.

PrehKeyTec scanners in airline mode output SITA/ARINC protocol data.
This service translates that data for web application consumption.

Usage:
    python com_bridge.py

Requirements:
    pip install pyserial websockets

Author: GreenPay Team
"""

import asyncio
import json
import logging
import re
import sys
import time
from datetime import datetime
from typing import Optional, Dict, Any, Set

try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("ERROR: pyserial not installed. Run: pip install pyserial")
    sys.exit(1)

try:
    import websockets
    from websockets.legacy.server import serve
except ImportError:
    try:
        from websockets import serve
    except ImportError:
        print("ERROR: websockets not installed. Run: pip install websockets")
        sys.exit(1)

# Configuration
CONFIG = {
    'COM_PORT': 'COM29',           # PrehKeyTec Virtual COM Port
    'BAUD_RATE': 9600,             # Default for PrehKeyTec
    'WEBSOCKET_HOST': 'localhost',
    'WEBSOCKET_PORT': 8765,
    'LOG_LEVEL': 'INFO',
    'RECONNECT_DELAY': 5,          # Seconds between COM port reconnect attempts
}

# Logging setup
logging.basicConfig(
    level=getattr(logging, CONFIG['LOG_LEVEL']),
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Connected WebSocket clients
connected_clients: Set = set()

# Country code to nationality mapping (subset for common codes)
COUNTRY_CODES = {
    'PNG': 'Papua New Guinean', 'AUS': 'Australian', 'USA': 'American',
    'GBR': 'British', 'NZL': 'New Zealander', 'FJI': 'Fijian',
    'IDN': 'Indonesian', 'MYS': 'Malaysian', 'SGP': 'Singaporean',
    'PHL': 'Filipino', 'JPN': 'Japanese', 'CHN': 'Chinese',
    'IND': 'Indian', 'DEU': 'German', 'FRA': 'French',
}


def parse_mrz(mrz_text: str) -> Optional[Dict[str, Any]]:
    """
    Parse MRZ text (88 characters, 2 lines of 44) into passport data.

    ICAO 9303 TD3 Format:
    Line 1: P<ISSUINGCOUNTRYSURNAME<<GIVENNAMES<<<<<<<<<<<<<<<<<<<<
    Line 2: PASSPORTNUMBER<NATIONALITY<DOBYYMMDDSEXEXPIRYYYMMDD<<<<<<<<<<<<<CHECKDIGITS
    """
    # Clean input
    cleaned = mrz_text.replace('\n', '').replace('\r', '').replace(' ', '').upper()

    # Validate length
    if len(cleaned) < 88:
        logger.warning(f"MRZ too short: {len(cleaned)} chars (need 88)")
        return None

    # Take first 88 characters
    cleaned = cleaned[:88]

    # Validate format
    if not cleaned.startswith('P<'):
        logger.warning(f"Invalid MRZ format: doesn't start with 'P<'")
        return None

    # Split into lines
    line1 = cleaned[:44]
    line2 = cleaned[44:88]

    try:
        # Parse Line 1: Document type, issuing country, names
        doc_type = line1[0:2]
        issuing_country = line1[2:5]

        # Names section (split by <<)
        names_section = line1[5:]
        names = names_section.split('<<')
        surname = names[0].replace('<', ' ').strip()
        given_name = ' '.join(names[1:]).replace('<', ' ').strip()

        # Parse Line 2: Passport number, nationality, DOB, sex, expiry
        passport_number = line2[0:9].replace('<', '').strip()
        passport_check = line2[9:10]

        nationality_code = line2[10:13]
        nationality = COUNTRY_CODES.get(nationality_code, nationality_code)

        # Date of Birth (YYMMDD)
        dob_raw = line2[13:19]
        dob_check = line2[19:20]
        dob_year = int(dob_raw[0:2])
        # Year conversion: >current year's YY = 1900s, else 2000s
        current_yy = datetime.now().year % 100
        dob_year = 1900 + dob_year if dob_year > current_yy else 2000 + dob_year
        dob = f"{dob_year}-{dob_raw[2:4]}-{dob_raw[4:6]}"

        # Sex
        sex_code = line2[20:21]
        sex = 'Male' if sex_code == 'M' else 'Female' if sex_code == 'F' else 'Other'

        # Expiry date (YYMMDD)
        expiry_raw = line2[21:27]
        expiry_check = line2[27:28]
        expiry_year = int(expiry_raw[0:2])
        # Expiry dates are typically future, so >50 = 1900s, else 2000s
        expiry_year = 1900 + expiry_year if expiry_year > 50 else 2000 + expiry_year
        expiry = f"{expiry_year}-{expiry_raw[2:4]}-{expiry_raw[4:6]}"

        # Personal number (optional)
        personal_number = line2[28:42].replace('<', '').strip()

        return {
            'success': True,
            'type': 'mrz',
            'passportNumber': passport_number,
            'surname': surname,
            'givenName': given_name,
            'nationality': nationality,
            'nationalityCode': nationality_code,
            'dateOfBirth': dob,
            'sex': sex,
            'dateOfExpiry': expiry,
            'issuingCountry': issuing_country,
            'personalNumber': personal_number if personal_number else None,
            'raw': cleaned,
            'timestamp': datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"MRZ parsing error: {e}")
        return None


def parse_sita_message(data: str) -> Optional[Dict[str, Any]]:
    """
    Parse SITA protocol message from PrehKeyTec scanner.

    SITA format varies but typically includes:
    - STX (0x02) start
    - Message content
    - ETX (0x03) end
    - Optional checksum

    For MRZ reading, the message contains the 88-character MRZ string.
    """
    # Remove SITA framing characters
    cleaned = data.strip()

    # Remove STX (0x02), ETX (0x03), ACK, NAK, etc.
    cleaned = cleaned.replace('\x02', '').replace('\x03', '')
    cleaned = cleaned.replace('\x06', '').replace('\x15', '')

    # Look for MRZ pattern (starts with P<)
    mrz_match = re.search(r'P<[A-Z0-9<]{86}', cleaned)
    if mrz_match:
        mrz_text = mrz_match.group(0)
        return parse_mrz(mrz_text)

    # Check if the whole message is MRZ
    if cleaned.startswith('P<') and len(cleaned) >= 88:
        return parse_mrz(cleaned)

    # If not MRZ, return as simple barcode/QR data
    if len(cleaned) >= 3:
        return {
            'success': True,
            'type': 'barcode',
            'value': cleaned,
            'timestamp': datetime.now().isoformat(),
        }

    return None


async def broadcast_to_clients(message: Dict[str, Any]):
    """Broadcast message to all connected WebSocket clients."""
    if not connected_clients:
        logger.debug("No clients connected, skipping broadcast")
        return

    message_json = json.dumps(message)
    disconnected = set()

    for client in connected_clients:
        try:
            await client.send(message_json)
            logger.info(f"Sent to client: {message.get('type', 'unknown')}")
        except websockets.exceptions.ConnectionClosed:
            disconnected.add(client)
        except Exception as e:
            logger.error(f"Error sending to client: {e}")
            disconnected.add(client)

    # Remove disconnected clients
    for client in disconnected:
        connected_clients.discard(client)


async def handle_websocket(websocket, path=None):
    """Handle WebSocket client connection."""
    connected_clients.add(websocket)
    client_addr = websocket.remote_address
    logger.info(f"Client connected: {client_addr}")

    try:
        # Send welcome message
        await websocket.send(json.dumps({
            'type': 'connected',
            'message': 'PrehKeyTec COM Bridge connected',
            'timestamp': datetime.now().isoformat(),
        }))

        # Keep connection alive, handle incoming messages
        async for message in websocket:
            logger.debug(f"Received from client: {message}")

            # Handle client commands
            try:
                data = json.loads(message)
                cmd = data.get('command')

                if cmd == 'ping':
                    await websocket.send(json.dumps({
                        'type': 'pong',
                        'timestamp': datetime.now().isoformat(),
                    }))
                elif cmd == 'status':
                    await websocket.send(json.dumps({
                        'type': 'status',
                        'comPort': CONFIG['COM_PORT'],
                        'clientsConnected': len(connected_clients),
                        'timestamp': datetime.now().isoformat(),
                    }))

            except json.JSONDecodeError:
                pass

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        logger.error(f"WebSocket handler error: {e}", exc_info=True)
    finally:
        connected_clients.discard(websocket)
        logger.info(f"Client disconnected: {client_addr}")


def list_com_ports():
    """List available COM ports."""
    ports = serial.tools.list_ports.comports()
    logger.info("Available COM ports:")
    for port in ports:
        logger.info(f"  {port.device}: {port.description}")
    return ports


async def read_com_port():
    """
    Read data from COM port and broadcast to WebSocket clients.

    Handles reconnection if the port becomes unavailable.
    """
    ser = None
    buffer = ""
    last_data_time = time.time()

    while True:
        try:
            # Open COM port
            if ser is None or not ser.is_open:
                logger.info(f"Opening COM port {CONFIG['COM_PORT']} at {CONFIG['BAUD_RATE']} baud...")

                # List available ports for debugging
                list_com_ports()

                ser = serial.Serial(
                    port=CONFIG['COM_PORT'],
                    baudrate=CONFIG['BAUD_RATE'],
                    bytesize=serial.EIGHTBITS,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    timeout=1,  # 1 second read timeout
                    rtscts=False,
                    dsrdtr=False,
                )

                # IMPORTANT: Set DTR and RTS active to enable data output
                # Per PrehKeyTec manual: "DTR and RTS must be set active to initialize
                # communication and enable data output"
                ser.dtr = True
                ser.rts = True
                logger.info("DTR and RTS set to active (required for PrehKeyTec)")
                logger.info(f"COM port {CONFIG['COM_PORT']} opened successfully")

                # Notify clients
                await broadcast_to_clients({
                    'type': 'com_connected',
                    'port': CONFIG['COM_PORT'],
                    'timestamp': datetime.now().isoformat(),
                })

            # Read available data
            if ser.in_waiting > 0:
                data = ser.read(ser.in_waiting).decode('utf-8', errors='ignore')
                buffer += data
                last_data_time = time.time()

                logger.debug(f"Received: {repr(data)}")

                # Clean buffer of control characters for MRZ detection
                cleaned = buffer.replace('\r', '').replace('\n', '').replace('\x03', '').replace('\x02', '')

                # Check if we have a complete MRZ (88 printable chars starting with P<)
                if cleaned.startswith('P<') and len(cleaned) >= 88:
                    # Extract MRZ and parse
                    mrz_data = cleaned[:88]
                    parsed = parse_mrz(mrz_data)

                    if parsed:
                        logger.info(f"Parsed MRZ: {parsed.get('passportNumber', 'unknown')} - {parsed.get('givenName', '')} {parsed.get('surname', '')}")
                        await broadcast_to_clients(parsed)

                    # Clear buffer after successful MRZ parse
                    buffer = ""

                # Check for ETX (end of transmission) for non-MRZ data
                elif '\x03' in buffer:
                    parsed = parse_sita_message(buffer)
                    if parsed:
                        logger.info(f"Parsed {parsed.get('type', 'unknown')}: {parsed}")
                        await broadcast_to_clients(parsed)
                    buffer = ""

            # Timeout: if we have partial data and no new data for 200ms, process it
            elif buffer and (time.time() - last_data_time > 0.2):
                cleaned = buffer.replace('\r', '').replace('\n', '').strip()
                if len(cleaned) >= 3:
                    # Try to parse as MRZ first
                    if cleaned.startswith('P<') and len(cleaned) >= 88:
                        parsed = parse_mrz(cleaned[:88])
                    else:
                        parsed = parse_sita_message(buffer)

                    if parsed:
                        logger.info(f"Parsed (timeout): {parsed.get('type', 'unknown')}")
                        await broadcast_to_clients(parsed)
                buffer = ""

            # Small delay to prevent busy loop
            await asyncio.sleep(0.05)

        except serial.SerialException as e:
            logger.error(f"COM port error: {e}")

            # Notify clients
            await broadcast_to_clients({
                'type': 'com_error',
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
            })

            # Close and reconnect
            if ser:
                try:
                    ser.close()
                except:
                    pass
                ser = None

            logger.info(f"Reconnecting in {CONFIG['RECONNECT_DELAY']} seconds...")
            await asyncio.sleep(CONFIG['RECONNECT_DELAY'])

        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            await asyncio.sleep(1)


async def main():
    """Main entry point."""
    logger.info("=" * 60)
    logger.info("PrehKeyTec MC147 COM Port Bridge Service")
    logger.info("=" * 60)
    logger.info(f"COM Port: {CONFIG['COM_PORT']}")
    logger.info(f"WebSocket: ws://{CONFIG['WEBSOCKET_HOST']}:{CONFIG['WEBSOCKET_PORT']}")
    logger.info("=" * 60)

    # Start WebSocket server
    ws_server = await serve(
        handle_websocket,
        CONFIG['WEBSOCKET_HOST'],
        CONFIG['WEBSOCKET_PORT']
    )
    logger.info(f"WebSocket server started on ws://{CONFIG['WEBSOCKET_HOST']}:{CONFIG['WEBSOCKET_PORT']}")

    # Start COM port reader
    com_task = asyncio.create_task(read_com_port())

    logger.info("Service running. Press Ctrl+C to stop.")
    logger.info("Connect web app to: ws://localhost:8765")

    try:
        await asyncio.gather(
            ws_server.wait_closed(),
            com_task,
        )
    except asyncio.CancelledError:
        logger.info("Shutting down...")
    finally:
        ws_server.close()
        await ws_server.wait_closed()


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
