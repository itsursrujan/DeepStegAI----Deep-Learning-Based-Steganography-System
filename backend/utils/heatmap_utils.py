import cv2
import numpy as np
import base64

def generate_difference_heatmap(cover_np, stego_np):
    """
    Generates a difference heatmap between cover and stego images.
    Expects input as numpy arrays (BGR format from OpenCV).

    Fixes applied:
    - Statistical thresholding (mean + 2*std) suppresses noise
    - Intensity clamped to [0, 180] to prevent over-sensitivity on clean images
    - Proper float32 normalization before colormap
    """
    # Downscale if > 1024px to keep processing fast
    h, w = cover_np.shape[:2]
    if max(h, w) > 1024:
        scale = 1024 / max(h, w)
        cover_np = cv2.resize(cover_np, (int(w * scale), int(h * scale)))
        stego_np = cv2.resize(stego_np, (int(w * scale), int(h * scale)))

    # Ensure same dimensions (safety guard)
    if cover_np.shape != stego_np.shape:
        stego_np = cv2.resize(stego_np, (cover_np.shape[1], cover_np.shape[0]))

    # Convert to float32 grayscale for precision
    cover_gray = cv2.cvtColor(cover_np, cv2.COLOR_BGR2GRAY).astype(np.float32)
    stego_gray = cv2.cvtColor(stego_np, cv2.COLOR_BGR2GRAY).astype(np.float32)

    # Compute absolute difference
    diff = np.abs(cover_gray - stego_gray)

    # FIX 1: Gaussian blur to reduce single-pixel noise spikes
    diff = cv2.GaussianBlur(diff, (5, 5), 0)

    # FIX 2: Statistical thresholding — suppress noise below mean + 2*std
    # This ensures clean images with only random noise produce a mostly dark heatmap
    threshold = np.mean(diff) + 2.0 * np.std(diff)
    diff[diff < threshold] = 0

    # FIX 3: Clamp to [0, 180] to prevent tiny LSB changes from hitting
    # full saturation, which causes false high-intensity on clean images
    diff = np.clip(diff, 0, 180)

    # FIX 4: Normalize to [0, 255] for colormap application
    if diff.max() > 0:
        diff_norm = (diff / diff.max() * 255).astype(np.uint8)
    else:
        # Completely flat: return a near-black heatmap (not an error)
        diff_norm = np.zeros_like(diff, dtype=np.uint8)

    # Apply COLORMAP_HOT — black → red → yellow → white intensity scale
    heatmap = cv2.applyColorMap(diff_norm, cv2.COLORMAP_HOT)

    # Encode to PNG Base64
    _, buffer = cv2.imencode('.png', heatmap)
    heatmap_b64 = base64.b64encode(buffer).decode('utf-8')

    return heatmap_b64
