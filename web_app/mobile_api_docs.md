# DeepStegAI Mobile API Documentation

This document outlines the endpoints available for the Android application to interact with the DeepStegAI backend.

## Base URL
The base URL will depend on your hosting environment:
- Local Development: `http://192.168.x.x:5000` (Use your PC's local IP)
- Production: `https://your-domain.com`

---

## 1. Embed (Hide Data)
**Endpoint**: `/api/embed`  
**Method**: `POST`  
**Content-Type**: `multipart/form-data`

### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `cover` | File (Image) | Yes | The host image (PNG/JPG). |
| `secret` | File | Yes | The file or text to hide. |
| `method` | String | No | `LSB` (default) or `Adaptive`. |
| `password` | String | No | Encryption password. Required for `Adaptive`. |

### Success Response (200 OK)
```json
{
  "success": true,
  "image_data": "BASE64_ENCODED_PNG_STRING",
  "filename": "stego_image.png",
  "recovery_token": "RECOVERY_TOKEN_HERE",
  "method": "LSB"
}
```

---

## 2. Extract (Reveal Data)
**Endpoint**: `/api/extract`  
**Method**: `POST`  
**Content-Type**: `multipart/form-data`

### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `stego` | File (Image) | Yes | The image containing hidden data. |
| `password` | String | No | The password used during embedding. |
| `recovery_token` | String | No | Fallback token if password is lost. |

### Success Response (200 OK)
Returns the **raw file bytes** of the hidden content.

---

## 3. Analyze (Steganalysis)
**Endpoint**: `/api/analyze`  
**Method**: `POST`  
**Content-Type**: `multipart/form-data`

### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `image` | File (Image) | Yes | The image to scan. |

### Success Response (200 OK)
```json
{
  "detected": true,
  "verdict": "DETECTED",
  "description": "Confirmed Steganography. Method: LSB",
  "static_analysis": {
    "detected": true,
    "message": "..."
  },
  "ai_analysis": {
    "available": true,
    "score": 0.85,
    "threshold": 0.5
  }
}
```

---

## Error Responses
All endpoints return standard HTTP error codes with a JSON body:
```json
{
  "error": "Detailed error message here"
}
```
| Code | Meaning |
| :--- | :--- |
| `400` | Bad Request (Missing parameters). |
| `401` | Unauthorized (Password/Token missing for extraction). |
| `403` | Forbidden (Wrong password/token). |
| `404` | Not Found (No stego signature detected). |
| `500` | Server Error. |
