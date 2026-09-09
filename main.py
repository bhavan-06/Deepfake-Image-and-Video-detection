# ---------------- IMPORTS ----------------
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import AutoImageProcessor, SiglipForImageClassification
from PIL import Image
import torch
import cv2
import tempfile
import mediapipe as mp
import io
import os

# ---------------- APP ----------------
app = FastAPI(title="Deepfake Detector API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Change to your domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DEVICE ----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------- MODEL ----------------
model = None
processor = None

@app.on_event("startup")
def load_model():
    global model, processor
    model = SiglipForImageClassification.from_pretrained("./local_model")
    processor = AutoImageProcessor.from_pretrained("./local_model")
    model.to(device)
    model.eval()

# ---------------- MEDIAPIPE ----------------
mp_face = mp.solutions.face_detection.FaceDetection(
    model_selection=0,
    min_detection_confidence=0.5
)

# ---------------- IMAGE ENDPOINT ----------------
@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB").resize((224, 224))

        inputs = processor(images=image, return_tensors="pt")
        inputs = {k: v.to(device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.softmax(outputs.logits / 1.5, dim=1)[0]

        fake = float(probs[0])
        real = float(probs[1])
        confidence = abs(fake - real)
        label = "FAKE" if fake > 0.5 else "REAL"

        return JSONResponse({
            "fake": round(fake, 4),
            "real": round(real, 4),
            "confidence": round(confidence, 4),
            "label": label
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ---------------- VIDEO ENDPOINT ----------------
@app.post("/predict/video")
async def predict_video(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tfile:
            tfile.write(contents)
            tfile_path = tfile.name

        cap = cv2.VideoCapture(tfile_path)
        fake_scores = []
        frame_count = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 100

        SAMPLE_COUNT = 6
        target_frames = [int(i * total_frames / SAMPLE_COUNT) for i in range(SAMPLE_COUNT)]
        captured_positions = set()
        frame_samples_b64 = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % 5 == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = mp_face.process(rgb)

                if results.detections:
                    for det in results.detections:
                        bbox = det.location_data.relative_bounding_box
                        h, w, _ = frame.shape
                        x = max(0, int(bbox.xmin * w))
                        y = max(0, int(bbox.ymin * h))
                        bw = max(1, int(bbox.width * w))
                        bh = max(1, int(bbox.height * h))

                        face = frame[y:y+bh, x:x+bw]
                        if face.size == 0:
                            continue

                        face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                        image = Image.fromarray(face_rgb).resize((224, 224))
                        inputs = processor(images=image, return_tensors="pt")
                        inputs = {k: v.to(device) for k, v in inputs.items()}

                        with torch.no_grad():
                            outputs = model(**inputs)
                            probs = torch.softmax(outputs.logits / 1.5, dim=1)[0]

                        fake_prob = float(probs[0])
                        confidence = abs(float(probs[0]) - float(probs[1]))

                        if confidence > 0.2:
                            fake_scores.append(fake_prob)

                            for idx, target in enumerate(target_frames):
                                if abs(frame_count - target) < 5 and idx not in captured_positions:
                                    thumb = Image.fromarray(face_rgb).resize((150, 150))
                                    buf = io.BytesIO()
                                    thumb.save(buf, format="JPEG")
                                    import base64
                                    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
                                    frame_samples_b64.append(b64)
                                    captured_positions.add(idx)
                                    break

            frame_count += 1

        cap.release()
        os.unlink(tfile_path)

        if not fake_scores:
            return JSONResponse({"error": "No face detected in video"}, status_code=422)

        fake_ratio = sum(fake_scores) / len(fake_scores)
        real_ratio = 1 - fake_ratio
        confidence = abs(fake_ratio - real_ratio)
        label = "FAKE" if fake_ratio > 0.5 else "REAL"

        return JSONResponse({
            "fake": round(fake_ratio, 4),
            "real": round(real_ratio, 4),
            "confidence": round(confidence, 4),
            "label": label,
            "frames": frame_samples_b64
        })

    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


# ---------------- RUN ----------------
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
