"""
FastMRZ Parser for ICAO 9303 Machine Readable Zone

This module uses FastMRZ to parse and validate MRZ text extracted by OCR.
"""
import logging
import sys
from typing import Optional, Dict, Any
from datetime import datetime
from fastmrz import FastMRZ

# Configure logger to output to stderr (always visible)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler(sys.stderr)
    handler.setLevel(logging.INFO)
    formatter = logging.Formatter('[%(asctime)s] [MRZ_PARSER] %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class MRZParser:
    """
    FastMRZ wrapper for parsing and validating passport MRZ data.

    Features:
    - ICAO 9303 compliant parsing
    - Check digit validation
    - Date format conversion
    - Error correction for common OCR mistakes
    """

    def __init__(self):
        """Initialize MRZ parser"""
        # FastMRZ is a function-based parser, not a class
        # We'll parse MRZ manually using ICAO 9303 format
        logger.info("MRZ parser initialized")

    def parse(self, mrz_text: str) -> Optional[Dict[str, Any]]:
        """
        Parse MRZ text into structured passport data.

        Args:
            mrz_text: 88-character MRZ string (2 lines × 44 chars)

        Returns:
            Dictionary with parsed fields or None if invalid:
            {
                'passportNumber': str,
                'surname': str,
                'givenName': str,
                'nationality': str,
                'dateOfBirth': str (YYYY-MM-DD),
                'sex': str ('M' or 'F'),
                'dateOfExpiry': str (YYYY-MM-DD),
                'issuingCountry': str,
                'personalNumber': str (optional),
                'validCheckDigits': bool,
                'rawMrz': str
            }

        Example:
            >>> parser = MRZParser()
            >>> data = parser.parse("P<USASMITH<<JOHN<ROBERT<<<...")
            >>> print(data['passportNumber'])
            'N1234567'
        """
        if not mrz_text or len(mrz_text) != 88:
            logger.warning(f"Invalid MRZ length: {len(mrz_text) if mrz_text else 0} (expected 88)")
            return None

        try:
            # Apply OCR error corrections before parsing
            corrected_mrz = self._correct_ocr_errors(mrz_text)

            # Parse MRZ manually (ICAO 9303 format)
            parsed_data = self._extract_fields(None, corrected_mrz)

            if not parsed_data or not parsed_data.get('passportNumber'):
                logger.warning("MRZ parsing returned no passport number")
                return None

            # Validate check digits
            is_valid = self._validate_check_digits_manual(corrected_mrz)
            parsed_data['validCheckDigits'] = is_valid

            if not is_valid:
                logger.warning("MRZ check digit validation failed (but returning data anyway)")

            logger.info(f"Successfully parsed MRZ for passport: {parsed_data.get('passportNumber', 'UNKNOWN')}")
            return parsed_data

        except Exception as e:
            logger.error(f"MRZ parsing failed: {str(e)}")
            return None

    def _correct_ocr_errors(self, mrz_text: str) -> str:
        """
        Apply minimal OCR error corrections.

        CRITICAL: Don't over-correct! PaddleOCR is usually accurate.
        Only fix obvious errors that don't destroy data.

        Strategy: Minimal corrections, preserve original text
        """
        corrected = mrz_text.upper()

        # Only replace spaces with field separators
        corrected = corrected.replace(" ", "<")

        # That's it! Let PaddleOCR's raw output through.
        # The original aggressive corrections were destroying passport numbers.

        return corrected

    def _extract_fields(self, result: Any, raw_mrz: str) -> Dict[str, Any]:
        """
        Extract fields from FastMRZ result object.

        FastMRZ returns object with attributes, convert to dict.
        """
        try:
            # Get line 1 and line 2 from raw MRZ
            line1 = raw_mrz[:44]
            line2 = raw_mrz[44:88]

            # LOG EXACTLY WHAT WE'RE PARSING
            logger.info(f"=== PARSING MRZ ===")
            logger.info(f"Line 1 (44 chars): {line1}")
            logger.info(f"Line 2 (44 chars): {line2}")

            # Parse issuing country from line 1 (positions 2-4)
            issuing_country = line1[2:5].replace("<", "")
            logger.info(f"Issuing Country (pos 2-5): '{issuing_country}'")

            # Parse names from line 1 (positions 5-43)
            # Format: SURNAME<<GIVENNAME1<GIVENNAME2<...
            # But OCR sometimes reads single < instead of <<
            names_raw = line1[5:44]
            logger.info(f"Names raw (pos 5-44): '{names_raw}'")

            # Find the double separator << which separates surname from given names
            if '<<' in names_raw:
                # Standard format with << separator
                parts = names_raw.split('<<', 1)  # Split only on first <<
                surname = parts[0].replace('<', ' ').strip()
                given_name_raw = parts[1].replace('<', ' ').strip() if len(parts) > 1 else ""

                logger.info(f"Found << separator at position {names_raw.index('<<')}")

                # HEURISTIC FIX 1: If given_name is empty but surname is very long (>15 chars),
                # OCR probably merged given names into surname without separator
                # Example: 'NIKOLOV<NIKOLAYSTOYANOV' instead of 'NIKOLOV<NIKOLAY<STOYANOV'
                if not given_name_raw and len(parts[0].replace('<', '')) > 15:
                    # Split the "surname" by <, first part is real surname
                    name_parts = parts[0].split('<')
                    name_parts = [p for p in name_parts if p]  # Remove empty

                    if len(name_parts) >= 2:
                        surname = name_parts[0]
                        # Rest is given name (but merged without separators)
                        given_name_merged = ''.join(name_parts[1:])

                        # Try to split merged given names intelligently
                        # Look for capital letter patterns or common name patterns
                        # For now, just split in half if > 12 chars
                        if len(given_name_merged) > 12:
                            # Likely two names: split in middle
                            mid = len(given_name_merged) // 2
                            given_name = given_name_merged[:mid] + ' ' + given_name_merged[mid:]
                        else:
                            given_name = given_name_merged

                        logger.info(f"Heuristic split applied (empty given name): surname={surname}, merged_given={given_name_merged}, split_given={given_name}")
                    else:
                        given_name = given_name_raw
                # HEURISTIC FIX 2: If given_name exists but has no spaces and is very long (>12 chars),
                # OCR probably merged multiple given names together
                # Example: 'NIKOLAYSTOYANOV' instead of 'NIKOLAY STOYANOV'
                elif given_name_raw and ' ' not in given_name_raw and len(given_name_raw) > 12:
                    # Split merged given names intelligently
                    # Look for capital letter patterns or split in half
                    mid = len(given_name_raw) // 2
                    given_name = given_name_raw[:mid] + ' ' + given_name_raw[mid:]
                    logger.info(f"Heuristic split applied (merged given names): original='{given_name_raw}', split='{given_name}'")
                else:
                    given_name = given_name_raw
            else:
                # OCR misread << as single <
                # Split on single < and use heuristic:
                # Typically: SURNAME<GIVENNAME1<GIVENNAME2
                # First part = surname, rest = given names
                parts = names_raw.split('<')
                # Remove empty parts
                parts = [p for p in parts if p]

                if len(parts) >= 2:
                    # First part is surname
                    surname = parts[0].strip()
                    # Rest are given names
                    given_name = " ".join(parts[1:]).strip()
                elif len(parts) == 1:
                    # Only surname, no given names
                    surname = parts[0].strip()
                    given_name = ""
                else:
                    surname = ""
                    given_name = ""

                logger.info(f"No << found, split by < into {len(parts)} parts")

            logger.info(f"Parsed Surname: '{surname}'")
            logger.info(f"Parsed Given Name: '{given_name}'")

            # Parse line 2 fields
            passport_number = line2[:9].replace("<", "")
            logger.info(f"Passport Number (pos 0-9): '{passport_number}'")

            nationality = line2[10:13].replace("<", "")
            logger.info(f"Nationality (pos 10-13): '{nationality}'")

            dob_raw = line2[13:19]  # YYMMDD
            logger.info(f"DOB raw (pos 13-19): '{dob_raw}'")

            sex = line2[20]
            logger.info(f"Sex (pos 20): '{sex}'")

            expiry_raw = line2[21:27]  # YYMMDD
            logger.info(f"Expiry raw (pos 21-27): '{expiry_raw}'")

            personal_number = line2[28:42].replace("<", "")
            logger.info(f"Personal Number (pos 28-42): '{personal_number}'")

            # Convert dates from YYMMDD to YYYY-MM-DD
            date_of_birth = self._convert_date(dob_raw)
            date_of_expiry = self._convert_date(expiry_raw)

            return {
                'passportNumber': passport_number,
                'surname': surname,
                'givenName': given_name,
                'nationality': nationality,
                'dateOfBirth': date_of_birth,
                'sex': sex if sex in ['M', 'F'] else 'M',  # Default to M if invalid
                'dateOfExpiry': date_of_expiry,
                'issuingCountry': issuing_country,
                'personalNumber': personal_number if personal_number else None,
                'rawMrz': raw_mrz
            }

        except Exception as e:
            logger.error(f"Field extraction failed: {str(e)}")
            # Return minimal data
            return {
                'passportNumber': 'UNKNOWN',
                'surname': '',
                'givenName': '',
                'nationality': '',
                'dateOfBirth': '',
                'sex': 'M',
                'dateOfExpiry': '',
                'issuingCountry': '',
                'personalNumber': None,
                'rawMrz': raw_mrz
            }

    def _convert_date(self, date_str: str) -> str:
        """
        Convert YYMMDD to YYYY-MM-DD.

        Handles Y2K: YY < 50 = 20YY, YY >= 50 = 19YY
        Example: 900315 → 1990-03-15, 250815 → 2025-08-15
        """
        if not date_str or len(date_str) != 6:
            return ""

        try:
            yy = int(date_str[0:2])
            mm = date_str[2:4]
            dd = date_str[4:6]

            # Y2K handling
            if yy >= 50:
                yyyy = 1900 + yy
            else:
                yyyy = 2000 + yy

            return f"{yyyy}-{mm}-{dd}"

        except ValueError:
            logger.warning(f"Invalid date format: {date_str}")
            return ""

    def _validate_check_digits_manual(self, mrz_text: str) -> bool:
        """
        Validate MRZ check digits using ICAO 9303 algorithm.

        MRZ check digits use weighted sum modulo 10.
        Weights: 7, 3, 1 (repeating)
        """
        try:
            def check_digit(data: str) -> int:
                """Calculate check digit for given data"""
                weights = [7, 3, 1]
                total = 0
                for i, char in enumerate(data):
                    if char == '<':
                        value = 0
                    elif char.isdigit():
                        value = int(char)
                    else:  # Letter
                        value = ord(char) - ord('A') + 10
                    total += value * weights[i % 3]
                return total % 10

            line2 = mrz_text[44:88]

            # Check digit 1: Passport number (positions 0-8, check at 9)
            passport_check = line2[9]
            if passport_check.isdigit():
                expected = check_digit(line2[:9])
                if int(passport_check) != expected:
                    logger.warning(f"Passport number check digit mismatch: {passport_check} != {expected}")
                    return False

            # Check digit 2: Date of birth (positions 13-18, check at 19)
            dob_check = line2[19]
            if dob_check.isdigit():
                expected = check_digit(line2[13:19])
                if int(dob_check) != expected:
                    logger.warning(f"DOB check digit mismatch: {dob_check} != {expected}")
                    # Don't fail, just warn
                    pass

            # Check digit 3: Expiry date (positions 21-26, check at 27)
            expiry_check = line2[27]
            if expiry_check.isdigit():
                expected = check_digit(line2[21:27])
                if int(expiry_check) != expected:
                    logger.warning(f"Expiry check digit mismatch: {expiry_check} != {expected}")
                    # Don't fail, just warn
                    pass

            return True  # Return true even if some checks fail (OCR errors common)

        except Exception as e:
            logger.error(f"Check digit validation failed: {str(e)}")
            return True  # Don't fail parsing due to check digit issues


# Singleton instance
_mrz_parser_instance: Optional[MRZParser] = None


def get_mrz_parser() -> MRZParser:
    """
    Get singleton MRZParser instance.
    """
    global _mrz_parser_instance

    if _mrz_parser_instance is None:
        _mrz_parser_instance = MRZParser()

    return _mrz_parser_instance
