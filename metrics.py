import numpy as np
from PIL import Image
import math

from skimage.metrics import structural_similarity as ssim

def calculate_mse(original_img: Image.Image, stego_img: Image.Image) -> float:
    """
    Calculates the Mean Squared Error (MSE) between two images.
    Input images are expected to be in RGB format.
    """
    # Convert images to numpy arrays with float32 for precision
    arr1 = np.array(original_img.convert("RGB")).astype(np.float32)
    arr2 = np.array(stego_img.convert("RGB")).astype(np.float32)
    
    # Ensure they have the same shape
    if arr1.shape != arr2.shape:
        raise ValueError(f"Image shapes must match for MSE calculation: {arr1.shape} vs {arr2.shape}")
        
    # Calculate pixel-wise squared difference
    mse = np.mean((arr1 - arr2) ** 2)
    return float(mse)

def calculate_psnr(original_img: Image.Image, stego_img: Image.Image) -> float:
    """
    Calculates the Peak Signal-to-Noise Ratio (PSNR) in dB.
    Formula: 20 * log10(MAX_I / sqrt(MSE))
    """
    mse = calculate_mse(original_img, stego_img)
    
    if mse == 0:
        return float('inf') # Perfect reconstruction
    
    # Calculate PSNR
    # Max value for 8-bit images is 255.0
    psnr = 20 * math.log10(255.0 / math.sqrt(mse))
    return float(psnr)

def calculate_ssim(original_img: Image.Image, stego_img: Image.Image) -> float:
    """
    Calculates the Structural Similarity Index (SSIM) between two images.
    Expected to be RGB or Grayscale.
    """
    arr1 = np.array(original_img.convert("RGB"))
    arr2 = np.array(stego_img.convert("RGB"))
    
    # multichannel=True is deprecated in newer versions, use channel_axis
    score, _ = ssim(arr1, arr2, full=True, channel_axis=2)
    return float(score)
