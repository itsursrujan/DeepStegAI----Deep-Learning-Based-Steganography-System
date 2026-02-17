import cv2
import numpy as np
from PIL import Image
import os
import random
from crypto_utils import aes_encrypt, aes_decrypt, derive_key

# --- Constants ---
MAGIC_ADAPTIVE = b"ADPT"  # Unique signature for this method
MAGIC_ADAPTIVE_SIGNED = b"ADPS" # Signature for Signed payload
# Header: FnameLen (4) + PayloadLen (4) = 8 bytes (Magic is separate)
HEADER_LEN = 8

def get_stable_edge_map(img_pil: Image.Image) -> np.ndarray:
    """
    Generates a STABLE edge map that won't change after embedding.
    Uses Green Channel MSBs for stability.
    """
    img_arr = np.array(img_pil.convert("RGB"))
    gray_stable = img_arr[:, :, 1] & 0xF0
    edges = cv2.Canny(gray_stable, 100, 200)
    return edges

def embed_file_adaptive(cover_img: Image.Image, file_bytes: bytes, filename: str, password: str, signature: bytes = None) -> tuple[Image.Image, str]:
    """
    Embeds a file using HYBRID Adaptive Edge Steganography.
    Ultra-optimized version.
    """
    arr = np.array(cover_img.convert("RGB")).astype(np.uint8)
    h, w, _ = arr.shape
    
    # 1. Embed Magic Bits (Fast 1D view)
    flat_view = arr.ravel()
    magic_val = MAGIC_ADAPTIVE_SIGNED if signature else MAGIC_ADAPTIVE
    magic_bits = np.unpackbits(np.frombuffer(magic_val, dtype=np.uint8))
    flat_view[:32] = (flat_view[:32] & 0xFE) | magic_bits
    
    # 2. Get Edge Map and Shuffled Indices
    edges_flat = get_stable_edge_map(cover_img).ravel()
    valid_indices = np.arange(11, h * w)
    
    # 3. Prepare Payload Bits
    filename_bytes = filename.encode('utf-8')
    encrypted_data, recovery_token = aes_encrypt(file_bytes, password)
    
    header = len(filename_bytes).to_bytes(4, 'big') + len(encrypted_data).to_bytes(4, 'big')
    if signature:
        header += len(signature).to_bytes(4, 'big')
    
    payload_data = header + filename_bytes + encrypted_data
    if signature: payload_data += signature
    
    bits = np.unpackbits(np.frombuffer(payload_data, dtype=np.uint8))
    total_bits = len(bits)
    
    # 4. Shuffle Indices using recovery_token
    rng = random.Random(recovery_token)
    rng.shuffle(valid_indices)
    
    # 5. Smart Slicing: How many pixels do we actually need?
    # Each pixel provides (3 channels * bits_per_channel)
    # bits_per_pixel is 9 if edge (3*3), 3 if smooth (3*1)
    bpp_map = np.where(edges_flat[valid_indices] == 255, 9, 3)
    cum_capacity = np.cumsum(bpp_map)
    needed_pixels_count = np.searchsorted(cum_capacity, total_bits) + 1
    
    if needed_pixels_count > len(valid_indices):
        raise ValueError(f"Image too small. Needed {total_bits} bits, but only {cum_capacity[-1]} available.")
        
    target_indices = valid_indices[:needed_pixels_count]
    flat_pixels = arr.reshape(-1, 3)
    
    # 6. Execution (Limited to target_indices)
    bit_idx = 0
    for idx in target_indices:
        if bit_idx >= total_bits: break
        is_edge = edges_flat[idx] == 255
        bpc = 3 if is_edge else 1
        
        for ch in range(3):
            if bit_idx >= total_bits: break
            chunk = bits[bit_idx : bit_idx + bpc]
            clen = len(chunk)
            bit_idx += clen
            
            val = 0
            for b in chunk: val = (val << 1) | int(b)
            if clen < bpc: val <<= (bpc - clen)
            
            mask = ~((1 << bpc) - 1) & 0xFF
            flat_pixels[idx, ch] = (flat_pixels[idx, ch] & mask) | (val & 0xFF)
            
    return Image.fromarray(arr), recovery_token

