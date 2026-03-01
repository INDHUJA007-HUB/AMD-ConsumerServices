import pdfplumber

with pdfplumber.open(r"c:\Users\MOULIKA\Downloads\33_UPHC_Address_details.pdf") as pdf:
    text = ""
    for page in pdf.pages:
        text += page.extract_text() + "\n"
    with open("pdf_text.txt", "w", encoding="utf-8") as f:
        f.write(text)
