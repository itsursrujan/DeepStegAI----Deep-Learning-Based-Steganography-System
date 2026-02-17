# DeepStegAI: Project Overview & Features Guide

Welcome to the **DeepStegAI** team! This document provides a comprehensive overview of the project's architecture, features, and technical implementation.

---

## 1. Project Mission
**DeepStegAI** is designed to be a dual-layered steganography ecosystem. Our goal is to provide **ultra-secure data hiding** techniques that are resilient against modern steganalysis, while simultaneously building **state-of-the-art detection tools** powered by Deep Learning.

---

## 2. Core Features

### 🛡️ Advanced Steganography
We support two primary embedding methods:
1.  **Standard LSB (Least Significant Bit)**:
    *   **Focus**: High Capacity.
    *   **Mechanism**: Uses the last bit of each RGB channel to store data sequentially.
    *   **Use Case**: When you need to hide large files and detection is less of a concern.
2.  **Adaptive Edge-Based Steganography**:
    *   **Focus**: Maximum Stealth.
    *   **Mechanism**: Analyzes the image for "edges" and high-variance regions using a Canny filter. Data is only embedded in these complex areas where noise is less noticeable.
    *   **Variable Bit Rate**: Uses 3 bits/channel in edges and 1 bit/channel in smooth areas.
    *   **Stability**: Uses Green channel MSBs for edge detection to ensure the edge map remains identical before and after embedding.

### 🔐 Multi-Tier Security
*   **AES-256 Encryption**: All payloads are encrypted using industry-standard AES-256 before embedding.
*   **PBKDF2 Key Derivation**: User passwords are hashed 480,000 times with unique salts.
*   **Recovery Tokens**: A unique token is generated for every hidden file, allowing recovery even if the password is forgotten.
*   **Index Shuffling**: Pixel indices are pseudo-randomly shuffled using the recovery token as a seed, preventing statistical "first-pixel" attacks.

### 🕵️ Advanced Steganalysis (Detection)
*   **Signature Scan**: Instantly detects images created by DeepStegAI by looking for the `DSAI` or `ADPT` headers.
*   **StegoCNN (Deep Learning)**: A custom PyTorch model trained on the BOSSBase dataset. It uses **SRM (Spatial Rich Models)** kernels as high-pass filters to suppress image content and focus on "noise residuals" left by steganography.
*   **Bluff Logic**: If a signature is found, the system intelligently boosts the AI confidence score based on payload size to provide a realistic assessment.

---

## 3. Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Python / Flask | RESTful API for all processing magic. |
| **AI / ML** | PyTorch | Custom CNN with SRM pre-processing. |
| **Core Processing** | NumPy / OpenCV | High-performance image and bit manipulation. |
| **Mobile App** | Flutter (Dart) | Cross-platform app for mobile extraction. |
| **Frontend** | HTML5 / Vanilla CSS | "Cyberpunk" themed, glassmorphism UI. |
| **Research UI** | Streamlit | Dedicated dashboard for detailed AI probability maps. |

---

## 4. Codebase Navigation

*   `adaptive_engine.py`: The "brain" of our edge-based stealth algorithm.
*   `stego_engine.py`: Standard LSB logic and image capacity calculations.
*   `crypto_utils.py`: The "vault" handling all encryption and key management.
*   `steganalysis_model.py`: Architecture for the SRM-based Deep Learning detector.
*   `web_app/`: The consumer-facing Flask application.
*   `mobile_app/`: Source code for the Flutter mobile companion.
*   `run_tests.py`: Automated test suite for all 14+ modules.

---

## 5. Getting Started for New Teammates
1.  **Setup Environment**: Run `python -m venv .venv` and `pip install -r requirements.txt`.
2.  **Start the Backend**: Run `python web_app/app.py` and visit `http://localhost:5000`.
3.  **Run Tests**: Ensure everything is green by running `python run_tests.py --suite all`.
4.  **Explore the AI**: Check out `train_stego_model.py` to see how we train the detector.

---

*DeepStegAI: Secure the Silent.*
