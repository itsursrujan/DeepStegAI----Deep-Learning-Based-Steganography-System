import pytest
import numpy as np
from PIL import Image
import io
import sys
import os

# Ensure backend root is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from stego_engine import (
    bytes_to_bits, bits_to_bytes, image_capacity_bits, 
    embed_payload_into_image, extract_payload_from_image, MAGIC
)

@pytest.fixture
def dummy_image():
    # 100x100 Red square
    img = Image.new('RGB', (100, 100), color = 'red')
    return img

def test_bits_bytes_conversion():
    data = b"Hello, Stego!"
    bits = bytes_to_bits(data)
    recovered_data = bits_to_bytes(bits, len(data))
    assert data == recovered_data
    
def test_image_capacity(dummy_image):
    # 100 * 100 * 3 = 30000 bits
    assert image_capacity_bits(dummy_image) == 30000

def test_embed_and_extract_payload(dummy_image):
    payload = b"Top Secret Payload 12345"
    # Construct proper header: MAGIC + Mode(1 byte) + Length(4 bytes)
    header = MAGIC + bytes([0]) + len(payload).to_bytes(4, "big")
    full_data = header + payload
    
    stego_img = embed_payload_into_image(dummy_image, full_data)
    
    # Extract
    mode_id, ext_payload, signature = extract_payload_from_image(stego_img)
    assert mode_id == 0
    assert ext_payload == payload
    assert signature is None

def test_embed_too_large_payload(dummy_image):
    # Capacity is 30000 bits = 3750 bytes
    large_payload = b"A" * 4000
    with pytest.raises(ValueError, match="Data is too large for this image"):
        embed_payload_into_image(dummy_image, large_payload)

def test_extract_invalid_header(dummy_image):
    """A plain unmodified image has no DSAI magic bytes — must raise ValueError."""
    with pytest.raises(ValueError, match="valid DeepStegAI header"):
        extract_payload_from_image(dummy_image)
