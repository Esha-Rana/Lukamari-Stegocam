import cv2
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.stats import entropy as scipy_entropy
from tqdm import tqdm


BASE_DIR = Path(__file__).resolve().parent.parent
FEATURES_DIR = BASE_DIR / "features"


def sobel_features(gray_img: np.ndarray) -> list:
    gx = cv2.Sobel(gray_img, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray_img, cv2.CV_64F, 0, 1, ksize=3)

    magnitude = np.sqrt(gx ** 2 + gy ** 2)

    hist, _ = np.histogram(magnitude.ravel(), bins=64, range=(0.0, 362.0))
    hist_norm = hist / (hist.sum() + 1e-9)
    grad_entropy = scipy_entropy(hist_norm + 1e-9)

    return [
        float(np.mean(magnitude)),
        float(np.std(magnitude)),
        float(np.mean(magnitude > 30)),
        float(grad_entropy),
        float(np.max(magnitude)),
    ]


def build_feature_matrix(images: np.ndarray) -> np.ndarray:
    features = []

    for img in tqdm(images, desc="Extracting Sobel features"):
        features.append(sobel_features(img))

    return np.array(features, dtype=np.float32)


def label_by_complexity(feature_matrix: np.ndarray, percentile: int = 60):
    threshold = np.percentile(feature_matrix[:, 0], percentile)
    labels = (feature_matrix[:, 0] > threshold).astype(np.int32)

    print(f"Threshold: {threshold:.2f}")
    print(f"Complex: {labels.sum()} | Flat: {len(labels) - labels.sum()}")

    return labels, threshold


# =========================
# MAIN
# =========================
if __name__ == "__main__":

    print("Loading images...")

    train_path = FEATURES_DIR / "train_images.npy"
    test_path = FEATURES_DIR / "test_images.npy"

    # safety check
    if not train_path.exists() or not test_path.exists():
        raise FileNotFoundError(
            "Missing .npy files! Run load_images.py first."
        )

    train_images = np.load(train_path)
    test_images = np.load(test_path)

    print(f"Train shape: {train_images.shape}")
    print(f"Test shape: {test_images.shape}")

    # -------------------------
    # FEATURE EXTRACTION
    # -------------------------
    print("\n--- Training set ---")
    X_train = build_feature_matrix(train_images)

    print("\n--- Test set ---")
    X_test = build_feature_matrix(test_images)

    # -------------------------
    # LABELING (NO DATA LEAKAGE)
    # -------------------------
    y_train, threshold = label_by_complexity(X_train, 60)
    y_test = (X_test[:, 0] > threshold).astype(np.int32)

    # -------------------------
    # SAVE OUTPUTS
    # -------------------------
    np.save(FEATURES_DIR / "X_train.npy", X_train)
    np.save(FEATURES_DIR / "X_test.npy", X_test)
    np.save(FEATURES_DIR / "y_train.npy", y_train)
    np.save(FEATURES_DIR / "y_test.npy", y_test)

    # CSV for inspection
    cols = [
        "mean_gradient",
        "std_gradient",
        "edge_ratio",
        "gradient_entropy",
        "max_gradient",
    ]

    df = pd.DataFrame(X_train, columns=cols)
    df["label"] = y_train

    df.to_csv(FEATURES_DIR / "feature_matrix_train.csv", index=False)

    print("\n Saved all feature files successfully!")
    print(f"X_train: {X_train.shape} | X_test: {X_test.shape}")