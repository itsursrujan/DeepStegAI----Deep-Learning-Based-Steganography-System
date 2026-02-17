from fpdf import FPDF

class ProjectPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 15)
        self.cell(0, 10, 'DeepStegAI Project Overview', 0, 1, 'C')
        self.ln(5)

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 8, title, 0, 1, 'L', 1)
        self.ln(4)

    def chapter_body(self, text):
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 6, text)
        self.ln()

    def add_bullet(self, text):
        self.set_font('Arial', '', 11)
        self.cell(10)
        self.cell(5, 6, chr(149), 0, 0)
        self.multi_cell(0, 6, text)
        self.ln(2)

pdf = ProjectPDF()
pdf.add_page()

# Section 1: Introduction
pdf.chapter_title("1. Project Mission & Introduction")
pdf.chapter_body("DeepStegAI is an advanced steganography and detection ecosystem. It bridges the gap between secure, undetectable communication and high-accuracy AI-based steganalysis. The project is designed as a modular platform that supports multiple embedding methods, high-grade encryption, and deep learning verification.")

# Section 2: Core Features
pdf.chapter_title("2. Key Features")

pdf.set_font('Arial', 'B', 11)
pdf.cell(0, 6, "Adaptive Edge Steganography (Stealth Mode):", 0, 1)
pdf.add_bullet("Uses Canny edge detection to find complex regions in an image.")
pdf.add_bullet("Variable bit rate: 3 bits/channel in edges, 1 bit/channel in smooth areas.")
pdf.add_bullet("Green channel MSB stability ensures extraction reliability.")

pdf.set_font('Arial', 'B', 11)
pdf.cell(0, 6, "Standard LSB Steganography (Capacity Mode):", 0, 1)
pdf.add_bullet("Sequential bit embedding for maximum data storage.")
pdf.add_bullet("Ideal for large payloads when stealth is secondary.")

pdf.set_font('Arial', 'B', 11)
pdf.cell(0, 6, "AI-Powered Steganalysis:", 0, 1)
pdf.add_bullet("Deep Learning model (StegoCNN) using Spatial Rich Models (SRM) kernels.")
pdf.add_bullet("High-pass filtering suppresses image content to reveal noise residuals.")
pdf.add_bullet("Statistical confidence scores for binary classification (Clean vs. Stego).")

# Section 3: Security
pdf.chapter_title("3. Security & Cryptography")
pdf.add_bullet("AES-256-CBC Encryption for all secret payloads.")
pdf.add_bullet("PBKDF2 Key Derivation with 480,000 rounds of hashing.")
pdf.add_bullet("Recovery Tokens generated per file for emergency access.")
pdf.add_bullet("Pseudo-random pixel shuffling to prevent statistical attacks.")

# Section 4: Tech Stack
pdf.chapter_title("4. Technical Stack")
# Simulating a table or list
pdf.chapter_body("Backend: Python, Flask, PyTorch, NumPy, OpenCV, Fernet (AES)")
pdf.chapter_body("Research UI: Streamlit (Advanced AI Analytics)")
pdf.chapter_body("Mobile Integration: Flutter / Dart (Cross-platform app)")
pdf.chapter_body("Design: HTML5, CSS (Glassmorphism), JavaScript")

# Section 5: Codebase Guide
pdf.chapter_title("5. Codebase Map")
pdf.add_bullet("adaptive_engine.py: Edge-based embedding logic.")
pdf.add_bullet("stego_engine.py: Core LSB and utility functions.")
pdf.add_bullet("crypto_utils.py: Encryption, decryption, and key derivation.")
pdf.add_bullet("steganalysis_model.py: Neural network architecture.")
pdf.add_bullet("web_app/: Flask application routes and UI templates.")

# Footer
pdf.set_y(-25)
pdf.set_font('Arial', 'I', 8)
pdf.cell(0, 10, 'DeepStegAI Teammate Onboarding Guide - Page ' + str(pdf.page_no()), 0, 1, 'C')

pdf.output("DeepStegAI_Project_Overview.pdf")
print("PDF generated successfully: DeepStegAI_Project_Overview.pdf")
