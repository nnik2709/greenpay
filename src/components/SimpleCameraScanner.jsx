import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Flashlight, FlashlightOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Tesseract from 'tesseract.js';

/**
 * Simple Camera Scanner - Uses native HTML5 video/camera
 * Fallback for when html5-qrcode doesn't work
 */

// ISO 3166-1 alpha-3 country code to full country name mapping
// Used for converting MRZ nationality codes (BGR, USA, etc.) to full names
const ISO_COUNTRY_CODES = {
  'AFG': 'Afghanistan', 'ALB': 'Albania', 'DZA': 'Algeria', 'AND': 'Andorra',
  'AGO': 'Angola', 'ATG': 'Antigua and Barbuda', 'ARG': 'Argentina', 'ARM': 'Armenia',
  'AUS': 'Australia', 'AUT': 'Austria', 'AZE': 'Azerbaijan', 'BHS': 'Bahamas',
  'BHR': 'Bahrain', 'BGD': 'Bangladesh', 'BRB': 'Barbados', 'BLR': 'Belarus',
  'BEL': 'Belgium', 'BLZ': 'Belize', 'BEN': 'Benin', 'BTN': 'Bhutan',
  'BOL': 'Bolivia', 'BIH': 'Bosnia and Herzegovina', 'BWA': 'Botswana', 'BRA': 'Brazil',
  'BRN': 'Brunei', 'BGR': 'Bulgaria', 'BFA': 'Burkina Faso', 'BDI': 'Burundi',
  'CPV': 'Cabo Verde', 'KHM': 'Cambodia', 'CMR': 'Cameroon', 'CAN': 'Canada',
  'CAF': 'Central African Republic', 'TCD': 'Chad', 'CHL': 'Chile', 'CHN': 'China',
  'COL': 'Colombia', 'COM': 'Comoros', 'COG': 'Congo', 'CRI': 'Costa Rica',
  'HRV': 'Croatia', 'CUB': 'Cuba', 'CYP': 'Cyprus', 'CZE': 'Czech Republic',
  'DNK': 'Denmark', 'DJI': 'Djibouti', 'DMA': 'Dominica', 'DOM': 'Dominican Republic',
  'ECU': 'Ecuador', 'EGY': 'Egypt', 'SLV': 'El Salvador', 'GNQ': 'Equatorial Guinea',
  'ERI': 'Eritrea', 'EST': 'Estonia', 'ETH': 'Ethiopia', 'FJI': 'Fiji',
  'FIN': 'Finland', 'FRA': 'France', 'GAB': 'Gabon', 'GMB': 'Gambia',
  'GEO': 'Georgia', 'DEU': 'Germany', 'GHA': 'Ghana', 'GRC': 'Greece',
  'GRD': 'Grenada', 'GTM': 'Guatemala', 'GIN': 'Guinea', 'GNB': 'Guinea-Bissau',
  'GUY': 'Guyana', 'HTI': 'Haiti', 'HND': 'Honduras', 'HUN': 'Hungary',
  'ISL': 'Iceland', 'IND': 'India', 'IDN': 'Indonesia', 'IRN': 'Iran',
  'IRQ': 'Iraq', 'IRL': 'Ireland', 'ISR': 'Israel', 'ITA': 'Italy',
  'JAM': 'Jamaica', 'JPN': 'Japan', 'JOR': 'Jordan', 'KAZ': 'Kazakhstan',
  'KEN': 'Kenya', 'KIR': 'Kiribati', 'PRK': 'North Korea', 'KOR': 'South Korea',
  'KWT': 'Kuwait', 'KGZ': 'Kyrgyzstan', 'LAO': 'Laos', 'LVA': 'Latvia',
  'LBN': 'Lebanon', 'LSO': 'Lesotho', 'LBR': 'Liberia', 'LBY': 'Libya',
  'LIE': 'Liechtenstein', 'LTU': 'Lithuania', 'LUX': 'Luxembourg', 'MKD': 'North Macedonia',
  'MDG': 'Madagascar', 'MWI': 'Malawi', 'MYS': 'Malaysia', 'MDV': 'Maldives',
  'MLI': 'Mali', 'MLT': 'Malta', 'MHL': 'Marshall Islands', 'MRT': 'Mauritania',
  'MUS': 'Mauritius', 'MEX': 'Mexico', 'FSM': 'Micronesia', 'MDA': 'Moldova',
  'MCO': 'Monaco', 'MNG': 'Mongolia', 'MNE': 'Montenegro', 'MAR': 'Morocco',
  'MOZ': 'Mozambique', 'MMR': 'Myanmar', 'NAM': 'Namibia', 'NRU': 'Nauru',
  'NPL': 'Nepal', 'NLD': 'Netherlands', 'NZL': 'New Zealand', 'NIC': 'Nicaragua',
  'NER': 'Niger', 'NGA': 'Nigeria', 'NOR': 'Norway', 'OMN': 'Oman',
  'PAK': 'Pakistan', 'PLW': 'Palau', 'PAN': 'Panama', 'PNG': 'Papua New Guinea',
  'PRY': 'Paraguay', 'PER': 'Peru', 'PHL': 'Philippines', 'POL': 'Poland',
  'PRT': 'Portugal', 'QAT': 'Qatar', 'ROU': 'Romania', 'RUS': 'Russia',
  'RWA': 'Rwanda', 'KNA': 'Saint Kitts and Nevis', 'LCA': 'Saint Lucia',
  'VCT': 'Saint Vincent and the Grenadines', 'WSM': 'Samoa', 'SMR': 'San Marino',
  'STP': 'Sao Tome and Principe', 'SAU': 'Saudi Arabia', 'SEN': 'Senegal',
  'SRB': 'Serbia', 'SYC': 'Seychelles', 'SLE': 'Sierra Leone', 'SGP': 'Singapore',
  'SVK': 'Slovakia', 'SVN': 'Slovenia', 'SLB': 'Solomon Islands', 'SOM': 'Somalia',
  'ZAF': 'South Africa', 'SSD': 'South Sudan', 'ESP': 'Spain', 'LKA': 'Sri Lanka',
  'SDN': 'Sudan', 'SUR': 'Suriname', 'SWE': 'Sweden', 'CHE': 'Switzerland',
  'SYR': 'Syria', 'TWN': 'Taiwan', 'TJK': 'Tajikistan', 'TZA': 'Tanzania',
  'THA': 'Thailand', 'TLS': 'Timor-Leste', 'TGO': 'Togo', 'TON': 'Tonga',
  'TTO': 'Trinidad and Tobago', 'TUN': 'Tunisia', 'TUR': 'Turkey', 'TKM': 'Turkmenistan',
  'TUV': 'Tuvalu', 'UGA': 'Uganda', 'UKR': 'Ukraine', 'ARE': 'United Arab Emirates',
  'GBR': 'United Kingdom', 'USA': 'United States', 'URY': 'Uruguay', 'UZB': 'Uzbekistan',
  'VUT': 'Vanuatu', 'VAT': 'Vatican City', 'VEN': 'Venezuela', 'VNM': 'Vietnam',
  'YEM': 'Yemen', 'ZMB': 'Zambia', 'ZWE': 'Zimbabwe'
};

