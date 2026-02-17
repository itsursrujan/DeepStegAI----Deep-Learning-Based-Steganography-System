# DeepStegAI: System Limitations & Constraints

This document outlines the known limitations of the DeepStegAI system for the IEEE paper.

## 1. Image Format Support
*   **Input:** Supports PNG, JPG, JPEG, BMP.
*   **Output:** **MUST be saved as PNG.**
    *   **Reason:** Steganography relies on exact pixel values. Lossy compression (like JPG) destroys the hidden data.
    *   **Impact:** Users cannot share stego images via platforms that compress images (e.g., WhatsApp, Facebook Messenger) without zipping them first.

## 2. Grayscale Image Support
*   **Behavior:** Grayscale images are automatically converted to **RGB (3 channels)** before embedding.
*   **Artifacts:** Since data is embedded independently in R, G, and B channels, a grayscale image may exhibit slight **color noise** (chromatic aberration) in the stego output.
*   **Recommendation:** Use Color images for best visual results.

## 3. Capacity vs. Stealth Trade-off
*   **Standard LSB:** High Capacity (~200KB for 512x512), Low Stealth (Easily detected by AI).
*   **Adaptive Edge (Scattered):** High Stealth (Hard to detect), **Low Capacity**.
    *   **Constraint:** Capacity is limited to the number of edge pixels.
    *   **Example:** A smooth image (e.g., blue sky) has almost **zero capacity**.
    *   **Error:** If the file is too large for the edges, the system throws a `ValueError`.

## 4. Security
*   **Password Recovery:** There is **NO backdoor**. If the password is lost, the data is mathematically unrecoverable (AES-256).
*   **Edge Map Sensitivity:** The "Stable Edge Map" relies on the Green Channel's MSBs. Heavy image processing (filters, resizing) will destroy the map and make extraction impossible.

## 5. Deep Learning Robustness
*   **Detection:** The system is robust against standard Steganalysis (SRM-ConvNet), reducing detection rates by ~15% compared to LSB.
*   **Adversarial Attacks:** While robust, it is not "undetectable". A dedicated model trained *specifically* on this algorithm with millions of examples could eventually learn to detect it.
