"""
PaddleOCR Engine for MRZ Detection and Text Extraction

This module wraps PaddleOCR to detect and extract MRZ text from passport images.
"""
import logging
import sys
from typing import Tuple, Optional
import numpy as np
from paddleocr import PaddleOCR
from app.config import settings

# Configure logger to output to stderr (always visible)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stderr)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('[%(asctime)s] [OCR_ENGINE] %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class OCREngine:
    """
    PaddleOCR wrapper for MRZ text extraction from passport images.

    Features:
    - Automatic MRZ region detection
    - Text extraction with confidence scores
    - GPU acceleration support (optional)
    - Image preprocessing for better accuracy
    """

    def __init__(self):
        """Initialize PaddleOCR engine"""
        logger.info("Initializing PaddleOCR engine...")

        try:
            self.ocr = PaddleOCR(
                use_angle_cls=False,  # Disabled - MRZ is always horizontal (saves 10+ seconds)
                lang=settings.OCR_LANG,
                use_gpu=False,  # No GPU available
                show_log=False,  # Suppress PaddleOCR logs
                det_db_score_mode='slow',  # Better accuracy for small text
                rec_batch_num=1  # Process one line at a time (more stable on CPU)
            )
            logger.info("PaddleOCR engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {str(e)}")
            raise

    def extract_mrz(self, image: np.ndarray) -> Tuple[Optional[str], float]:
        """
        Extract MRZ text from passport image.

        Args:
            image: NumPy array of passport image (BGR format from OpenCV)

        Returns:
            Tuple of (mrz_text, confidence_score)
            - mrz_text: 88-character MRZ string (2 lines × 44 chars) or None if not found
            - confidence: Average confidence score (0.0 to 1.0)

        Example:
            >>> mrz_text, confidence = ocr_engine.extract_mrz(image)
            >>> print(f"MRZ: {mrz_text}, Confidence: {confidence:.2f}")
        """
        try:
            # Run OCR on entire image
            result = self.ocr.ocr(image, cls=False)

            if not result or not result[0]:
                logger.warning("No text detected in image")
                return None, 0.0

            # Extract all detected text lines with confidence scores
            detected_lines = []
            for line in result[0]:
                text = line[1][0]  # Detected text
                confidence = line[1][1]  # Confidence score
                detected_lines.append((text, confidence))

            logger.info(f"=== PADDLEOCR DETECTED {len(detected_lines)} TEXT LINES ===")
            for i, (text, conf) in enumerate(detected_lines):
                logger.info(f"  Line {i+1}: '{text}' (confidence: {conf:.2f})")

            # Find MRZ lines (typically last 2-3 lines, all uppercase, contains '<')
            mrz_candidates = self._filter_mrz_candidates(detected_lines)

            if not mrz_candidates:
                logger.warning("No MRZ-like text detected")
                return None, 0.0

            # Combine MRZ lines and calculate average confidence
            mrz_text, avg_confidence = self._combine_mrz_lines(mrz_candidates)

            logger.info(f"MRZ extracted with {avg_confidence:.2%} confidence")
            return mrz_text, avg_confidence

        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            return None, 0.0

    def _filter_mrz_candidates(self, detected_lines: list) -> list:
        """
        Filter detected text lines to find MRZ candidates.

        MRZ characteristics (STRICT validation):
        - Line 1: Starts with P< (passport type), has country code, has names with <<
        - Line 2: Starts with passport number (alphanumeric), has dates (6 digits each)
        - Both: ~44 characters, contains '<', alphanumeric only
        """
        candidates = []

        for text, confidence in detected_lines:
            # Clean text (remove spaces, convert to uppercase)
            cleaned = text.replace(" ", "").replace(",", "").upper()

            # Basic checks (must pass these first)
            is_reasonable_length = 30 <= len(cleaned) <= 50
            is_alphanumeric = all(c.isalnum() or c == "<" for c in cleaned)
            has_separator = "<" in cleaned

            if not (is_reasonable_length and is_alphanumeric and has_separator):
                continue

            # Score this candidate (higher = more likely to be MRZ)
            score = 0

            # MRZ Line 1 indicators:
            # - Starts with P< (passport document type)
            # - OCR sometimes misses the < and reads PBGR instead of P<BGR
            if cleaned.startswith("P<"):
                score += 50
                logger.debug(f"Line starts with P<: +50 score")
            elif cleaned.startswith("P") and len(cleaned) >= 4 and cleaned[1:4].isalpha():
                # Likely P<BGR read as PBGR (missing separator)
                score += 45  # Slightly lower score but still strong indicator
                logger.debug(f"Line starts with P + 3 letters (likely P<BGR): +45 score")

            # - Has 3-letter country code after P< (positions 2-5)
            if len(cleaned) >= 5 and cleaned[2:5].isalpha():
                score += 20
                logger.debug(f"Has country code: +20 score")

            # - Has double separators << (indicates name field separator)
            if "<<" in cleaned:
                score += 15
                logger.debug(f"Has << separator: +15 score")

            # MRZ Line 2 indicators:
            # - Contains digits (passport number, dates)
            digit_count = sum(1 for c in cleaned if c.isdigit())
            if digit_count >= 15:  # Line 2 has passport#(9) + DOB(6) + expiry(6) = 21+ digits
                score += 40
                logger.debug(f"Has {digit_count} digits: +40 score")
            elif digit_count >= 8:  # Some digits, likely line 2
                score += 20
                logger.debug(f"Has {digit_count} digits: +20 score")

            # - Detect date patterns (YYMMDD format, 6 consecutive digits)
            import re
            date_patterns = re.findall(r'\d{6}', cleaned)
            if len(date_patterns) >= 2:  # Line 2 has DOB + expiry
                score += 30
                logger.debug(f"Has {len(date_patterns)} date patterns: +30 score")

            # - Check if contains common nationality codes
            common_countries = ['BGR', 'USA', 'GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'AUS', 'CAN', 'JPN', 'CHN', 'IND']
            for country in common_countries:
                if country in cleaned:
                    score += 25
                    logger.debug(f"Contains country code {country}: +25 score")
                    break

            # REJECT if score too low (likely just a name or random text)
            if score < 30:
                logger.debug(f"Rejected (score {score}): {cleaned[:30]}...")
                continue

            # Add to candidates with score
            candidates.append((cleaned, confidence, score))
            logger.info(f"MRZ candidate (score={score}): {cleaned[:30]}... (confidence: {confidence:.2f})")

        # Sort by score (highest first), then by confidence
        candidates = sorted(candidates, key=lambda x: (x[2], x[1]), reverse=True)

        # Return as (text, confidence) tuples (drop score)
        return [(text, conf) for text, conf, score in candidates]

    def _combine_mrz_lines(self, candidates: list) -> Tuple[str, float]:
        """
        Combine MRZ candidate lines into final 88-character MRZ.

        ICAO 9303 standard: 2 lines × 44 characters each
        - Line 1: P<ISSUINGCOUNTRYSURNAME<<GIVENNAMES
        - Line 2: PASSPORTNUMBER<NATIONALITY<DOB<SEX<EXPIRY<PERSONALNUMBER
        """
        if not candidates:
            return "", 0.0

        # Separate Line 1 and Line 2 candidates
        line1_candidates = []
        line2_candidates = []

        for text, conf in candidates:
            # Line 1 starts with P< (or PBGR if < is missing) and has mostly letters
            # OCR sometimes reads P<BGR as PBGR (missing separator)
            if text.startswith("P<"):
                line1_candidates.append((text, conf))
            elif text.startswith("P") and len(text) >= 4 and text[1:4].isalpha():
                # Likely P<BGR read as PBGR
                line1_candidates.append((text, conf))
            # Line 2 has many digits (passport number, dates)
            else:
                digit_count = sum(1 for c in text if c.isdigit())
                if digit_count >= 8:  # Line 2 has ~21 digits
                    line2_candidates.append((text, conf))

        logger.info(f"Found {len(line1_candidates)} Line 1 candidates, {len(line2_candidates)} Line 2 candidates")

        # Try to get both lines
        if line1_candidates and line2_candidates:
            # Take best of each type
            line1_text, line1_conf = line1_candidates[0]
            line2_text, line2_conf = line2_candidates[0]

            logger.info(f"Selected Line 1: {line1_text[:30]}... (conf: {line1_conf:.2f})")
            logger.info(f"Selected Line 2: {line2_text[:30]}... (conf: {line2_conf:.2f})")

            # Normalize to exactly 44 characters each
            line1 = self._normalize_mrz_line(line1_text)
            line2 = self._normalize_mrz_line(line2_text)

            # Combine lines
            mrz_text = line1 + line2
            avg_confidence = (line1_conf + line2_conf) / 2

            return mrz_text, avg_confidence

        # Fallback: If we only have one type, try to use top 2 candidates
        elif len(candidates) >= 2:
            logger.warning("Could not separate Line 1 and Line 2, using top 2 candidates by length")
            sorted_candidates = sorted(candidates, key=lambda x: abs(len(x[0]) - 44))

            line1_text, line1_conf = sorted_candidates[0]
            line2_text, line2_conf = sorted_candidates[1]

            line1 = self._normalize_mrz_line(line1_text)
            line2 = self._normalize_mrz_line(line2_text)

            mrz_text = line1 + line2
            avg_confidence = (line1_conf + line2_conf) / 2

            return mrz_text, avg_confidence

        # Only one candidate found - incomplete scan
        elif len(candidates) == 1:
            logger.warning("Only one MRZ line detected (incomplete scan)")
            single_text, single_conf = candidates[0]
            mrz_text = self._normalize_mrz_line(single_text)
            return mrz_text, single_conf

        else:
            logger.error("No valid MRZ candidates found")
            return "", 0.0

    def _normalize_mrz_line(self, text: str) -> str:
        """
        Normalize MRZ line to exactly 44 characters.

        - Pad with '<' if too short
        - Truncate if too long
        - Fix common OCR errors in field separator positions
        """
        # Replace spaces with separators
        corrected = text.replace(" ", "<")

        # FIX: Line 1 sometimes missing < after P
        # OCR reads P<BGR as PBGR (missing separator)
        # Correct format: P<ISSUINGCOUNTRY...
        if corrected.startswith("P") and not corrected.startswith("P<"):
            # Check if next 3 chars are letters (country code)
            if len(corrected) >= 4 and corrected[1:4].isalpha():
                # Insert missing < after P
                corrected = "P<" + corrected[1:]
                logger.info(f"Fixed Line 1 format: inserted < after P (was {corrected[:5]}, now P<{corrected[2:5]})")

        # FIX: Line 2 often missing check digit separator
        # Correct format: PASSPORT#<NAT<DOB<SEX<EXP... (passport# = 9 chars, then <, then 3-letter NAT)
        # OCR sometimes reads: PASSPORT#XNAT... or PASSPORT##NAT... (misreads < or adds extra digit)
        # We need to find where the 3-letter nationality code starts and insert < before it

        if len(corrected) >= 13:
            # Check if this looks like Line 2 (starts with digits)
            if corrected[:9].replace('<', '').isdigit():  # First 9 chars should be passport number
                # Look for 3-letter nationality code (position should be 10-12 after inserting <)
                # Common patterns: BGR, USA, GBR, etc.
                # Strategy: Find where we have 2-3 consecutive UPPERCASE letters (nationality)
                # Handle cases like: 8GR, BGR, <BGR

                # List of known nationality codes to search for
                common_countries = ['BGR', 'USA', 'GBR', 'DEU', 'FRA', 'ITA', 'ESP', 'AUS', 'CAN', 'JPN', 'CHN', 'IND', 'RUS', 'TUR']

                nationality_pos = -1
                for country in common_countries:
                    pos = corrected.find(country)
                    if pos >= 9 and pos <= 13:  # Should be around position 10
                        nationality_pos = pos
                        logger.info(f"Found nationality code '{country}' at position {pos}")
                        break

                # If we found a nationality code and separator is missing
                if nationality_pos > 9 and corrected[9] != '<':
                    # Remove extra characters between pos 9 and nationality
                    corrected = corrected[:9] + '<' + corrected[nationality_pos:]
                    logger.info(f"Fixed Line 2 format: removed {nationality_pos-9} chars, inserted < at pos 9")
                elif nationality_pos == -1:
                    # Fallback: Look for any 3 consecutive letters
                    for i in range(9, min(14, len(corrected))):
                        if (i + 2 < len(corrected) and
                            corrected[i:i+3].isalpha() and
                            len(corrected[i:i+3]) == 3):
                            # Found 3 letters at position i
                            if i > 9 and corrected[9] != '<':
                                corrected = corrected[:9] + '<' + corrected[i:]
                                logger.info(f"Fixed Line 2 format (fallback): removed {i-9} chars, inserted < at pos 9")
                            break

        # Ensure exactly 44 characters
        if len(corrected) < 44:
            corrected = corrected.ljust(44, "<")
        elif len(corrected) > 44:
            corrected = corrected[:44]

        return corrected


# Singleton instance
_ocr_engine_instance: Optional[OCREngine] = None


def get_ocr_engine() -> OCREngine:
    """
    Get singleton OCREngine instance.

    This ensures only one PaddleOCR instance is created (saves memory).
    """
    global _ocr_engine_instance

    if _ocr_engine_instance is None:
        _ocr_engine_instance = OCREngine()

    return _ocr_engine_instance
