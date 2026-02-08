FROM python:3.10-slim

# Install system dependencies for OCR and PDF processing
# - tesseract-ocr: For text recognition
# - poppler-utils: For pdf conversion
# - libgl1 & libglib2.0-0: Required by OpenCV (used in pdf2docx) to fix "libGL.so.1" error
# - ghostscript: Required by ocrmypdf for PDF processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    poppler-utils \
    libgl1 \
    libglib2.0-0 \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment variables
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start command (using gunicorn for production)
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app", "--timeout", "120"]
