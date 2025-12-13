# PNG Green Fees System - Hardware Integration Technical Specification

## Document Purpose

This technical specification provides ICT support teams with the information needed to integrate hardware devices (cameras, scanners, keyboards) with the PNG Green Fees web application. It covers system architecture, integration requirements, and step-by-step implementation procedures.

---

## 1. System Overview

### 1.1 Application Architecture

| Component | Technology | Details |
|-----------|------------|---------|
| **Frontend** | React 18 + Vite | Single Page Application (SPA) running in browser |
| **Backend** | Supabase | PostgreSQL database with REST API |
| **Hosting** | VPS (Linux) | PM2 process manager, Nginx reverse proxy |
| **Protocol** | HTTPS | TLS 1.2+ encrypted communications |
| **Domain** | eywademo.cloud | SSL certificate installed |

### 1.2 Browser Requirements

The application runs entirely in the browser. Hardware integration uses modern Web APIs:

- **Minimum Browser**: Chrome 80+, Firefox 75+, Edge 80+, Safari 14+
- **Required APIs**: WebRTC (camera), Web Serial API (scanner), standard HID (keyboard)
- **Permissions**: Camera access, serial port access (if applicable)

### 1.3 Hardware Integration Points

| Hardware | Primary Use Case | Integration Method |
|----------|------------------|-------------------|
| **Camera/Webcam** | Passport photo capture, MRZ scanning | WebRTC MediaDevices API |
| **Document Scanner** | Passport data page scanning | USB HID or Web Serial API |
| **Barcode Scanner** | Voucher/ticket validation | Keyboard wedge mode (HID) |
| **Keyboard** | Data entry | Standard USB HID |
| **POS Terminal** | Payment processing | Kina Bank API (separate integration) |

---

## 2. Hardware Requirements & Specifications

### 2.1 Camera/Webcam

**Purpose:** Capture passport holder photos, scan MRZ (Machine Readable Zone) on passports

**Minimum Specifications:**
- Resolution: 1080p (1920x1080) recommended, 720p minimum
- Frame rate: 30fps
- Autofocus: Required for MRZ scanning
- Connection: USB 2.0 or USB 3.0

**Recommended Models:**
- Logitech C920/C922 Pro (excellent autofocus)
- Logitech Brio (4K, premium option)
- Microsoft LifeCam HD-3000 (budget option)

**Why these specs matter:**
- MRZ text is small; low resolution causes OCR failures
- Autofocus essential for varying passport distances
- Good low-light performance helps in office environments

### 2.2 Document Scanner

**Purpose:** High-quality scans of passport data pages for records

**Minimum Specifications:**
- Resolution: 300 DPI minimum, 600 DPI recommended
- Color depth: 24-bit color
- Scan area: A4/Letter size
- Connection: USB
- Driver: TWAIN or WIA compatible

**Recommended Models:**
- Fujitsu ScanSnap iX1600 (fast, reliable)
- Epson WorkForce ES-400 II (good value)
- Canon imageFORMULA DR-C225 II (compact)

**Integration approach:**
- Option A: Scan to folder → upload to application
- Option B: Web Serial API direct integration (requires custom development)
- Option C: Third-party scanning service with API

### 2.3 Barcode/QR Code Scanner

**Purpose:** Scan voucher codes, ticket validation, quick data entry

**Minimum Specifications:**
- Symbologies: QR Code, Code 128, Code 39
- Interface: USB HID (keyboard wedge mode)
- Scan speed: 100+ scans/second

**Recommended Models:**
- Honeywell Voyager 1400g (versatile)
- Zebra DS2208 (reliable)
- Datalogic QuickScan QD2500 (budget)

**Why keyboard wedge mode:**
- Scanner appears as keyboard to computer
- Scanned data typed directly into active input field
- No special drivers or software needed
- Works with any web application immediately

### 2.4 Keyboard

**Purpose:** Standard data entry

**Requirements:**
- Standard USB or wireless keyboard
- Any layout compatible with operator preference
- No special requirements

---

## 3. Network & Infrastructure Requirements

