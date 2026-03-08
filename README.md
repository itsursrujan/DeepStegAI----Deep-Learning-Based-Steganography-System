# DeepStegAI: Technical Synopsis & User Guide

DeepStegAI is a state-of-the-art steganography platform designed for secure information hiding and AI-driven detection. It bridges the gap between traditional bit-level embedding and modern deep learning steganalysis.

## 🛠️ Technology Stack
- **Core Engine**: Python 3.10+
- **Deep Learning**: PyTorch (SRM-CNN Architecture)
- **Web Interface**: Flask with Vanilla JS/CSS
- **Security**: AES-256 (GCM Mode) & SHA-256

---

## 🚀 Embedding Techniques

### 1. Standard LSB (Least Significant Bit)
Our LSB implementation uses a vectorized approach to hide data in the lowest bits of the RGB channels.
- **Capacity**: High (Up to 12.5% of the cover image size)
- **Speed**: Extremely Fast
- **Stealth**: Moderate (Susceptible to statistical analysis)

### 2. Adaptive Edge Embedding (Priority)
This method uses a Canny Edge Detection filter to identify high-variance regions (textures and edges). Data is only hidden in these complex areas where human vision and statistical scanners struggle to find anomalies.
- **Capacity**: Variable (Depends on image complexity)
- **Security**: High
- **Resilience**: Excellent against traditional Chi-square attacks.

---

## 🛡️ Security Features

### AES-256 Encryption
Every payload is encrypted using **AES-256** before embedding. Even if the steganography is detected, the data remains inaccessible without the correct password.

### Emergency Recovery Token
When you hide data with a password, the system generates a unique **Recovery Token**. 
- **Purpose**: Allows data extraction if the original password is forgotten.
- **Security**: Derived from the encryption salt and master key.

---

## 🤖 Steganalysis (AI Detection)
DeepStegAI features a built-in **SRM-CNN (Spatial Rich Model Convolutional Neural Network)**. 

### How it Works:
1. **High-Pass Filtering**: The model uses SRM filters to extract "noise" from the image.
2. **Feature Learning**: The CNN learns the statistical distribution of this noise.
3. **Probability Scoring**: Returns a confidence score (0-100%) indicating the likelihood of hidden content.

---

## 📖 User Instructions

### Hiding Data
1. Navigate to the **Hide Data** tab.
2. Upload a **Cover Image** (PNG recommended for lossless quality).
3. Upload the **Secret File** you wish to hide.
4. (Optional) Enter a password for double-layer protection.
5. Click **Encrypt & Embed**.

### Extracting Data
1. Navigate to the **Extract Data** tab.
2. Upload the **Stego Image**.
3. Enter the password used during embedding.
4. Click **Extract File**.

---

## ⚖️ Limitations & Best Practices
- **File Format**: Always use **PNG** for the final stego image. JPG compression will destroy the hidden bits.
- **Image Size**: Larger, textured images (e.g., landscapes) provide better security than small or solid-colored images.
- **Ethics**: This tool is designed for educational and secure communication purposes. Please use responsibly.

---
*Powered by DeepStegAI Research Group*