// MRZ Validation and Correction Helpers
const MRZ_WEIGHTS = [7, 3, 1];

/**
 * Calculates ICAO 9303 check digit
 * @param {string} str - The string to calculate check digit for
 * @returns {number} The check digit (0-9)
 */
const calculateCheckDigit = (str) => {
  let sum = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    let val = 0;
    if (char >= '0' && char <= '9') {
      val = parseInt(char, 10);
    } else if (char >= 'A' && char <= 'Z') {
      val = char.charCodeAt(0) - 65 + 10;
    } else if (char === '<') {
      val = 0;
    }
    sum += val * MRZ_WEIGHTS[i % 3];
  }
  return sum % 10;
};

/**
 * Fixes common OCR confusions for alphabetic fields
 */
const fixAlpha = (str) => {
  if (!str) return str;
  return str.toUpperCase()
    .replace(/0/g, 'O')
    .replace(/Q/g, 'O')
    .replace(/1/g, 'I')
    .replace(/2/g, 'Z')
    .replace(/5/g, 'S')
    .replace(/8/g, 'B')
    .replace(/[^A-Z]/g, ' ') // Keep it as spaces for name splitting
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Fixes common OCR confusions for numeric fields
 */
const fixNumeric = (str) => {
  if (!str) return str;
  return str.toUpperCase()
    .replace(/O/g, '0')
    .replace(/Q/g, '0')
    .replace(/D/g, '0')
    .replace(/N/g, '0')  // N can look like 0 with middle bar
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/E/g, '6')  // E can be misread from 6 in degraded images
    .replace(/T/g, '7')  // T looks like 7
    .replace(/V/g, '9')  // V upside-down looks like 9
    .replace(/A/g, '4')  // A can look like 4
    .replace(/[^0-9<]/g, '0'); // Default garbage to 0 in numeric fields
};

/**
 * Generic character substitution for known confusions
 */
const fixCommonConfusions = (str) => {
  if (!str) return str;
  return str.toUpperCase()
    .replace(/H/g, 'M') // Very common in MRZ
    .replace(/U/g, 'V')
    .replace(/K/g, 'R')
    .replace(/[^A-Z0-9<]/g, '<');
};

/**
 * Fixes common OCR confusions for alphanumeric fields (like Passport Number)
 */
const fixAlphaNumeric = (str) => {
  if (!str) return str;
  return str.toUpperCase()
    // Common letter-to-digit fixes for passport numbers
    .replace(/O/g, '0')
    .replace(/Q/g, '0')
    .replace(/D/g, '0')
    .replace(/I/g, '1')
    .replace(/L/g, '1')
    .replace(/Z/g, '2')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/G/g, '6')
    .replace(/T/g, '7')
    .replace(/[^A-Z0-9<]/g, '<');
};