### 3.1 Network Configuration

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Workstation   │────▶│   Network    │────▶│   Internet      │
│  (Browser +     │     │   (LAN/WiFi) │     │                 │
│   Hardware)     │     │              │     │   ▼             │
└─────────────────┘     └──────────────┘     │ ┌─────────────┐ │
                                             │ │ VPS Server  │ │
                                             │ │ (Green Fees)│ │
                                             │ └─────────────┘ │
                                             │        │        │
                                             │        ▼        │
                                             │ ┌─────────────┐ │
                                             │ │  Supabase   │ │
                                             │ │  (Database) │ │
                                             │ └─────────────┘ │
                                             └─────────────────┘
```

### 3.2 Bandwidth Requirements

| Activity | Minimum Bandwidth | Recommended |
|----------|-------------------|-------------|
| Normal operation | 1 Mbps | 5 Mbps |
| Photo upload | 2 Mbps | 10 Mbps |
| Bulk document upload | 5 Mbps | 20 Mbps |

### 3.3 Firewall & Security

**Outbound connections required:**

| Destination | Port | Protocol | Purpose |
|-------------|------|----------|---------|
| eywademo.cloud | 443 | HTTPS | Application server |
| *.supabase.co | 443 | HTTPS | Database & auth |
| *.supabase.in | 443 | HTTPS | Supabase functions |

**No inbound connections required** - all communication initiated by browser.

### 3.4 Proxy Considerations

If network uses proxy server:
- Ensure HTTPS traffic to above domains is allowed
- WebSocket connections must be permitted (Supabase real-time)
- Proxy must not modify SSL certificates (no MITM inspection for these domains)

---

## 4. Step-by-Step Hardware Integration

### Phase 1: Pre-Installation Checklist

#### 1.1 Inventory Hardware
- [ ] List all devices to be connected (make, model, serial number)
- [ ] Verify USB ports available on workstation
- [ ] Check for USB hub requirements (powered hub recommended for multiple devices)
- [ ] Obtain any vendor-specific drivers

#### 1.2 Prepare Workstation
- [ ] Update operating system to latest version
- [ ] Update browser to latest version (Chrome recommended)
- [ ] Install any required drivers
- [ ] Ensure workstation meets minimum specs:
  - CPU: Intel i3 / AMD Ryzen 3 or better
  - RAM: 8GB minimum
  - Storage: 256GB SSD recommended
  - USB: At least 3 USB ports available

#### 1.3 Network Verification
- [ ] Verify internet connectivity
- [ ] Test access to https://eywademo.cloud
- [ ] Confirm no proxy/firewall blocks
- [ ] Test upload speeds (minimum 2 Mbps)

---

### Phase 2: Camera/Webcam Integration

#### 2.1 Physical Installation
1. Connect webcam to USB port (prefer USB 3.0 for better performance)
2. Position camera at appropriate height for passport scanning
3. Ensure adequate lighting (avoid backlighting)
4. Mount securely to prevent movement during scanning

#### 2.2 Operating System Configuration

**Windows 10/11:**
```
Settings → Privacy → Camera
- Allow apps to access your camera: ON
- Allow desktop apps to access your camera: ON
```

**macOS:**
```
System Preferences → Security & Privacy → Camera
- Check browser (Chrome/Firefox/Safari) is allowed
```

#### 2.3 Browser Configuration

1. Navigate to https://eywademo.cloud
2. When prompted, click "Allow" for camera access
3. If accidentally blocked:
   - Chrome: Click lock icon in address bar → Site settings → Camera → Allow
   - Firefox: Click lock icon → Connection secure → More information → Permissions
   - Edge: Click lock icon → Site permissions → Camera → Allow

#### 2.4 Application Configuration

1. Log in to Green Fees application
2. Navigate to page requiring camera (e.g., Individual Purchase, MRZ Scanner)
3. System should automatically detect camera
4. If multiple cameras, select correct device from dropdown
5. Test capture functionality:
   - Click "Capture Photo" or "Scan MRZ"
   - Verify image quality is acceptable
   - Confirm image saves correctly

#### 2.5 Camera Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Camera not detected | Driver issue | Reinstall driver from manufacturer |
| Black screen | Permission denied | Check browser permissions |
| Poor quality | Wrong camera selected | Select HD camera in dropdown |
| Blurry MRZ | Autofocus not working | Adjust distance, check lighting |
| Slow/laggy | USB 1.1 port | Move to USB 3.0 port |

---

### Phase 3: Barcode Scanner Integration

#### 3.1 Physical Installation
1. Connect scanner to USB port
2. Scanner should be recognized as keyboard device (no driver needed)
3. Position scanner for ergonomic access

#### 3.2 Configure Keyboard Wedge Mode

Most scanners ship in keyboard wedge mode by default. To verify/configure:

1. Open any text editor (Notepad, TextEdit)
2. Scan a barcode
3. Text should appear in editor as if typed
4. If not working, scan configuration barcodes from scanner manual to enable HID mode

#### 3.3 Configure Scanner Settings

Scan these configuration barcodes (from manual) as needed:

- **Add Enter/Return suffix**: Ensures form submission after scan
- **Set scan speed**: Match to application responsiveness
- **Enable specific symbologies**: QR Code, Code 128, Code 39

#### 3.4 Application Integration

1. Log in to Green Fees application
2. Navigate to Scan and Validate page
3. Click in the input field
4. Scan a voucher/ticket barcode
5. Data should populate and form may auto-submit

#### 3.5 Scanner Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| No response | Not in HID mode | Scan HID/keyboard wedge config barcode |
| Wrong characters | Keyboard layout mismatch | Match scanner language to OS keyboard |
| Double scanning | Too sensitive | Increase scan delay in scanner config |
| Partial data | Buffer overflow | Reduce scan speed |
| No auto-submit | Missing suffix | Configure scanner to add Enter key |

---

### Phase 4: Document Scanner Integration

#### 4.1 Physical Installation
1. Connect scanner to USB port
2. Install manufacturer drivers (TWAIN/WIA)
3. Install manufacturer scanning software
4. Calibrate scanner if required

#### 4.2 Configure Scan Settings

**Recommended settings for passports:**
- Resolution: 300-600 DPI
- Color mode: Full color (24-bit)
- File format: JPEG or PNG
- Compression: Medium quality (balance size/quality)

#### 4.3 Integration Options

**Option A: Scan to Folder (Recommended for simplicity)**

1. Configure scanner to save files to specific folder
2. Use naming convention: `passport_[date]_[time].jpg`
3. In Green Fees application:
   - Navigate to passport entry page
   - Click "Upload Document"
   - Browse to scan folder
   - Select scanned image

**Option B: Direct Browser Integration (Advanced)**

For direct scanner access from browser (Chrome only):
1. Enable Web Serial API in browser flags (if needed)
2. Application will prompt for scanner access
3. Select scanner from device list
4. Scanning controlled directly from application

*Note: Direct integration requires application development and scanner API support*

#### 4.4 Scanner Troubleshooting

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Scanner not detected | Driver issue | Reinstall TWAIN/WIA driver |
| Poor scan quality | Wrong settings | Increase DPI, check glass cleanliness |
| Large file sizes | High resolution | Reduce to 300 DPI, increase compression |
| Slow scanning | High resolution | Use 300 DPI instead of 600 |
| Color issues | Wrong color mode | Select full color, not grayscale |

---

### Phase 5: Testing & Validation

#### 5.1 Individual Device Testing

**Camera Test:**
- [ ] Capture clear photo of person
- [ ] Scan MRZ from passport (if feature enabled)
- [ ] Verify OCR correctly reads passport data
- [ ] Test in various lighting conditions

**Barcode Scanner Test:**
- [ ] Scan sample QR code
- [ ] Scan sample barcode (Code 128)
- [ ] Verify correct data appears in application
- [ ] Test auto-submit functionality

**Document Scanner Test:**
- [ ] Scan passport data page
- [ ] Verify image quality and readability
- [ ] Confirm file uploads successfully
- [ ] Check file size is reasonable (<2MB)

#### 5.2 End-to-End Workflow Testing

Test complete workflows that use multiple devices:

**Workflow 1: Individual Purchase**
1. Start new individual purchase
2. Capture passport photo with webcam
3. Scan passport MRZ for auto-fill (or manually enter)
4. Upload scanned passport page
5. Complete purchase
6. Verify all data saved correctly

**Workflow 2: Voucher Validation**
1. Navigate to Scan and Validate
2. Scan voucher barcode
3. Verify voucher information displays
4. Mark as validated
5. Confirm status updates in database

**Workflow 3: Bulk Upload Verification**
1. Process bulk upload
2. Scan individual vouchers from batch
3. Verify each matches expected data

#### 5.3 Performance Testing

- [ ] Camera captures in < 2 seconds
- [ ] Scanner reads barcodes in < 1 second
- [ ] Document upload completes in < 10 seconds
- [ ] No browser freezing or crashes
- [ ] Memory usage stable over extended use

---

## 5. Security Considerations

### 5.1 Physical Security

- Secure workstations in controlled areas
- Lock screens when unattended
- Store hardware securely when not in use
- Maintain inventory of all devices

### 5.2 Data Security

- Camera images may contain biometric data (photos)
- Scanned documents contain personal information (passport numbers, names)
- All data transmitted over HTTPS (encrypted)
- Data stored in Supabase with RLS policies

### 5.3 Access Control

- Only authorized users should have device access
- Application uses role-based access control
- Counter_Agent role: Can capture photos and scan
- Flex_Admin role: Can view all records
- Finance_Manager role: View-only access

### 5.4 Audit Trail

Application logs:
- Who captured each photo
- When documents were scanned
- Which user validated each voucher
- All database changes tracked

---

## 6. Maintenance & Support

### 6.1 Regular Maintenance

**Daily:**
- Clean camera lens
- Clean scanner glass
- Verify devices responding

**Weekly:**
- Check for driver updates
- Clear temporary scan folders
- Review error logs

**Monthly:**
- Full hardware inspection
- Firmware updates if available
- Performance benchmarking

### 6.2 Common Issues & Solutions

| Symptom | First Check | Escalation |
|---------|-------------|------------|
| Device not recognized | USB connection, try different port | Reinstall drivers |
| Poor image quality | Clean lens/glass, check settings | Hardware replacement |
| Intermittent failures | USB hub power, cable quality | Replace cables/hub |
| Browser permission errors | Reset browser permissions | Clear browser cache |
| Application errors | Check network connectivity | Contact application support |

### 6.3 Support Contacts

**Hardware Issues:**
- Vendor support (Logitech, Honeywell, etc.)
- On-site ICT support

**Application Issues:**
- Application support team
- Email: [TO BE FILLED]
- Phone: [TO BE FILLED]

**Network Issues:**
- Network/infrastructure team
- VPN/proxy support team

---

## 7. Implementation Checklist Summary

### Pre-Implementation
- [ ] Hardware procured and inventoried
- [ ] Drivers downloaded
- [ ] Network access verified
- [ ] User accounts created in application
- [ ] Training materials prepared

### Installation Day
- [ ] Physical hardware installation
- [ ] Driver installation
- [ ] OS permission configuration
- [ ] Browser permission configuration
- [ ] Individual device testing
- [ ] End-to-end workflow testing
- [ ] User training completed

### Post-Implementation
- [ ] Documentation updated with local details
- [ ] Support contacts distributed
- [ ] Backup hardware available
- [ ] Maintenance schedule established
- [ ] Success metrics defined

---

## 8. Appendix

### A. Browser Permission Reset Procedures

**Chrome - Reset All Permissions:**
1. Menu → Settings → Privacy and security
2. Site settings → View permissions and data stored across sites
3. Find eywademo.cloud → Click → Reset permissions

**Firefox - Reset All Permissions:**
1. Menu → Settings → Privacy & Security
2. Permissions section → Manage each permission type
3. Find eywademo.cloud → Remove

**Edge - Reset All Permissions:**
1. Menu → Settings → Cookies and site permissions
2. All sites → Find eywademo.cloud
3. Reset permissions

### B. Useful Commands

**Windows - Check USB Devices:**
```powershell
Get-PnpDevice -Class Camera
Get-PnpDevice -Class HIDClass
```

**macOS - Check USB Devices:**
```bash
system_profiler SPUSBDataType
```

**Linux - Check USB Devices:**
```bash
lsusb
ls /dev/video*
```

### C. Test URLs

- Application: https://eywademo.cloud
- Camera Test: https://webcamtests.com
- Barcode Generator: https://www.barcode-generator.org

### D. Supported Barcode Formats

| Format | Example Use | Characters |
|--------|-------------|------------|
| QR Code | Voucher validation | Up to 4,296 alphanumeric |
| Code 128 | Ticket numbers | Full ASCII |
| Code 39 | Simple IDs | A-Z, 0-9, some symbols |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | November 2025 | Development Team | Initial release |

---

*This document should be reviewed and updated whenever hardware models change or application features are modified.*
