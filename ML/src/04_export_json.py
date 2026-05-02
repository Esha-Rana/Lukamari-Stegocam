import json
import joblib
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"


def export_rf_to_json(model_path: Path, output_path: Path):
    """
    Convert trained RandomForest model → JSON (for JavaScript use)
    """

    print("\nLoading trained model...")
    clf = joblib.load(model_path)

    feature_names = [
        "mean_gradient",
        "std_gradient",
        "edge_ratio",
        "gradient_entropy",
        "max_gradient"
    ]

    forest_json = {
        "n_classes": 2,
        "feature_names": feature_names,
        "trees": []
    }

    print(f"Exporting {len(clf.estimators_)} trees...")

    # =========================
    # CONVERT EACH TREE
    # =========================
    for i, estimator in enumerate(clf.estimators_):

        tree = estimator.tree_

        forest_json["trees"].append({
            "children_left": tree.children_left.tolist(),
            "children_right": tree.children_right.tolist(),
            "feature": tree.feature.tolist(),
            "threshold": [float(round(x, 6)) for x in tree.threshold],
            "value": tree.value[:, 0, :].tolist()
        })

        if i % 10 == 0:
            print(f"  Processed {i} trees...")

    # =========================
    # SAVE JSON
    # =========================
    output_path.parent.mkdir(exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(forest_json, f, separators=(",", ":"))

    size_kb = output_path.stat().st_size / 1024

    print(f"\nExport complete → {output_path}")
    print(f"File size: {size_kb:.1f} KB")

    if size_kb > 10000:
        print("\n TIP: File is large. Reduce model size:")
        print("   - n_estimators=50")
        print("   - max_depth=6")


# =========================
# MAIN
# =========================
if __name__ == "__main__":

    model_path = MODELS_DIR / "random_forest.joblib"
    output_path = MODELS_DIR / "rf_model.json"

    if not model_path.exists():
        raise FileNotFoundError(
            "Model not found! Run train_model.py first."
        )

    export_rf_to_json(model_path, output_path)

    print("\n Next step:")
    print("Copy models/rf_model.json → your frontend (React/public folder)")