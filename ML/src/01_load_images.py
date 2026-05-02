import cv2
import numpy as np
from pathlib import Path

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data/raw/cifar10/cifar10"  #path to test and train folders
FEATURES_DIR = BASE_DIR / "features"
FEATURES_DIR.mkdir(exist_ok=True) #creating features folder if not done manually


def load_images(split="train", max_per_class=None):
    split_dir = DATA_DIR / split

    print(f"\nLooking in: {split_dir}")
    print("Exists?", split_dir.exists())

    images = []
    labels = []

    # loop through each class folder
    for class_folder in sorted(split_dir.iterdir()):
        if not class_folder.is_dir():
            continue

        label = class_folder.name
        paths = sorted(class_folder.glob("*.png"))

        if max_per_class:
            paths = paths[:max_per_class]

        print(f"\nLoading class: {label} | total images: {len(paths)}")

        # UPDATED LOOP WITH PROGRESS
        for i, img_path in enumerate(paths):

            if i % 100 == 0:
                print(f"  Processing {i} images in class {label}...")

            img = cv2.imread(str(img_path))

            if img is None:
                print(f"[WARN] Cannot read {img_path}")
                continue

            # convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            images.append(gray)
            labels.append(label)

    images = np.array(images, dtype=np.uint8)

    print(f"\n[{split}] Loaded {len(images)} images total")
    print(f"Classes: {sorted(set(labels))}")

    return images, np.array(labels)


if __name__ == "__main__":

    MAX_PER_CLASS = None  

    # TRAIN
    train_images, train_labels = load_images("train", max_per_class=MAX_PER_CLASS)

    np.save(FEATURES_DIR / "train_images.npy", train_images)
    np.save(FEATURES_DIR / "train_labels.npy", train_labels)

    print("\n Saved train data")

    # TEST
    test_images, test_labels = load_images("test", max_per_class=MAX_PER_CLASS)

    np.save(FEATURES_DIR / "test_images.npy", test_images)
    np.save(FEATURES_DIR / "test_labels.npy", test_labels)

    print("\n Saved test data")