const SimpleCameraScanner = ({ onScanSuccess, onClose, autoStart = false }) => {
  const { toast } = useToast();
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [mrzDetected, setMrzDetected] = useState(false);
  const [successBlink, setSuccessBlink] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const consecutiveDetectionsRef = useRef(0);
  const autoCaptureTriggeredRef = useRef(false);
  const hasAutoStartedRef = useRef(false);

  // Auto-start camera on mount if autoStart prop is true
  useEffect(() => {
    // #region agent log
    // #endregion
    
    if (autoStart && !hasAutoStartedRef.current && !isCameraActive && !capturedImage) {
      hasAutoStartedRef.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        // #region agent log
        // #endregion
        startCamera();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    // #region agent log
    // #endregion
    
    setCameraError(null);
    
    try {
      // Detect mobile device for optimized constraints
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // #region agent log
      // #endregion
      
      // Mobile-optimized constraints
      // iOS Safari requires simpler constraints
      let videoConstraints;
      
      if (isIOS) {
        // iOS Safari - simpler constraints work better
        videoConstraints = {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
      } else if (isMobile) {
        // Android - can handle more specific constraints
        videoConstraints = {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 }
        };
      } else {
        // Desktop - full resolution
        videoConstraints = {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        };
      }

      // #region agent log
      // #endregion

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      // #region agent log
      // #endregion

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Use different play approach for iOS
        if (isIOS) {
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('webkit-playsinline', 'true');
        }
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsCameraActive(true);
      
      // Reset auto-capture state
      consecutiveDetectionsRef.current = 0;
      autoCaptureTriggeredRef.current = false;

      // Check if flash/torch is supported
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities?.();
      if (capabilities?.torch) {
        setFlashSupported(true);
      }

      // Start MRZ detection after video is ready
      // Wait a bit for video to initialize
      setTimeout(() => {
        // #region agent log
        // #endregion
        console.log('Video ready check:', {
          videoWidth: videoRef.current?.videoWidth,
          videoHeight: videoRef.current?.videoHeight
        });
        startMrzDetection();
      }, 1000);

      toast({
        title: "Camera Active",
        description: "Align passport MRZ (2 lines at bottom) in the guide box",
        duration: 3000,
      });
    } catch (error) {
      // #region agent log
      // #endregion
      console.error('Camera error:', error);
      setCameraError(error.message);
      toast({
        title: "Camera Access Required",
        description: error.message || "Please allow camera access to scan passport",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsCameraActive(false);
    setMrzDetected(false);
    setIsFlashOn(false);
    
    // Reset auto-capture state
    consecutiveDetectionsRef.current = 0;
    autoCaptureTriggeredRef.current = false;
  };

  const toggleFlash = async () => {
    if (!stream || !flashSupported) return;

    try {
      const videoTrack = stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        advanced: [{ torch: !isFlashOn }]
      });
      setIsFlashOn(!isFlashOn);
    } catch (error) {
      console.error('Flash toggle error:', error);
      toast({
        title: "Flash Not Available",
        description: "Your device may not support camera flash",
        variant: "destructive",
      });
    }
  };

  // Real-time MRZ detection
  const startMrzDetection = () => {
    console.log('=== STARTING MRZ DETECTION ===');
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    // Reset auto-capture state to ensure fresh start
    consecutiveDetectionsRef.current = 0;
    autoCaptureTriggeredRef.current = false;
    console.log('Auto-capture state reset for new detection session');

    detectionIntervalRef.current = setInterval(() => {
      detectMrzInFrame();
    }, 400); // Check every 400ms (balanced speed and precision)

    console.log('MRZ detection interval started, ID:', detectionIntervalRef.current);
  };

  const detectMrzInFrame = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) {
      console.log('detectMrzInFrame skipped:', { hasVideo: !!videoRef.current, hasCanvas: !!canvasRef.current, isProcessing });
      return;
    }
    
    // Don't detect if auto-capture was already triggered
    if (autoCaptureTriggeredRef.current) {
      console.log('Auto-capture already triggered, skipping detection');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    if (!videoWidth || !videoHeight) return;

    // Sample the MRZ area - WIDER to capture full MRZ width
    const cropHeight = videoHeight * 0.25;  // Narrower height (MRZ is 2 lines)
    const cropWidth = videoWidth * 0.96;    // Much wider (was 0.9, now 0.96)
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = videoHeight * 0.375;      // Centered vertically

    // Draw small sample to canvas
    canvas.width = 200; // Small sample for quick analysis
    canvas.height = 60;

    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, 200, 60
    );

    // Analyze image data for MRZ-like patterns
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const hasHighContrast = analyzeImageForMrz(imageData);

    setMrzDetected(hasHighContrast);
    
    // Auto-capture logic: require 3 consecutive detections to prevent false positives
    if (hasHighContrast) {
      consecutiveDetectionsRef.current += 1;
      console.log('>>> MRZ DETECTED! Count:', consecutiveDetectionsRef.current, '/ 3 needed <<<');

      // Trigger after 3 consecutive detections (1200ms) - prevents false positives
      const shouldTrigger = consecutiveDetectionsRef.current >= 3 && !autoCaptureTriggeredRef.current;

      if (shouldTrigger) {
        console.log('=== AUTO-CAPTURE TRIGGERED ===');
        autoCaptureTriggeredRef.current = true;

        // Small delay for visual feedback before capture
        setTimeout(() => {
          console.log('Calling captureImage from auto-capture...');
          captureImage();
        }, 200);
      }
    } else {
      if (consecutiveDetectionsRef.current > 0) {
        console.log('MRZ lost, resetting counter from', consecutiveDetectionsRef.current);
      }
      // Reset counter on negative detection
      consecutiveDetectionsRef.current = 0;
    }
  };

  const analyzeImageForMrz = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let totalBrightness = 0;
    let darkPixels = 0;
    let brightPixels = 0;
    let edgeCount = 0;
    let horizontalEdges = 0; // Track horizontal edge transitions (text lines)

    // Analyze pixel brightness and edge detection
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += brightness;

      if (brightness < 80) darkPixels++;
      if (brightness > 220) brightPixels++;

      // Edge detection - check horizontal changes (text has lots of edges)
      if (i > 4 && i % (width * 4) !== 0) {
        const prevBrightness = (data[i-4] + data[i-3] + data[i-2]) / 3;
        if (Math.abs(brightness - prevBrightness) > 60) {
          edgeCount++;
        }
      }

      // Vertical edge detection - MRZ has 2 distinct horizontal text lines
      if (i >= width * 4) {
        const aboveBrightness = (data[i - width * 4] + data[i - width * 4 + 1] + data[i - width * 4 + 2]) / 3;
        if (Math.abs(brightness - aboveBrightness) > 80) {
          horizontalEdges++;
        }
      }
    }

    const totalPixels = data.length / 4;
    const avgBrightness = totalBrightness / totalPixels;
    const darkRatio = darkPixels / totalPixels;
    const brightRatio = brightPixels / totalPixels;
    const edgeRatio = edgeCount / totalPixels;
    const horizontalEdgeRatio = horizontalEdges / totalPixels;

    // MRZ detection - STRICT thresholds to prevent false positives
    // Real MRZ has very specific characteristics - be conservative
    const hasTextPattern = edgeRatio > 0.055; // STRICT - MRZ has very dense, regular text
    const hasGoodContrast = darkRatio > 0.08 && darkRatio < 0.22; // NARROW range - specific text density
    const hasGoodLighting = avgBrightness > 80 && avgBrightness < 220; // STRICT lighting requirements
    const hasTextLines = horizontalEdgeRatio > 0.020; // STRICT - must have clear 2-line structure

    // MRZ text density: VERY specific range for actual passport text
    const hasReasonableTextDensity = darkRatio > 0.09 && darkRatio < 0.20;

    // All conditions must be true for precise detection
    const detected = hasTextPattern && hasGoodContrast && hasGoodLighting && hasTextLines && hasReasonableTextDensity;

    // Log only when detection changes or every 5th check to reduce noise
    if (detected || Math.random() < 0.2) {
      console.log('MRZ Analysis:', {
        edgeRatio: edgeRatio.toFixed(3),
        darkRatio: darkRatio.toFixed(3),
        brightRatio: brightRatio.toFixed(3),
        horizontalEdgeRatio: horizontalEdgeRatio.toFixed(3),
        avgBrightness: avgBrightness.toFixed(1),
        hasTextPattern,
        hasGoodContrast,
        hasGoodLighting,
        hasTextLines,
        hasReasonableTextDensity,
        detected
      });
    }

    return detected;
  };

  // Parse MRZ text extracted from OCR
  const parseMRZ = (text) => {
    // #region agent log
    // #endregion
    try {
      console.log('=== ROBUST MRZ PARSING ===');
      console.log('Original OCR text:\n', text);

      // 1. Split into lines and clean
      const rawLines = text.split(/[\r\n]+/).map(l => l.toUpperCase().trim().replace(/[^A-Z0-9<]/g, ''));
      // #region agent log
      // #endregion
      console.log('Raw cleaned lines:', rawLines);

      let line1 = '', line2 = '';

      // 2. Identify Line 1 and Line 2
      let l1Index = -1;
      let l2Index = -1;

      // Better Line 1 Identification: Highest alpha density AND length ~44
      const scores = rawLines.map((l, idx) => {
        if (l.length < 30) return -1;
        const alphaCount = (l.match(/[A-Z]/g) || []).length;
        const digitCount = (l.match(/[0-9]/g) || []).length;
        const sepCount = (l.match(/<<|LK|KK|LL|CK|CC/g) || []).length;
        
        // Line 1 is mostly alpha, Line 2 has more digits
        const isLikelyL1 = alphaCount > digitCount && alphaCount > 15;
        const isLikelyL2 = digitCount > 10;
        
        return { idx, isLikelyL1, isLikelyL2, alphaCount, digitCount, sepCount, length: l.length };
      });

      l1Index = scores.findIndex(s => s.isLikelyL1);
      
      // If we found a candidate for L1, look for L2 among others
      if (l1Index !== -1) {
        l2Index = scores.findIndex(s => s.idx !== l1Index && s.isLikelyL2);
      } else {
        // Fallback: just pick the one with most alpha as L1
        const sortedByAlpha = [...scores].sort((a, b) => b.alphaCount - a.alphaCount);
        if (sortedByAlpha[0] && sortedByAlpha[0].alphaCount > 10) {
          l1Index = sortedByAlpha[0].idx;
          l2Index = scores.findIndex(s => s.idx !== l1Index && s.isLikelyL2);
        }
      }

      if (l1Index !== -1) {
        line1 = rawLines[l1Index];
        // Merge check
        if (line1.length > 60) {
          const merged = line1;
          line1 = merged.substring(0, 44);
          line2 = merged.substring(44, 88);
        }
      }

      if (!line2 && l2Index !== -1) {
        line2 = rawLines[l2Index];
      }

      // 3.5 Align Line 2
      // Line 2 often has garbage at start or misread prefixes. 
      // We use the Nationality code or the Passport Number check digit as anchors.
      if (line2) {
        // Find best shift (-5 to +5) that satisfies most check digits or aligns nationality
        let bestShift = 0;
        let maxScore = -1;

        for (let shift = -5; shift <= 5; shift++) {
          let score = 0;
          let tempL2 = shift > 0 ? line2.substring(shift) : ('<'.repeat(Math.abs(shift)) + line2);
          tempL2 = (tempL2 + '<'.repeat(44)).substring(0, 44);

          // Check Nationality (Anchor 1) - apply fixAlpha to handle common misreads like 8GR -> BGR
          const nat = fixAlpha(tempL2.substring(10, 13)).replace(/\s/g, '');
          if (ISO_COUNTRY_CODES[nat]) score += 10;

          // Check Passport CD (Anchor 2) - apply fixNumeric for accurate CD calculation
          const pNo = fixAlphaNumeric(tempL2.substring(0, 9));
          const pCD = parseInt(fixNumeric(tempL2[9]), 10);
          if (!isNaN(pCD) && calculateCheckDigit(pNo) === pCD) score += 5;

          // Check DOB CD (Anchor 3) - apply fixNumeric
          const dob = fixNumeric(tempL2.substring(13, 19));
          const dobCD = parseInt(fixNumeric(tempL2[19]), 10);
          if (!isNaN(dobCD) && calculateCheckDigit(dob) === dobCD) score += 5;

          if (score > maxScore) {
            maxScore = score;
            bestShift = shift;
          }
        }

        if (maxScore > 0 && bestShift !== 0) {
          console.log(`Alignment logic chose shift ${bestShift} with score ${maxScore}`);
          line2 = bestShift > 0 ? line2.substring(bestShift) : ('<'.repeat(Math.abs(bestShift)) + line2);
        }
      }

      // #region agent log
      // #endregion

      // #region agent log
      // #endregion

      // 4. Robust Line Repair
      // #region agent log
      // #endregion
      
      // Trim garbage prefixes (like NNP<, ECC<, or even single letters like AP<)
      if (line1) {
        const startMatch = line1.match(/[PAFRIB]<[A-Z]{3}/);
        if (startMatch) {
          line1 = line1.substring(startMatch.index);
        } else if (line1.includes('<<')) {
          // If no prefix but has separator, try to find the start of names
          // Most passports have 3-letter country code before names
          const firstAlpha = line1.match(/[A-Z]{3}/);
          if (firstAlpha && firstAlpha.index < line1.indexOf('<<')) {
             // Keep it as is or try to guess country code
          }
        }
      }
      
      // Standardize Line 1 prefix if misread
      if (line1 && line1.length > 2 && !line1.startsWith('P<')) {
        const secondChar = line1[1];
        if (secondChar === '<') {
           line1 = 'P<' + line1.substring(2);
        } else if (/^[A-Z]/.test(line1[0]) && /^[A-Z]/.test(line1[1])) {
           // Might be missing the < after P
           line1 = 'P<' + line1.substring(1);
        }
      }
      
      // Note: We previously tried to replace LK, LL, CC etc with << but this caused
      // false positives within names (e.g., NIKOLOVA becoming N<<OLOVA).
      // Now we rely on the smarter separator detection during name splitting instead.

      // Ensure length is 44
      line1 = (line1 + '<'.repeat(44)).substring(0, 44);
      line2 = (line2 + '<'.repeat(44)).substring(0, 44);

      // #region agent log
      // #endregion

      // #region agent log
      // #endregion

      console.log('Processed Line 1:', line1);
      console.log('Processed Line 2:', line2);

      if (!line1.startsWith('P<') || line2.length < 44) {
        throw new Error('Could not identify valid MRZ lines. Please try again with better alignment.');
      }

      // 5. Extract and Validate Fields (Line 2 first as it has check digits)
      // Line 2: 1-9: Passport, 10: CD, 11-13: Nationality, 14-19: DOB, 20: CD, 21: Sex, 22-27: Expiry, 28: CD, 29-42: Personal No, 43: CD, 44: Final CD
      
      // Passport Number (Pos 1-9) - Alphanumeric
      let rawPassport = fixAlphaNumeric(line2.substring(0, 9));
      let passportNumber = rawPassport.replace(/</g, '');
      const passportCD = parseInt(line2[9], 10);
      
      const initialPassportCD = calculateCheckDigit(rawPassport);
      // #region agent log
      // #endregion

      // Try validating passport number with potential OCR fixes
      if (initialPassportCD !== passportCD) {
        console.warn('Passport CD mismatch. Attempting fixes...');
        // Try fixing O/0 confusion which is very common
        const variants = [
          rawPassport.replace(/0/g, 'O'),
          rawPassport.replace(/O/g, '0'),
          fixCommonConfusions(rawPassport)
        ];
        
        for (const variant of variants) {
          if (calculateCheckDigit(variant) === passportCD) {
            passportNumber = variant.replace(/</g, '');
            console.log('Fixed passport number via variant validation:', passportNumber);
            break;
          }
        }
      }

      // Nationality (Pos 11-13) - remove any spaces that fixAlpha might add
      let nationalityCode = fixAlpha(line2.substring(10, 13)).replace(/\s/g, '');
      // Common issuing/nationality fixes
      if (nationalityCode === 'B6R') nationalityCode = 'BGR';
      if (nationalityCode === 'DHK') nationalityCode = 'DNK'; // Denmark common error
      if (nationalityCode === 'PHG') nationalityCode = 'PNG'; // PNG common error

      // Date of Birth (Pos 14-19)
      let dobRaw = fixNumeric(line2.substring(13, 19));
      let dobCD = parseInt(line2[19], 10);
      const initialDobCD = calculateCheckDigit(dobRaw);
      // #region agent log
      // #endregion
      if (initialDobCD !== dobCD) {
        console.warn('DOB CD mismatch. Attempting fixes...');
        const variants = [
          dobRaw.replace(/0/g, 'O').replace(/O/g, '0'), // Swap 0/O
          dobRaw.replace(/1/g, 'I').replace(/I/g, '1'), // Swap 1/I
          dobRaw.replace(/5/g, 'S').replace(/S/g, '5'), // Swap 5/S
          fixNumeric(dobRaw)
        ];
        for (const v of variants) {
          if (calculateCheckDigit(v) === dobCD) {
            dobRaw = v;
            console.log('Fixed DOB via CD validation');
            break;
          }
        }
      }

      // Sex (Pos 21)
      let sexChar = line2[20];
      if (sexChar === 'H' || sexChar === '4' || sexChar === 'N') sexChar = 'M';
      if (sexChar === 'P' || sexChar === 'E' || sexChar === '3') sexChar = 'F';
      const sex = (sexChar === 'M') ? 'Male' : (sexChar === 'F' ? 'Female' : 'Unspecified');

      // Expiry Date (Pos 22-27)
      let expiryRaw = fixNumeric(line2.substring(21, 27));
      let expiryCD = parseInt(line2[27], 10);
      if (calculateCheckDigit(expiryRaw) !== expiryCD) {
        console.warn('Expiry CD mismatch. Attempting fixes...');
        const variants = [
          expiryRaw.replace(/0/g, 'O').replace(/O/g, '0'),
          expiryRaw.replace(/1/g, 'I').replace(/I/g, '1'),
          expiryRaw.replace(/5/g, 'S').replace(/S/g, '5'),
          fixNumeric(expiryRaw)
        ];
        for (const v of variants) {
          if (calculateCheckDigit(v) === expiryCD) {
            expiryRaw = v;
            console.log('Fixed Expiry via CD validation');
            break;
          }
        }
      }

      // 6. Extract Name (Line 1)
      // Line 1: 1-2: P<, 3-5: Issuing Country, 6-44: Names
      const issuingCountry = fixAlpha(line1.substring(2, 5));
      let nameSection = line1.substring(5);

      // #region agent log
      // #endregion

      // Fix common OCR separator errors
      // Note: Removed LK, KK, LL, CC patterns as they cause false positives within names
      // Only look for actual << or very close single-char variations
      const separatorPatterns = [/<</, /K</, /<K/];
      
      let surname = '';
      let givenNamesRaw = '';
      let foundSeparator = false;

      // Step 1: Find << or variants in a reasonable position (index 3-20)
      for (const pattern of separatorPatterns) {
        const match = nameSection.match(pattern);
        if (match && match.index >= 3 && match.index <= 20) {
          surname = nameSection.substring(0, match.index);
          givenNamesRaw = nameSection.substring(match.index + match[0].length);
          console.log('Split name at detected separator:', match[0], 'at index', match.index);
          foundSeparator = true;
          break;
        }
      }

      // Step 2: If no << found, try single < in reasonable position (common when << is misread as X<)
      if (!foundSeparator) {
        const singleFillerMatch = nameSection.match(/</);
        if (singleFillerMatch && singleFillerMatch.index >= 3 && singleFillerMatch.index <= 15) {
          surname = nameSection.substring(0, singleFillerMatch.index);
          givenNamesRaw = nameSection.substring(singleFillerMatch.index + 1).replace(/^<+/, '');
          console.log('Split name at single < separator at index', singleFillerMatch.index);
          foundSeparator = true;
        }
      }

      // Step 3: Fallback - try any << position
      if (!foundSeparator) {
        for (const pattern of separatorPatterns) {
          const match = nameSection.match(pattern);
          if (match) {
            surname = nameSection.substring(0, match.index);
            givenNamesRaw = nameSection.substring(match.index + match[0].length);
            console.log('Split name at fallback separator:', match[0], 'at index', match.index);
            foundSeparator = true;
            break;
          }
        }
      }

      // Step 4: Final fallback - no separator found at all
      if (!foundSeparator) {
        const firstFiller = nameSection.indexOf('<');
        if (firstFiller !== -1) {
          surname = nameSection.substring(0, firstFiller);
          givenNamesRaw = nameSection.substring(firstFiller + 1).replace(/^<+/, '');
        } else {
          surname = nameSection.substring(0, Math.min(12, nameSection.length));
          givenNamesRaw = nameSection.substring(surname.length);
        }
      }

      // #region agent log
      // #endregion

      // Clean up names
      const cleanName = (name, isSurname = false) => {
        // Replace digits with fillers
        let cleaned = name.replace(/[0-9]/g, '<'); 
        
        // Use fixAlpha first to clean up non-letters
        let result = fixAlpha(cleaned).trim();

        // Fix for surnames/names incorrectly ending in S due to misread filler <
        // In MRZ, < often looks like S, C, or E
        if (result.endsWith('S') || result.endsWith('C') || result.endsWith('E')) {
          if (result.length > 5) {
            // Only strip if it's a long name, to avoid stripping actual short names like "LEE"
            if (result.endsWith('S') || (result.endsWith('C') && !result.endsWith('IC'))) {
               console.log('Stripping suspected trailing filler misread from:', result);
               result = result.substring(0, result.length - 1);
            }
          }
        }

        return result;
      };

      surname = cleanName(surname, true);
      
      // Fix < that was likely misread from K in the middle of names
      // Only replace < with K when the part before < is very short (1-3 chars)
      // because real names are typically 4+ characters
      // e.g., NI<GLAY -> NIKGLAY (NI is too short to be a complete name)
      // but DELIANA<GEORGIEVA stays (DELIANA is a complete name)
      let fixedGivenNamesRaw = givenNamesRaw;
      
      console.log('=== NAME FIX V2 === Input:', givenNamesRaw);
      
      // Split by < and analyze each segment
      const segments = fixedGivenNamesRaw.split('<');
      console.log('Segments:', segments);
      const repairedSegments = [];
      
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.length === 0) continue;
        
        // If this segment is very short (1-3 chars) and there's a next segment,
        // the < between them was likely a misread K - merge them
        const nextSeg = segments[i + 1];
        const shouldMerge = seg.length <= 3 && i < segments.length - 1 && nextSeg && nextSeg.length > 0;
        console.log(`Segment ${i}: "${seg}" (len=${seg.length}), next="${nextSeg}", shouldMerge=${shouldMerge}`);
        
        if (shouldMerge) {
          const merged = seg + 'K' + nextSeg;
          console.log(`Merging: "${seg}" + K + "${nextSeg}" = "${merged}"`);
          repairedSegments.push(merged);
          i++; // Skip the next segment since we merged it
        } else {
          repairedSegments.push(seg);
        }
      }
      
      fixedGivenNamesRaw = repairedSegments.join('<');
      console.log('Fixed given names raw:', fixedGivenNamesRaw);
      
      let givenName = cleanName(fixedGivenNamesRaw);

      // #region agent log
      // #endregion

      // Final garbage check: handles merged words like "STOYANOVRLGROCECTCENCS"
      const namePartsArr = givenName.split(' ');
      const cleanedPartsArr = [];
      
      for (let i = 0; i < namePartsArr.length; i++) {
        let part = namePartsArr[i];
        if (part.length < 2) continue;
        
        // Strip trailing S, C, E from each name part (common misreads of <)
        if (part.length > 5 && (part.endsWith('S') || part.endsWith('C'))) {
          console.log('Stripping trailing filler misread from name part:', part);
          part = part.substring(0, part.length - 1);
        }
        
        // Heuristic: If part is long and has very few vowels, it's likely garbage
        const vowels = (part.match(/[AEIOUY]/g) || []).length;
        const vowelRatio = vowels / part.length;
        
        // Much stricter checks for 3rd and 4th name parts
        if (i >= 2) {
          // Trailing noise is often vowel-rich but repetitive (like AEECESESIE)
          const repeats = part.match(/(.)\1{2,}/); // 3+ identical chars
          const repetitiveVowels = part.match(/[AEIOUY]{4,}/); // 4+ vowels in a row
          
          if (repeats || repetitiveVowels) {
            console.log('Rejecting repetitive trailing name part as noise:', part);
            continue;
          }

          // Trailing noise is usually short (2-4 chars) and vowel-poor
          if (part.length <= 4 && vowels < 2) {
            console.log('Rejecting short trailing name part as noise:', part);
            continue;
          }
          // Unnatural vowel ratio for names
          if (vowelRatio < 0.35 || vowelRatio > 0.9) { // Relaxed slightly from 0.4
            console.log('Rejecting unnatural vowel ratio trailing part:', part);
            continue;
          }
        }

        if (part.length > 10 && vowelRatio < 0.15) { // Relaxed from 8 and 0.2
          console.log('Rejecting name part as garbage (extreme low vowel ratio):', part);
          continue;
        }

        // Check for sudden vowel-less suffix which indicates a merger
        // We look for a VERY clear consonant cluster (4+) at the end of a long word
        const vowelEndMatch = part.match(/[AEIOUY][^AEIOUY]{4,}$/); 
        if (vowelEndMatch && part.length > 10) { // Only for long words
           const cutIndex = vowelEndMatch.index + 1;
           console.log('Truncating merged name part:', part, 'at', cutIndex);
           cleanedPartsArr.push(part.substring(0, cutIndex));
           // Don't break anymore, just keep the truncated part and continue
        } else {
           cleanedPartsArr.push(part);
        }
      }
      
      // Only take the first given name to avoid noise from trailing garbage
      // Skip parts that are too short (1-2 chars) as they're likely corrupted (e.g., K misread as <)
      let firstValidName = '';
      for (const part of cleanedPartsArr) {
        if (part.length >= 3) {
          firstValidName = part;
          break;
        }
      }
      givenName = firstValidName; 

      // #region agent log
      // #endregion

      // 7. Final Date Parsing
      const parseDate = (raw, isExpiry = false) => {
        if (!/^[0-9]{6}$/.test(raw)) return '';
        let year = parseInt(raw.substring(0, 2), 10);
        const monthNum = parseInt(raw.substring(2, 4), 10);
        const dayNum = parseInt(raw.substring(4, 6), 10);
        
        // Basic validation
        if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
          console.warn(`Invalid date components: month=${monthNum}, day=${dayNum}. Date raw=${raw}`);
          return '';
        }

        const month = raw.substring(2, 4);
        const day = raw.substring(4, 6);
        
        const currentYear = new Date().getFullYear() % 100;
        if (isExpiry) {
          year += 2000; // Expiry is always in future
        } else {
          year += (year > currentYear + 1) ? 1900 : 2000;
        }
        return `${year}-${month}-${day}`;
      };

      const dateOfBirth = parseDate(dobRaw);
      const dateOfExpiry = parseDate(expiryRaw, true);

      const nationalityFullName = ISO_COUNTRY_CODES[nationalityCode] || nationalityCode;

      const result = {
        passportNumber,
        surname,
        givenName,
        nationality: nationalityFullName,
        dateOfBirth,
        sex,
        dateOfExpiry,
        mrzConfidence: 'high' // Based on CD matches (could be calculated)
      };

      console.log('Parsed Result:', result);
      return result;

    } catch (error) {
      console.error('MRZ parsing failed:', error);
      throw new Error(error.message);
    }
  };

  const processImageWithOCR = async (rawImageDataUrl, processedImageDataUrl = rawImageDataUrl) => {
    console.log('=== STARTING OCR PROCESSING ===');
    setIsProcessing(true);
    setOcrProgress(0);

    // Helper: Try Server-Side OCR (Python/PaddleOCR)
    // Uses RAW image for better AI OCR results
    const tryServerOCR = async (imageDataUrl) => {
      try {
        console.log('=== ATTEMPTING SERVER-SIDE OCR (Python/PaddleOCR) ===');

        toast({
          title: "🚀 High-Precision Scan",
          description: "Using advanced AI OCR (PaddleOCR)...",
        });

        // Convert data URL to Blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();

        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', blob, 'passport.jpg');

        // Call backend OCR endpoint
        const ocrResponse = await fetch('/api/ocr/scan-mrz', {
          method: 'POST',
          body: formData,
        });

        const result = await ocrResponse.json();

        // Debug: Log complete server response
        console.log('=== FULL SERVER OCR RESPONSE ===');
        console.log('Success:', result.success);
        console.log('Full result object:', JSON.stringify(result, null, 2));
        console.log('Full result.data:', result.data);
        console.log('result.data type:', typeof result.data);
        console.log('result.data keys:', result.data ? Object.keys(result.data) : 'null');
        console.log('Passport number field:', result.data?.passportNumber);
        console.log('Document number field:', result.data?.documentNumber);
        console.log('Confidence:', result.data?.confidence);

        if (!result.success) {
          console.warn('Server OCR failed:', result.error);
          throw new Error(result.error || 'Server OCR failed');
        }

        // Check if server OCR actually found valid MRZ data
        // Try both passportNumber and documentNumber field names
        const passportNum = result.data.passportNumber || result.data.documentNumber || result.data.passport_number;

        if (!passportNum || result.data.confidence < 0.5) {
          console.warn('Server OCR returned no valid MRZ data or low confidence:', result.data.confidence);
          console.warn('Passport number value:', passportNum);
          throw new Error('No valid MRZ detected by server OCR');
        }

        console.log('Server OCR SUCCESS:', result.data);
        console.log('Confidence:', (result.data.confidence * 100).toFixed(1) + '%');
        console.log('Processing time:', result.processingTime + 'ms');

        // Transform server response to match expected format
        // Convert 3-letter nationality code to full country name
        const nationalityCode = result.data.nationality;
        const nationalityFullName = ISO_COUNTRY_CODES[nationalityCode] || nationalityCode;

        return {
          passportNumber: passportNum, // Use the validated passport number
          surname: result.data.surname,
          givenName: result.data.givenName || result.data.given_name,
          nationality: nationalityFullName,
          dateOfBirth: result.data.dateOfBirth || result.data.date_of_birth,
          sex: result.data.sex === 'M' ? 'Male' : (result.data.sex === 'F' ? 'Female' : 'Unspecified'),
          dateOfExpiry: result.data.dateOfExpiry || result.data.date_of_expiry,
          mrzConfidence: result.data.confidence >= 0.95 ? 'high' : (result.data.confidence >= 0.85 ? 'medium' : 'low'),
          source: 'server-ocr',
          confidence: result.data.confidence
        };

      } catch (error) {
        console.error('Server OCR error:', error);
        throw error;
      }
    };

    // Helper: Try Client-Side OCR (Tesseract.js)
    // Uses PROCESSED image (binarized) for better Tesseract results
    const tryClientOCR = async (psmMode = Tesseract.PSM.SINGLE_BLOCK, imageUrl = processedImageDataUrl) => {
      console.log(`=== FALLBACK: CLIENT-SIDE OCR (Tesseract) PSM: ${psmMode} ===`);
      return await Tesseract.recognize(
        imageUrl,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<P',
          tessedit_pageseg_mode: psmMode,
          tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
          preserve_interword_spaces: '0',
          tessjs_create_hocr: '0',
          tessjs_create_tsv: '0',
        }
      );
    };

    try {
      let passportData;
      let ocrSource = 'unknown';

      // Strategy 1: Try Server-Side OCR First (Python/PaddleOCR)
      // Use RAW image for better results with AI OCR
      try {
        passportData = await tryServerOCR(rawImageDataUrl);
        ocrSource = 'server-paddleocr';

        toast({
          title: "✅ Passport Scanned",
          description: `${passportData.givenName} ${passportData.surname}`,
          className: "bg-green-50 border-green-200",
          duration: 3000,
        });

      } catch (serverError) {
        console.warn('Server OCR failed, falling back to Tesseract.js:', serverError.message);
        console.error('Server error details:', serverError.message);

        // Strategy 2: Fallback to Client-Side OCR (Tesseract.js)
        toast({
          title: "⏳ Processing Passport",
          description: "Scanning passport data...",
        });

        let result;
        let extractedText;

        try {
          // Pass 1: Try with Single Block (Standard for MRZ)
          // Use PROCESSED image (binarized) for Tesseract
          result = await tryClientOCR(Tesseract.PSM.SINGLE_BLOCK, processedImageDataUrl);
          extractedText = result.data.text;
          passportData = parseMRZ(extractedText);
          ocrSource = 'client-tesseract-pass1';

        } catch (parseError) {
          console.warn('First pass parsing failed, trying Pass 2 (Sparse Text)...');
          toast({
            title: "🔄 Retrying...",
            description: "Adjusting OCR parameters for better accuracy...",
          });

          // Pass 2: Try with Sparse Text (Better if lines are slightly misaligned)
          result = await tryClientOCR(Tesseract.PSM.SPARSE_TEXT, processedImageDataUrl);
          extractedText = result.data.text;
          passportData = parseMRZ(extractedText);
          ocrSource = 'client-tesseract-pass2';
        }

        toast({
          title: "✅ Passport Scanned",
          description: `${passportData.givenName} ${passportData.surname}`,
          className: "bg-blue-50 border-blue-200",
          duration: 3000,
        });
      }

      console.log('=== OCR SUCCESS ===');
      console.log('Source:', ocrSource);
      console.log('Passport Data:', passportData);
      console.log('Calling onScanSuccess with:', JSON.stringify(passportData, null, 2));

      setSuccessBlink(true);
      setTimeout(() => setSuccessBlink(false), 500);

      // Auto-fill the form
      setTimeout(() => {
        console.log('About to call onScanSuccess callback...');
        onScanSuccess(passportData);
        console.log('onScanSuccess callback called successfully');
      }, 800);

    } catch (error) {
      console.error('OCR/Parse ERROR (both methods failed):', error);
      toast({
        title: "Scan Failed",
        description: error.message || "Could not read MRZ. Please try again with better lighting.",
        variant: "destructive",
        duration: 5000,
      });

      setIsProcessing(false);
      setOcrProgress(0);
    }

    setIsProcessing(false);
    setOcrProgress(0);
  };

  const captureImage = () => {
    console.log('=== CAPTURE IMAGE CALLED ===');
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    console.log('Video dimensions:', videoWidth, 'x', videoHeight);

    // Calculate MRZ crop area - WIDER to capture full MRZ width
    const cropHeight = videoHeight * 0.25;  // Narrower height (MRZ is 2 lines, was 0.3)
    const cropWidth = videoWidth * 0.96;    // Much wider (was 0.9, now 0.96)
    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = videoHeight * 0.375;      // Centered vertically (was 0.35)

    console.log('Crop area:', { cropX, cropY, cropWidth, cropHeight });

    // Set canvas to cropped size
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Draw only the MRZ region
    context.drawImage(
      video,
      cropX, cropY, cropWidth, cropHeight,  // Source rectangle (MRZ area)
      0, 0, cropWidth, cropHeight            // Destination rectangle (full canvas)
    );

    console.log('Image drawn to canvas');

    // Get RAW image data URL for server OCR (PaddleOCR works better with natural images)
    const rawImageDataUrl = canvas.toDataURL('image/jpeg', 0.98);
    console.log('Raw image data URL created for server OCR, length:', rawImageDataUrl.length);

    // Now apply preprocessing for potential Tesseract.js fallback
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // First pass: convert to grayscale and build histogram for Otsu
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = data[i + 1] = data[i + 2] = gray;
      histogram[gray]++;
    }

    // Apply sharpening BEFORE binarization to make edges more distinct
    const tempData = new Uint8ClampedArray(data);
    const width = canvas.width;
    const height = canvas.height;

    // Stronger sharpening kernel for OCR-B font
    const sharpenKernel = [
       0, -1,  0,
      -1,  5, -1,
       0, -1,  0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += tempData[idx] * sharpenKernel[kernelIdx];
          }
        }
        const idx = (y * width + x) * 4;
        const val = Math.max(0, Math.min(255, sum));
        data[idx] = data[idx + 1] = data[idx + 2] = val;
      }
    }

    // Compute Otsu's Threshold for Binarization
    // This is much better than simple contrast stretching for Tesseract
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * histogram[i];
    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVar = 0;
    let threshold = 127;
    const total = data.length / 4;

    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;
      sumB += i * histogram[i];
      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;
      const varBetween = wB * wF * (mB - mF) * (mB - mF);
      if (varBetween > maxVar) {
        maxVar = varBetween;
        threshold = i;
      }
    }

    console.log('Otsu Threshold calculated:', threshold);

    // Apply Binarization (Thresholding)
    for (let i = 0; i < data.length; i += 4) {
      const val = data[i] > threshold ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = val;
    }

    console.log('Applied Otsu binarization and sharpening for Tesseract fallback');

    context.putImageData(imageData, 0, 0);

    // Get processed image data URL for Tesseract.js fallback
    const processedImageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    console.log('Processed image data URL created for Tesseract, length:', processedImageDataUrl.length);

    setCapturedImage(processedImageDataUrl);
    console.log('Captured image state set');

    stopCamera();
    console.log('Camera stopped');

    // Automatically process with OCR
    // Pass BOTH images: raw for server OCR, processed for Tesseract fallback
    console.log('Calling processImageWithOCR...');
    processImageWithOCR(rawImageDataUrl, processedImageDataUrl);
  };

  const handleManualEntry = () => {
    toast({
      title: "Manual Entry",
      description: "Please fill in the passport details manually",
    });
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Scan Passport</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '50vh', maxHeight: '70vh' }}>
        {!isCameraActive && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            {cameraError ? (
              <>
                <div className="text-red-400 mb-4 text-center">
                  <X className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold">Camera Access Failed</p>
                  <p className="text-sm mt-2">{cameraError}</p>
                </div>
                <p className="text-sm text-gray-400 text-center">
                  Please enable camera access in your browser settings
                </p>
              </>
            ) : autoStart ? (
              <>
                <Loader2 className="w-12 h-12 mb-4 animate-spin text-emerald-400" />
                <p className="text-center">Starting camera...</p>
              </>
            ) : (
              <>
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-center">Tap "Start Camera" to scan passport</p>
              </>
            )}
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          webkit-playsinline="true"
          muted
          className={`w-full h-auto ${isCameraActive ? 'block' : 'hidden'}`}
          style={{ maxHeight: '70vh', objectFit: 'cover' }}
        />

        {/* MRZ Guide Overlay - shown when camera is active */}
        {isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Success blink animation overlay */}
            {successBlink && (
              <div
                className="absolute inset-0 bg-green-500 animate-pulse z-50"
                style={{
                  animation: 'successBlink 0.5s ease-in-out',
                  opacity: 0.7
                }}
              />
            )}

            {/* MRZ Guide Box - WIDER to capture full MRZ */}
            <div className="relative z-10" style={{ width: '96%', height: '25%' }}>
              {/* Guide rectangle - changes color when MRZ detected or success */}
              <div
                className={`absolute inset-0 border-4 rounded-lg transition-all duration-300 ${
                  successBlink
                    ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,1)]'
                    : mrzDetected
                    ? 'border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.6)]'
                    : 'border-emerald-400'
                }`}
                style={{
                  boxShadow: successBlink
                    ? '0 0 0 9999px rgba(0, 0, 0, 1), 0 0 30px rgba(34, 197, 94, 1)'
                    : mrzDetected
                    ? '0 0 0 9999px rgba(0, 0, 0, 1), 0 0 20px rgba(34, 197, 94, 0.6)'
                    : '0 0 0 9999px rgba(0, 0, 0, 1)',
                  background: successBlink
                    ? 'rgba(34, 197, 94, 0.3)'
                    : mrzDetected ? 'rgba(34, 197, 94, 0.1)' : 'transparent'
                }}
              >
                {/* Corner markers */}
                <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />
                <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />
                <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 transition-colors ${
                  mrzDetected ? 'border-green-400' : 'border-emerald-400'
                }`} />

                {/* Instructions */}
                <div className="absolute -top-16 left-0 right-0 text-center">
                  <p className={`text-white text-sm font-bold px-4 py-2 rounded-lg inline-block transition-all shadow-lg ${
                    mrzDetected ? 'bg-green-500 animate-pulse scale-110' : 'bg-slate-700'
                  }`}>
                    {mrzDetected ? 'READY - TAP CAPTURE NOW!' : 'Hold 15-20cm away • Fit FULL MRZ width'}
                  </p>
                </div>

                {/* MRZ line guides */}
                <div className="absolute inset-0 flex flex-col justify-center px-4">
                  <div className={`border-t-2 border-dashed opacity-70 mb-2 transition-colors ${
                    mrzDetected ? 'border-green-300' : 'border-emerald-300'
                  }`} />
                  <div className={`border-t-2 border-dashed opacity-70 transition-colors ${
                    mrzDetected ? 'border-green-300' : 'border-emerald-300'
                  }`} />
                </div>
              </div>
            </div>

            {/* Flash Toggle Button - pointer-events-auto to make it clickable */}
            {flashSupported && (
              <div className="absolute top-4 right-4 pointer-events-auto">
                <button
                  onClick={toggleFlash}
                  className={`p-3 rounded-full transition-colors ${
                    isFlashOn
                      ? 'bg-yellow-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {isFlashOn ? (
                    <Flashlight className="w-6 h-6" />
                  ) : (
                    <FlashlightOff className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured passport"
            className="w-full h-auto"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
          />
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        {!isCameraActive && !capturedImage && (
          <Button
            onClick={() => {
              setCameraError(null);
              hasAutoStartedRef.current = false;
              startCamera();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg"
            disabled={isProcessing}
          >
            <Camera className="w-5 h-5 mr-2" />
            {cameraError ? 'Retry Camera' : 'Start Camera'}
          </Button>
        )}

        {isCameraActive && (
          <>
            <Button
              onClick={captureImage}
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg"
              disabled={isProcessing}
            >
              Capture Now
            </Button>
            <Button
              onClick={stopCamera}
              variant="outline"
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </>
        )}

        {capturedImage && !isProcessing && (
          <>
            <Button
              onClick={handleManualEntry}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Continue with Manual Entry
            </Button>
            <Button
              onClick={() => {
                setCapturedImage(null);
                autoCaptureTriggeredRef.current = false;
                consecutiveDetectionsRef.current = 0;
                startCamera();
              }}
              variant="outline"
              className="w-full"
            >
              Retake Photo
            </Button>
          </>
        )}
      </div>

      {/* OCR Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-center font-semibold mb-2">Reading Passport...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-slate-600 mt-2">{ocrProgress}%</p>
          </div>
        </div>
      )}

      {/* Manual Entry Option */}
      <div className="border-t pt-4">
        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full"
          disabled={isProcessing}
        >
          Skip Camera - Enter Details Manually
        </Button>
      </div>
    </div>
  );
};

export default SimpleCameraScanner;
