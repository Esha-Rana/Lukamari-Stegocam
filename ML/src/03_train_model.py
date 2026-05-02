import numpy as np
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix, f1_score



BASE_DIR = Path(__file__).resolve().parent.parent
FEATURES_DIR = BASE_DIR / "features"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)


def load_data():
    print("\nLoading feature data...")

    required_files = [
        "X_train.npy", "X_test.npy",
        "y_train.npy", "y_test.npy"
    ]

    for f in required_files:
        if not (FEATURES_DIR / f).exists():
            raise FileNotFoundError(f"Missing file: {f}. Run feature extraction first.")

    X_train = np.load(FEATURES_DIR / "X_train.npy")
    X_test  = np.load(FEATURES_DIR / "X_test.npy")
    y_train = np.load(FEATURES_DIR / "y_train.npy")
    y_test  = np.load(FEATURES_DIR / "y_test.npy")

    print(f"X_train: {X_train.shape}")
    print(f"X_test : {X_test.shape}")

    return X_train, X_test, y_train, y_test


def train_model(X_train, y_train):
    print("\nBuilding Random Forest model...")

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced"
    )

    print("\nRunning cross-validation...")

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1")

    print(f"CV F1 scores: {scores.round(3)}")
    print(f"Mean F1: {scores.mean():.3f} ± {scores.std():.3f}")

    print("\nTraining final model...")
    model.fit(X_train, y_train)

    return model


def evaluate(model, X_test, y_test):
    print("\nEvaluating model...")

    y_pred = model.predict(X_test)

    print("\nClassification Report:")
    print(classification_report(
        y_test,
        y_pred,
        target_names=["flat (0)", "complex (1)"]
    ))

    f1 = f1_score(y_test, y_pred)
    print(f"Test F1 score: {f1:.3f}")

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)

    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["flat", "complex"],
                yticklabels=["flat", "complex"])

    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")

    plt.tight_layout()
    plt.savefig(MODELS_DIR / "confusion_matrix.png", dpi=150)

    print("Saved confusion_matrix.png")


def save_model(model):
    joblib.dump(model, MODELS_DIR / "random_forest.joblib")
    print("Saved model to models/random_forest.joblib")


# =========================
# MAIN
# =========================
if __name__ == "__main__":

    X_train, X_test, y_train, y_test = load_data()

    model = train_model(X_train, y_train)

    evaluate(model, X_test, y_test)

    save_model(model)

    print("\n Training pipeline complete!")