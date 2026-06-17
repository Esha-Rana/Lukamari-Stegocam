import os
import cv2
import numpy as np
import joblib

# Points to your already-trained model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/random_forest.joblib")

# Load once at startup
clf = joblib.load(MODEL_PATH)

BLOCK_SIZE = 8
IMAGE_SIZE = 32  # CIFAR-10 is 32x32, keep consistent with training


def extract_sobel_features(gray_img):
    """Compute per-block mean edge intensity from a grayscale image."""
    sobel_x = cv2.Sobel(gray_img, cv2.CV_64F, 1, 0, ksize=3)
    sobel_y = cv2.Sobel(gray_img, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(sobel_x**2 + sobel_y**2)

    features = []
    for y in range(0, IMAGE_SIZE, BLOCK_SIZE):
        for x in range(0, IMAGE_SIZE, BLOCK_SIZE):
            block = magnitude[y:y + BLOCK_SIZE, x:x + BLOCK_SIZE]
            features.append(np.mean(block))

    return np.array(features)


def predict_embed_regions(image_bytes):
    """
    Accepts raw image bytes from a Flask upload.
    Returns:
      - heatmap: 2D list of 0/1  (1 = complex = good for embedding)
      - block_size: int
      - image_size: int
    """
    # Decode bytes → numpy array → grayscale
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        raise ValueError("Could not decode image. Check the file format.")

    # Resize to match training image size
    img_resized = cv2.resize(img, (IMAGE_SIZE, IMAGE_SIZE))

    # Extract features (same way your 02_extract_features.py did)
    features = extract_sobel_features(img_resized)

    # Reshape to what the model expects: (n_samples, n_features)
    # Each block is one sample with one feature (mean edge intensity)
    X = features.reshape(-1, 1)

    # Predict: 1 = complex region, 0 = simple region
    predictions = clf.predict(X)

    # Reshape back to a 2D grid
    blocks_per_row = IMAGE_SIZE // BLOCK_SIZE
    heatmap = predictions.reshape(blocks_per_row, blocks_per_row).tolist()

    return {
        "heatmap": heatmap,
        "block_size": BLOCK_SIZE,
        "image_size": IMAGE_SIZE
    }