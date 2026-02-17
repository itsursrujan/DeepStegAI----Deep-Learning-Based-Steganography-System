# DeepStegAI: Code & Logic Explanation

This document provides a detailed, human-readable explanation of how DeepStegAI works under the hood. It explains where data is stored, how it is encrypted, and how the detection system operates.

---

## 1. Where is the data stored? (LSB Steganography)

We do **not** store the hidden data in a separate database or file. Instead, the data is physically embedded **inside the pixels** of the cover image itself.

### The Concept: Least Significant Bit (LSB)
Every image is made up of pixels. Each pixel has 3 color channels: Red, Green, and Blue (RGB).
Each channel is a number from 0 to 255, which is 8 bits in binary (e.g., `10110011`).

The **Least Significant Bit (LSB)** is the last bit (the one on the far right).
*   If you change `1011001**1**` (179) to `1011001**0**` (178), the color change is so tiny that the human eye cannot see it.

### Our Process
1.  We take your secret file (e.g., "secret.txt").
2.  We convert it into a long string of 0s and 1s (bits).
3.  We walk through every pixel of the cover image.
4.  We replace the LSB of the Red, Green, and Blue values with the bits from your secret file.

**Result:** The image looks exactly the same, but it now carries your file inside its pixel values.

---

## 2. How is data Encrypted and Decrypted?

Before we hide your file, we encrypt it so that even if someone extracts the bits, they can't read them without the password.

### Encryption (AES-256)
We use the **Advanced Encryption Standard (AES)**, which is the same standard used by banks and governments.

1.  **Key Derivation (PBKDF2)**:
    *   The user types a password (e.g., "mypassword").
    *   We don't use this password directly. We run it through a process called **PBKDF2** (Password-Based Key Derivation Function 2).
    *   This mixes the password with a "salt" (random data) and hashes it 480,000 times.
    *   **Why?** This makes it impossible for hackers to use "rainbow tables" or simple dictionary attacks to guess the key.
    *   **Output:** A 32-byte (256-bit) secure key.

2.  **Encryption (Fernet)**:
    *   We use the **Fernet** system (built on top of AES).
    *   Fernet takes the 32-byte key and the secret data.
    *   It encrypts the data and adds a timestamp and an integrity check (HMAC).
    *   **Output:** A garbled string of bytes that looks like nonsense.

### Decryption
1.  The user provides the password.
2.  We regenerate the 32-byte key using the same PBKDF2 process.
3.  Fernet tries to unlock the data with this key.
4.  If the key is correct, the original data is returned. If not, it fails securely.

---

## 3. The Header Structure

To know *how much* data to read back, we add a "Header" at the very beginning of the hidden data.

| Part | Size | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Magic** | 4 bytes | `DSAI` | Tells us "This image was created by DeepStegAI". |
| **Mode** | 1 byte | `1` or `2` | Tells us if the data is encrypted (2) or plain (1). |
| **Length** | 4 bytes | Integer | Tells us the exact size of the hidden file in bytes. |

**Total Header Size:** 9 Bytes.

---

## 4. Code Walkthrough

### `stego_engine.py` (The Core)
*   **`embed_payload_into_image`**:
    *   Flattens the image into a 1D array.
    *   Calculates if the image is big enough.
    *   Uses bitwise operations (`& 0xFE` to clear, `| bit` to set) to modify the LSBs.
*   **`extract_payload_from_image`**:
    *   Reads the first 72 bits (9 bytes) to find the Header.
    *   Checks for the `DSAI` signature.
    *   Reads the `Length` from the header.
    *   Reads exactly that many bytes from the rest of the image.

### `crypto_utils.py` (The Vault)
*   **`_derive_key`**: Handles the slow, secure hashing of your password.
*   **`aes_encrypt` / `aes_decrypt`**: Wrappers around the cryptography library to make locking/unlocking data easy.

### `detection_engine.py` (The Scanner)
*   **`scan_image_for_signature`**:
    *   This is what powers the "Detect" tab.
    *   It doesn't need to read the whole image.
    *   It just peeks at the first 32 pixels.
    *   If the LSBs spell out `DSAI`, it knows instantly (100% confidence) that the image contains hidden data.

---

## 5. Summary of Flow

1.  **User Uploads:** Cover Image + Secret File + Password.
2.  **Encryption:** `crypto_utils` turns Secret File -> Encrypted Bytes.
3.  **Header:** We prepend `DSAI` + Length to the Encrypted Bytes.
4.  **Embedding:** `stego_engine` writes these bytes into the Cover Image's LSBs.
5.  **Result:** User gets a "Stego Image" (PNG).

**To Recover:**
1.  **User Uploads:** Stego Image + Password.
2.  **Extraction:** `stego_engine` reads Header -> Reads Encrypted Bytes.
3.  **Decryption:** `crypto_utils` unlocks Encrypted Bytes -> Original File.
4.  **Result:** User gets their file back!
