# backend/app/services/resume_service.py
import fitz  # PyMuPDF
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF file."""
    
    try:
        # Open PDF from bytes
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        
        full_text = ""
        
        # Loop through each page
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text = page.get_text()
            full_text += text + "\n"
        
        pdf_document.close()
        
        # Clean up the text
        full_text = full_text.strip()
        
        if not full_text:
            return "No text could be extracted from the PDF."
        
        return full_text
        
    except Exception as e:
        raise Exception(f"Failed to parse PDF: {str(e)}")


def clean_resume_text(text: str) -> str:
    """Clean and normalize resume text."""
    
    # Remove excessive whitespace
    lines = text.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if line:  # Skip empty lines
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)