import os
from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from pdf2docx import Converter
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
# Vercel and other serverless platforms have read-only filesystems, except for /tmp
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit

# Ensure upload directory exists (though tempdir should always exist)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_pdf_to_docx(pdf_path, docx_path):
    """
    Convert PDF to DOCX using pdf2docx.
    This handles native PDFs and some basic image-based ones if they have a text layer.
    """
import shutil
import ocrmypdf

def check_tesseract():
    """Check if Tesseract is available in the system PATH."""
    return shutil.which('tesseract') is not None

def convert_pdf_to_docx(pdf_path, docx_path):
    """
    Convert PDF to DOCX using pdf2docx, with optional OCR preprocessing.
    """
    try:
        # Step 1: Check for Tesseract and perform OCR if available
        # This handles scanned PDFs by adding a text layer
        if check_tesseract():
            try:
                # Create a temporary path for the OCR'd PDF
                ocr_pdf_path = pdf_path.replace('.pdf', '_ocr.pdf')
                
                # Run OCR
                # skip_text=True: If text is already present, don't redo OCR (saves time)
                # deskew=True: Straighten scanned pages
                ocrmypdf.ocr(pdf_path, ocr_pdf_path, skip_text=True, deskew=True)
                
                # Use the OCR'd file for certification
                pdf_path = ocr_pdf_path
                logger.info("OCR preprocessing completed successfully.")
            except ocrmypdf.exceptions.PriorOcrFoundError:
                 logger.info("Page already has text, skipping OCR.")
            except Exception as e:
                logger.warning(f"OCR preprocessing failed (proceeding with original): {str(e)}")
        else:
            logger.info("Tesseract not found. Skipping OCR preprocessing.")

        # Step 2: Convert to DOCX
        cv = Converter(pdf_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
        
        # Cleanup OCR temp file if it exists
        if 'ocr_pdf_path' in locals() and os.path.exists(ocr_pdf_path):
            try:
                os.remove(ocr_pdf_path)
            except:
                pass
                
        return True, "Success"
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}")
        return False, str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Create output filename
        docx_filename = os.path.splitext(filename)[0] + '.docx'
        docx_filepath = os.path.join(app.config['UPLOAD_FOLDER'], docx_filename)
        
        success, msg = convert_pdf_to_docx(filepath, docx_filepath)
        
        if success:
            return jsonify({
                'message': 'Conversion successful',
                'download_url': f'/download/{docx_filename}'
            })
        else:
            return jsonify({'error': f'Conversion failed: {msg}'}), 500
            
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
