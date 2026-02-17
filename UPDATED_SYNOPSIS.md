# DeepStegAI Documentation

**DeepStegAI** is a next-generation security tool that combines **Advanced Steganography** with **Deep Learning Analysis**. It allows you to hide sensitive data inside images using military-grade encryption and adaptive algorithms that resist detection.

---

## 🚀 Key Features

### 1. Adaptive Edge Steganography (High Stealth)
Unlike traditional tools that hide data sequentially (easy to detect), DeepStegAI finds the **edges and complex textures** in an image. It embeds your data only in these "busy" areas, making it invisible to both the human eye and standard statistical tools.

### 2. Deep Learning Steganalysis (AI Detection)
We include a "Red Team" module powered by specific Convolutional Neural Networks (**SRM-ConvNet**). You can scan any image to see if it contains hidden data.
*   **Clean Image:** ~0-40% Confidence
*   **Suspicious:** ~60-80% Confidence
*   **Confirmed Stego:** >99% Confidence

### 3. Military-Grade Security
*   **AES-256 Encryption:** Your data is encrypted *before* it touches the image.
*   **PBKDF2 Key Derivation:** We use 480,000 rounds of hashing to protect your password.

---

## 📖 User Guide

### How to Hide Data
1.  Go to the **Hide Data** tab.
2.  **Drag & Drop** your Cover Image (PNG/JPG).
3.  Upload the **Secret File** you want to hide.
4.  **Select Method:**
    *   *Standard LSB:* Best for large files (High Capacity).
    *   *Adaptive Edge:* Best for secrets you absolutely must protect (High Stealth).
5.  Set a **Password** (Highly Recommended).
6.  Click **Encrypt & Embed** to download your secure image.

### How to Extract Data
1.  Go to the **Extract Data** tab.
2.  Upload the **Stego Image**.
3.  Enter the **Password** used during embedding.
4.  Click **Extract**. The system will auto-detect the file type (PDF, TXT, IMG) and let you download it.

### Batch Processing
Need to process 50 images at once?
1.  Go to the **Batch** tab.
2.  Select **Batch Hide** or **Batch Extract**.
3.  Drag & drop multiple files.
4.  Download the results as a single **ZIP file**.

---

## 🛠️ Technical Architecture

For developers and researchers, here is how DeepStegAI works under the hood:

| Module | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5 / Glassmorphism | Custom "Cyberpunk" UI with real-time drag-and-drop. |
| **Backend** | Flask (Python) | RESTful API handling image processing streams. |
| **AI Model** | PyTorch (SRM-ConvNet) | Trained on the BOSSBase dataset to detect steganographic noise residuals. |
| **Crypto** | PyCryptodome | AES-256-CBC with PKCS7 padding. |

---

## ❓ FAQ

**Q: Why is the AI Confidence low for my file?**
A: If you embed a very small file (e.g., "hello world") into a large 4K image, the changes are statistically insignificant. The AI correctly identifies this as "low suspicion." As you hide more data, the confidence score increases.

**Q: Can I extract data without the password?**
A: **Yes, BUT only if you saved the Recovery Token.** When you hide data, we give you a unique Recovery Token. If you lose your password, you can use this token to unlock your file. If you lose both, the data is gone forever.

**Q: Does this work with JPEG?**
A: You can use JPEG as a *Cover* image, but the output *Stego* image will always be **PNG**. Saving as JPEG compresses the image and destroys the hidden data. Always keep stego images as PNG.
