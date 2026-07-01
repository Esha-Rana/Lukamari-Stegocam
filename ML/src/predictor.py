import os
import cv2
import numpy as np
import joblib
from scipy.stats import entropy as scipy_entropy

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/random_forest.joblib")
clf = joblib.load(MODEL_PATH)

IMAGE_SIZE = 32  # CIFAR-10 trained on 32x32


def extract_5_features(gray_img: np.ndarray) -> np.ndarray:
    """
    Exact same function as sobel_features() in 02_extract_features.py.
    Must match 100% or predictions will be wrong.

    Features (in order):
      0: mean_gradient
      1: std_gradient
      2: edge_ratio      (fraction of pixels with magnitude > 30)
      3: gradient_entropy
      4: max_gradient
    """
    gx = cv2.Sobel(gray_img, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray_img, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(gx**2 + gy**2)

    # Entropy of gradient histogram (same bins/range as training)
    hist, _ = np.histogram(magnitude.ravel(), bins=64, range=(0.0, 362.0))
    hist_norm = hist / (hist.sum() + 1e-9)
    grad_entropy = scipy_entropy(hist_norm + 1e-9)

    return np.array([
        float(np.mean(magnitude)),           # 0: mean_gradient
        float(np.std(magnitude)),            # 1: std_gradient
        float(np.mean(magnitude > 30)),      # 2: edge_ratio
        float(grad_entropy),                 # 3: gradient_entropy
        float(np.max(magnitude)),            # 4: max_gradient
    ], dtype=np.float32)


def predict_embed_regions(image_bytes: bytes) -> dict:
    """
    Accepts raw image bytes from Flask upload.
    Returns:
      - heatmap:    2D list of 0/1 per block (1 = complex = embed here)
      - block_size: int
      - image_size: int
      - prediction: int  (image-level: 0 or 1)
      - label:      str  ("complex" or "simple")
      - confidence: float (0.0 - 1.0)
    """
    # Decode bytes → grayscale image
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Could not decode image. Ensure it is a valid PNG or JPG.")

    # Resize to training size
    img_resized = cv2.resize(img, (IMAGE_SIZE, IMAGE_SIZE))

    # Extract features — shape (1, 5)
    features = extract_5_features(img_resized).reshape(1, -1)

    # Predict
    prediction  = int(clf.predict(features)[0])
    probability = float(clf.predict_proba(features)[0][prediction])

    # Build a block-level heatmap
    # Since this is image-level classification, all blocks get the same label.
    # This is correct — your React frontend uses it to decide whether
    # to embed at all in this image.
    BLOCK_SIZE     = 8
    blocks_per_row = IMAGE_SIZE // BLOCK_SIZE   # 32 // 8 = 4
    heatmap = [[prediction] * blocks_per_row for _ in range(blocks_per_row)]

    return {
        "heatmap":    heatmap,
        "block_size": BLOCK_SIZE,
        "image_size": IMAGE_SIZE,
        "prediction": prediction,
        "label":      "complex" if prediction == 1 else "simple",
        "confidence": round(probability, 4)
    }