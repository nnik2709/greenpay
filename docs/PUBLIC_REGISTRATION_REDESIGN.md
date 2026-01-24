# PublicRegistration.jsx Redesign Requirements

## User Requirements:
1. **Remove "MRZ Scanner" text** - Use "Passport Scanner" instead
2. **Camera scan at TOP** - Most prominent element
3. **Manual entry underneath** - Secondary option
4. **Auto-capture** - When entire MRZ zone detected in camera
5. **Remove ALL emoji** - No 🔍, ✨, etc.
6. **Remove AI/precision text** - No "High Precision AI", "Advanced Scanning", etc.

## New UI Structure:

```
┌─────────────────────────────────────────┐
│  [BIG GREEN BUTTON: Scan with Camera]  │  ← Prominent
│  "Point camera at passport photo page"  │
│  ─────────── or enter manually ────────  │  ← Divider
│                                          │
│  Passport Number: [_______] [Search]    │  ← Manual entry
│  Surname: [_______]                      │
│  Given Name: [_______]                   │
│  ...                                     │
└─────────────────────────────────────────┘
```

## Changes to SimpleCameraScanner:
- Add `autoCapture` prop (default: false)
- When autoCapture=true: Auto-capture when MRZ zone fills camera viewfinder
- Remove all "AI Powered", "High Precision" marketing text
- Simpler messages: "Scanning...", "Processing...", "Scan Complete"
