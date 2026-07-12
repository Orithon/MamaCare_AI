import fitz  # PyMuPDF
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
from PIL import Image
import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()

        if not text.strip():
            # PDF might be scanned — try OCR on each page
            text = extract_text_from_pdf_via_ocr(file_bytes)

        return text.strip()
    except Exception as e:
        raise ValueError(f"Could not read PDF: {str(e)}")


def extract_text_from_pdf_via_ocr(file_bytes: bytes) -> str:
    """Fallback: render PDF pages as images and OCR them."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))
            text += pytesseract.image_to_string(img)
        doc.close()
        return text.strip()
    except Exception as e:
        return ""


def extract_text_from_image(file_bytes: bytes) -> str:
    """Extract text from an image using Tesseract OCR."""
    try:
        img = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        raise ValueError(f"Could not read image: {str(e)}")


def extract_text(file_bytes: bytes, content_type: str) -> str:
    """
    Route to correct extractor based on file content type.
    Supported: PDF, JPEG, PNG, WEBP
    """
    if content_type == "application/pdf":
        return extract_text_from_pdf(file_bytes)
    elif content_type in ["image/jpeg", "image/jpg", "image/png", "image/webp"]:
        return extract_text_from_image(file_bytes)
    else:
        raise ValueError(
            f"Unsupported file type: {content_type}. Please upload a PDF, JPG, or PNG."
        )
