import sys
import os

# So Python finds predictor when running from any directory
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import predict_embed_regions   # matches filename predictor.py

app = Flask(__name__)
CORS(app)  # allows your React frontend to call this API


@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ML API is running"})


@app.route("/analyze", methods=["POST"])
def analyze():
    if "image" not in request.files:
        return jsonify({"error": "No image provided. Send as form-data with key 'image'"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        image_bytes = file.read()
        result = predict_embed_regions(image_bytes)
        return jsonify(result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    print("Starting ML API on http://localhost:5000")
    print("Test with: POST /analyze  (form-data, key='image')")
    app.run(debug=True, port=5000, host="0.0.0.0")