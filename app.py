import base64
from io import BytesIO
from flask import Flask, render_template, request, jsonify, url_for
import os
import numpy as np
import pickle
import cv2
from flask_cors import CORS
from mtcnn import MTCNN
from keras_vggface.utils import preprocess_input
from keras_vggface.vggface import VGGFace
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image
import re

# Initialize Flask app
app = Flask(__name__, static_folder="../static")


# Enable CORS for all routes
CORS(app)

# Ensure the upload folder exists
UPLOAD_FOLDER = "static/uploads/"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
# Load pre-trained models & data
feature_list = np.array(pickle.load(open('embedding.pkl', 'rb')))
filenames = pickle.load(open('filenames.pkl', 'rb'))

detector = MTCNN()
model = VGGFace(model='resnet50', include_top=False, input_shape=(224, 224, 3), pooling='avg')


def extract_features(img_path):
    """Extract features from the uploaded image."""
    img = cv2.imread(img_path)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = detector.detect_faces(img_rgb)

    if len(results) == 0:
        return "No face detected", img_path  # Return image path for preview

    for res in results:
        x, y, width, height = res['box']
        center = (x + width // 2, y + height // 2)
        radius = max(width, height) // 2
        cv2.circle(img, center, radius, (0, 255, 0), 3)

    processed_img_path = os.path.join(UPLOAD_FOLDER, "processed_" + os.path.basename(img_path))
    cv2.imwrite(processed_img_path, img)

    if len(results) > 1:
        return "Multiple faces detected", processed_img_path  # Return error message with image

    x, y, width, height = results[0]['box']
    face = img_rgb[y:y + height, x:x + width]
    image = Image.fromarray(face).resize((224, 224))
    face_array = np.asarray(image).astype('float32')

    expanded_img = np.expand_dims(face_array, axis=0)
    preprocess_img = preprocess_input(expanded_img)
    result = model.predict(preprocess_img).flatten()

    return result


def clean_name(filename):
    """Clean the celebrity name from the filename."""
    name = os.path.basename(filename).split(".")[0]
    name = re.sub(r"\d+", "", name).replace("_", " ").strip().title()
    return name


def recommend(features, top_k=1):
    """Find the most similar celebrity match."""
    similarity = [cosine_similarity(features.reshape(1, -1), feature_list[i].reshape(1, -1))[0][0] for i in
                  range(len(feature_list))]
    top_matches = sorted(enumerate(similarity), reverse=True, key=lambda x: x[1])[:top_k]

    results = []
    for idx, score in top_matches:
        image_path = filenames[idx].replace("\\", "/")
        category = image_path.split("/")[0].title()
        name = clean_name(image_path)

        results.append({
            "category": category,
            "name": name,
            "image": image_path,
            "similarity": round(score * 100, 2)
        })

    return results


@app.route("/", methods=["GET", "POST"])
def index():
    """Main webpage for image upload & result display."""
    if request.method == "POST":
        uploaded_file = request.files.get("image")
        captured_image_data = request.form.get("captured_image")
        top_k = int(request.form.get("top_k", 1))
        img_path = None

        if uploaded_file:
            img_path = os.path.join(UPLOAD_FOLDER, uploaded_file.filename)
            uploaded_file.save(img_path)
        elif captured_image_data:
            img_data = base64.b64decode(captured_image_data.split(",")[1])
            img = Image.open(BytesIO(img_data))
            img_path = os.path.join(UPLOAD_FOLDER, "captured_photo.png")
            img.save(img_path)
        else:
            return render_template("index.html", error_message="No image uploaded or captured!")

        features = extract_features(img_path)

        if isinstance(features, tuple):  # If error (No face or Multiple faces)
            error_message, processed_img_path = features
            return render_template("index.html", error_message=error_message, processed_img=processed_img_path)
        matches = recommend(features, top_k)
        return render_template("result.html", uploaded_img=img_path, matches=matches, top_k=top_k)

    return render_template("index.html")


@app.route('/start-app', methods=['POST'])
def start_app():
    """API to start the app (connected with frontend button)."""
    return jsonify({'status': 'success'}), 200


if __name__ == '__main__':
    app.run(debug=True)
