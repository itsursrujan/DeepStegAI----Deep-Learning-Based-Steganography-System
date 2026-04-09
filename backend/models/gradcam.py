import torch
import cv2
import numpy as np
import base64

def get_last_conv_layer(model):
    """
    Finds the last Conv2d layer in a PyTorch model.
    This is the target layer for Grad-CAM hook registration.
    """
    for layer in reversed(list(model.modules())):
        if isinstance(layer, torch.nn.Conv2d):
            return layer
    raise Exception("No Conv2d layer found in model")


def generate_gradcam(model, image_tensor):
    """
    Generates a Grad-CAM heatmap for the given model and image tensor.

    image_tensor: (1, C, H, W) torch tensor, normalized per model requirements.

    Returns:
        (heatmap_b64, pred_class, confidence) on success
        (None, pred_class, confidence) if CAM is completely flat (no activation signal)

    Fixes applied (Issue 2–6):
    - register_full_backward_hook (replaces deprecated register_backward_hook)
    - Class-specific backward: uses argmax of output (not hard-coded index)
    - ReLU on CAM: drops negative contributions (Issue 4)
    - Threshold suppression (>= 0.4): removes weak activations (Issue 1/6)
    - Confidence-based attenuation: dim CAM when confidence < 0.6 (Issue 6)
    - Flat CAM returns None gracefully instead of raising (Issue 4)
    """
    model.eval()

    gradients = []
    activations = []

    # FIX: Use register_full_backward_hook (stable, not deprecated)
    target_layer = get_last_conv_layer(model)

    def forward_hook(module, input, output):
        activations.append(output.detach())

    def backward_hook(module, grad_in, grad_out):
        gradients.append(grad_out[0].detach())

    # Register hooks
    f_hook = target_layer.register_forward_hook(forward_hook)
    b_hook = target_layer.register_full_backward_hook(backward_hook)

    # Ensure tensor is on the correct device
    device = next(model.parameters()).device
    image_tensor = image_tensor.to(device)
    image_tensor.requires_grad_(True)

    try:
        # Forward pass
        output = model(image_tensor)

        # FIX: Class-specific backward — target predicted class only
        pred_class = torch.argmax(output, dim=1)  # shape: (1,)
        confidence = torch.softmax(output, dim=1)[0, pred_class].item()

        # Backward pass for the predicted class only
        model.zero_grad()
        output[0, pred_class].backward()

        # FIX: Safety — check hooks actually captured gradients
        if len(gradients) == 0 or len(activations) == 0:
            raise ValueError("Gradients/Activations not captured — hook registration failed")

        # Process: global average pool gradients → channel weights
        grad = gradients[-1].cpu().data.numpy()[0]   # (C, H, W)
        act  = activations[-1].cpu().data.numpy()[0] # (C, H, W)

        weights = np.mean(grad, axis=(1, 2))          # (C,)
        cam = np.zeros(act.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * act[i]

        # FIX: Apply ReLU — keep only positive contributions (stego signal)
        cam = np.maximum(cam, 0)

        # Resize to original input dimensions before normalization
        h, w = image_tensor.shape[2], image_tensor.shape[3]
        cam = cv2.resize(cam, (w, h))

        # FIX: Normalize to [0, 1]
        cam = cam - np.min(cam)
        cam = cam / (np.max(cam) + 1e-8)

        # FIX: Flat CAM → return None gracefully (no crash, frontend handles it)
        if cam.max() == 0:
            return None, pred_class.item(), float(confidence)

        # FIX: Suppress weak activations below threshold (reduces noise on clean images)
        ACTIVATION_THRESHOLD = 0.4  # tuned: 0.3–0.5 range
        cam[cam < ACTIVATION_THRESHOLD] = 0

        # FIX: Confidence-based attenuation — if model is uncertain, dim the heatmap
        # This prevents misleading high-intensity maps for ambiguous/clean images
        if float(confidence) < 0.6:
            cam = cam * 0.3

        # Convert to uint8 and apply JET colormap
        heatmap_uint8 = np.uint8(255 * cam)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        # Encode to PNG Base64
        _, buffer = cv2.imencode('.png', heatmap_colored)
        heatmap_b64 = base64.b64encode(buffer).decode('utf-8')

        return heatmap_b64, pred_class.item(), float(confidence)

    finally:
        # Always remove hooks to prevent memory leaks and interference
        f_hook.remove()
        b_hook.remove()

