"""
GreenPay MRZ OCR Microservice - FastAPI Application

High-precision passport MRZ scanning service using PaddleOCR and FastMRZ.
"""
import logging
import time
from typing import Optional
from io import BytesIO

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

from app.config import settings
from app.ocr_engine import get_ocr_engine
from app.mrz_parser import get_mrz_parser

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.VERSION,
    description="High-precision passport MRZ scanning service for GreenPay"
)

# CORS middleware (if enabled)
if settings.CORS_ENABLED:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["POST", "GET"],
        allow_headers=["*"],
    )

# Rate limiting (simple in-memory implementation)
request_counts = {}  # {ip: [(timestamp, count), ...]}


def check_rate_limit(request: Request) -> bool:
    """
    Simple rate limiting: 60 requests per minute per IP.

    Returns True if allowed, False if rate limit exceeded.
    """
    if not settings.RATE_LIMIT_ENABLED:
        return True

    client_ip = request.client.host
    current_time = time.time()

    # Clean old entries (older than 60 seconds)
    if client_ip in request_counts:
        request_counts[client_ip] = [
            (ts, count) for ts, count in request_counts[client_ip]
            if current_time - ts < 60
        ]

    # Count requests in last minute
    if client_ip not in request_counts:
        request_counts[client_ip] = []

    total_requests = sum(count for _, count in request_counts[client_ip])

    if total_requests >= settings.RATE_LIMIT_REQUESTS:
        return False

    # Add current request
    request_counts[client_ip].append((current_time, 1))
    return True


# Response models
class MRZResponse(BaseModel):
    """Successful MRZ scan response"""
    success: bool
    passportNumber: Optional[str] = None
    surname: Optional[str] = None
    givenName: Optional[str] = None
    nationality: Optional[str] = None
    dateOfBirth: Optional[str] = None
    sex: Optional[str] = None
    dateOfExpiry: Optional[str] = None
    issuingCountry: Optional[str] = None
    personalNumber: Optional[str] = None
    confidence: float
    validCheckDigits: Optional[bool] = None
    mrzText: Optional[str] = None
    processingTime: Optional[float] = None


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    error: str
    confidence: float = 0.0


@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns service status and version.
    """
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION
    }


@app.post("/scan-mrz", response_model=MRZResponse)
async def scan_mrz(request: Request, file: UploadFile = File(...)):
    """
    Scan passport image and extract MRZ data.

    Args:
        file: Image file (JPG, PNG) containing passport with MRZ

    Returns:
        MRZResponse with parsed passport data

    Raises:
        HTTPException:
            - 429: Rate limit exceeded
            - 400: Invalid file format or size
            - 422: No MRZ detected or parsing failed
            - 500: Internal server error
    """
    start_time = time.time()

    try:
        # Rate limiting
        if not check_rate_limit(request):
            logger.warning(f"Rate limit exceeded for {request.client.host}")
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )

        # Validate file size
        contents = await file.read()
        file_size = len(contents)

        if file_size > settings.MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_size} bytes")
            raise HTTPException(
                status_code=400,
                detail=f"File size ({file_size} bytes) exceeds maximum ({settings.MAX_FILE_SIZE} bytes)"
            )

        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            logger.warning(f"Invalid file type: {file.content_type}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Only images allowed."
            )

        # Convert to OpenCV image
        try:
            image = Image.open(BytesIO(contents))
            image_np = np.array(image)

            # Convert RGB to BGR (OpenCV format)
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            elif len(image_np.shape) == 2:
                # Grayscale image, convert to BGR
                image_np = cv2.cvtColor(image_np, cv2.COLOR_GRAY2BGR)

        except Exception as e:
            logger.error(f"Image conversion failed: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail=f"Failed to process image: {str(e)}"
            )

        # Extract MRZ text using PaddleOCR
        ocr_engine = get_ocr_engine()
        mrz_text, confidence = ocr_engine.extract_mrz(image_np)

        if not mrz_text:
            logger.warning("No MRZ detected in image")
            return MRZResponse(
                success=False,
                error="No MRZ detected in image",
                confidence=confidence,
                processingTime=time.time() - start_time
            )

        # Check confidence threshold
        if confidence < settings.OCR_CONFIDENCE_THRESHOLD:
            logger.warning(f"Low confidence: {confidence:.2%}")
            return MRZResponse(
                success=False,
                error=f"Low OCR confidence: {confidence:.2%}",
                confidence=confidence,
                mrzText=mrz_text,
                processingTime=time.time() - start_time
            )

        # Parse MRZ text
        mrz_parser = get_mrz_parser()
        parsed_data = mrz_parser.parse(mrz_text)

        if not parsed_data:
            logger.warning("MRZ parsing failed")
            return MRZResponse(
                success=False,
                error="Failed to parse MRZ data",
                confidence=confidence,
                mrzText=mrz_text,
                processingTime=time.time() - start_time
            )

        # Success!
        processing_time = time.time() - start_time
        logger.info(
            f"MRZ scan successful: {parsed_data['passportNumber']} "
            f"({confidence:.2%} confidence, {processing_time:.2f}s)"
        )

        return MRZResponse(
            success=True,
            passportNumber=parsed_data.get('passportNumber'),
            surname=parsed_data.get('surname'),
            givenName=parsed_data.get('givenName'),
            nationality=parsed_data.get('nationality'),
            dateOfBirth=parsed_data.get('dateOfBirth'),
            sex=parsed_data.get('sex'),
            dateOfExpiry=parsed_data.get('dateOfExpiry'),
            issuingCountry=parsed_data.get('issuingCountry'),
            personalNumber=parsed_data.get('personalNumber'),
            confidence=confidence,
            validCheckDigits=parsed_data.get('validCheckDigits'),
            mrzText=mrz_text,
            processingTime=processing_time
        )

    except HTTPException:
        # Re-raise HTTP exceptions (already formatted)
        raise

    except Exception as e:
        # Unexpected error
        logger.error(f"Unexpected error in scan_mrz: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Custom HTTP exception handler.

    Ensures all errors return consistent JSON format.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "confidence": 0.0
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler.

    Logs unexpected errors and returns 500.
    """
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "confidence": 0.0
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Initialize services on startup.

    Pre-loads OCR models to avoid cold-start delay on first request.
    """
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.VERSION}")
    logger.info(f"Listening on {settings.HOST}:{settings.PORT}")

    # Pre-initialize OCR engine (loads PaddleOCR models)
    logger.info("Pre-loading PaddleOCR models...")
    try:
        ocr_engine = get_ocr_engine()
        logger.info("PaddleOCR models loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load PaddleOCR models: {str(e)}")
        logger.warning("Service will continue, but first request may be slow")

    # Initialize MRZ parser
    try:
        mrz_parser = get_mrz_parser()
        logger.info("MRZ parser initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MRZ parser: {str(e)}")

    logger.info(f"{settings.SERVICE_NAME} started successfully")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup on shutdown.
    """
    logger.info(f"Shutting down {settings.SERVICE_NAME}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        workers=settings.WORKERS,
        log_level=settings.LOG_LEVEL.lower()
    )