def extract_file_adaptive(stego_img: Image.Image, password: str = '', recovery_token: str = '') -> tuple[str, bytes, bytes]:
    """
    Extracts a file using HYBRID Adaptive Edge Steganography.
    High-Speed Two-Pass Extraction.
    """
    if not password and not recovery_token:
        raise ValueError("Password/Recovery Token required")

    f_key_str = recovery_token if recovery_token else derive_key(password).decode('utf-8')
    arr = np.array(stego_img.convert("RGB")).astype(np.uint8)
    h, w, _ = arr.shape
    flat_pixels = arr.reshape(-1, 3)
    
    # 1. Magic Check
    flat_view = arr.ravel()
    magic_bytes = np.packbits(flat_view[:32] & 1).tobytes()
    is_signed = magic_bytes.startswith(MAGIC_ADAPTIVE_SIGNED)
    if not is_signed and not magic_bytes.startswith(MAGIC_ADAPTIVE):
        raise ValueError("No signature found.")
        
    # 2. Shuffle Setup
    edges_flat = get_stable_edge_map(stego_img).ravel()
    valid_indices = np.arange(11, h * w)
    rng = random.Random(f_key_str)
    rng.shuffle(valid_indices)
    
    # 3. Pass 1: Extract Header Only (Saves HUGE time)
    # Header is 8 or 12 bytes. Max pixels needed even if all smooth = 12*8/3 = 32 pixels.
    # We take 64 pixels to be safe.
    header_indices = valid_indices[:64]
    header_bits = []
    for idx in header_indices:
        bpc = 3 if edges_flat[idx] == 255 else 1
        for ch in range(3):
            val = int(flat_pixels[idx, ch]) & ((1 << bpc) - 1)
            for i in range(bpc - 1, -1, -1):
                header_bits.append((val >> i) & 1)
                
    h_bytes = np.packbits(np.array(header_bits[:256], dtype=np.uint8)).tobytes()
    f_len = int.from_bytes(h_bytes[0:4], 'big')
    p_len = int.from_bytes(h_bytes[4:8], 'big')
    s_len = int.from_bytes(h_bytes[8:12], 'big') if is_signed else 0
    
    if f_len > 1000 or p_len > 50*1024*1024:
        raise ValueError("Invalid Header (likely wrong password).")
        
    # 4. Pass 2: Extract exactly what we need
    total_bits_needed = ( (12 if is_signed else 8) + f_len + p_len + s_len ) * 8
    
    # Re-calculate how many pixels needed
    bpp_map = np.where(edges_flat[valid_indices] == 255, 9, 3)
    cum_cap = np.cumsum(bpp_map)
    needed_count = np.searchsorted(cum_cap, total_bits_needed) + 1
    
    payload_indices = valid_indices[:needed_count]
    all_extracted_bits = []
    
    for idx in payload_indices:
        bpc = 3 if edges_flat[idx] == 255 else 1
        for ch in range(3):
            val = int(flat_pixels[idx, ch]) & ((1 << bpc) - 1)
            for i in range(bpc - 1, -1, -1):
                all_extracted_bits.append((val >> i) & 1)
                
    # 5. Final Parse
    data_bytes = np.packbits(np.array(all_extracted_bits, dtype=np.uint8)).tobytes()
    cursor = 12 if is_signed else 8
    filename = data_bytes[cursor : cursor+f_len].decode('utf-8', errors='ignore')
    cursor += f_len
    enc_data = data_bytes[cursor : cursor+p_len]
    cursor += p_len
    signature = data_bytes[cursor : cursor+s_len] if is_signed else None
    
    try:
        data = aes_decrypt(enc_data, recovery_token, True) if recovery_token else aes_decrypt(enc_data, password, False)
        return filename, data, signature
    except Exception as e:
        raise ValueError(f"Decryption failed: {e}")
