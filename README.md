Based on your project files, this is a **Deepfake Image and Video Detection System** that uses a **SigLIP deep learning model**, **MediaPipe face detection**, **FastAPI backend**, and a modern **HTML/CSS/JavaScript frontend**. The system supports both image and video deepfake detection with confidence scores and sampled face-frame visualization.  

You can use the following README for your GitHub repository:

# Deepfake Image and Video Detection

## Overview

Deepfake technology has made it easier than ever to manipulate images and videos, creating challenges in digital trust and content authenticity. This project provides an AI-powered solution to detect whether an uploaded image or video is real or manipulated.

The application uses a fine-tuned SigLIP image classification model for deepfake detection and MediaPipe face detection for extracting faces from videos. Users can upload images or videos through a modern web interface and receive detailed authenticity scores along with confidence metrics.

---

## Features

### Image Deepfake Detection

* Upload JPG, JPEG, or PNG images
* AI-powered authenticity classification
* Real vs Fake probability scores
* Confidence score calculation
* Fast inference using PyTorch

### Video Deepfake Detection

* Upload MP4, AVI, or MOV videos
* Automatic face detection using MediaPipe
* Frame sampling across the video timeline
* Deepfake analysis on detected faces
* Visual display of analyzed face frames
* Aggregated video authenticity score

### User Interface

* Modern responsive design
* Drag-and-drop file upload
* Image and video preview
* Real-time progress tracking
* Interactive result dashboard
* Mobile-friendly interface

---

## System Architecture

```text
Frontend (HTML/CSS/JavaScript)
            |
            |
            v
      FastAPI Backend
            |
            |
    -------------------
    |                 |
    v                 v
MediaPipe       SigLIP Model
Face Detection  Deepfake Classification
    |
    |
    v
Prediction Results
```

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

### Backend

* FastAPI
* Uvicorn

### Deep Learning

* PyTorch
* Transformers
* SigLIP Image Classification Model

### Computer Vision

* OpenCV
* MediaPipe
* Pillow (PIL)

---

## Project Structure

```text
Deepfake-Image-and-Video-Detection/
│
├── main.py                 # FastAPI backend
├── requirements.txt        # Project dependencies
│
├── local_model/            # Fine-tuned SigLIP model
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── Samples/
│   ├── Images/
│   └── Videos/
│
└── README.md
```

---

## How It Works

### Image Detection Pipeline

1. User uploads an image.
2. Image is resized to 224×224.
3. SigLIP processor prepares the image.
4. Deepfake classification model predicts:

   * Fake Probability
   * Real Probability
5. Confidence score is calculated.
6. Results are displayed on the dashboard.

---

### Video Detection Pipeline

1. User uploads a video.
2. OpenCV extracts video frames.
3. MediaPipe detects faces.
4. Detected faces are cropped and resized.
5. SigLIP model evaluates each face.
6. Face predictions are aggregated.
7. Final video authenticity score is generated.
8. Sample analyzed face frames are displayed.

---

## Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/Deepfake-Image-and-Video-Detection.git

cd Deepfake-Image-and-Video-Detection
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / Mac

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

Dependencies include FastAPI, Transformers, PyTorch, OpenCV, MediaPipe, Pillow, and Multipart support. 

---

## Model Setup

Place your trained SigLIP model inside:

```text
local_model/
```

Example:

```text
local_model/
├── config.json
├── model.safetensors
├── preprocessor_config.json
├── special_tokens_map.json
├── tokenizer.json
└── tokenizer_config.json
```

---

## Running the Backend

Start the FastAPI server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

## API Endpoints

### Image Prediction

```http
POST /predict/image
```

Request:

```text
multipart/form-data
file=image.jpg
```

Response:

```json
{
  "fake": 0.82,
  "real": 0.18,
  "confidence": 0.64,
  "label": "FAKE"
}
```

---

### Video Prediction

```http
POST /predict/video
```

Request:

```text
multipart/form-data
file=video.mp4
```

Response:

```json
{
  "fake": 0.74,
  "real": 0.26,
  "confidence": 0.48,
  "label": "FAKE",
  "frames": [...]
}
```

---

## Results Interpretation

| Confidence Score | Meaning              |
| ---------------- | -------------------- |
| 0.00 - 0.20      | Low confidence       |
| 0.20 - 0.50      | Moderate confidence  |
| 0.50 - 0.80      | High confidence      |
| 0.80 - 1.00      | Very high confidence |

### Labels

* **REAL** → Content appears authentic.
* **FAKE** → Content appears manipulated.

---

## Sample Workflow

### Image Analysis

```text
Upload Image
      ↓
Preprocessing
      ↓
SigLIP Model
      ↓
Prediction
      ↓
Authenticity Score
```

### Video Analysis

```text
Upload Video
      ↓
Frame Extraction
      ↓
Face Detection
      ↓
Face Classification
      ↓
Score Aggregation
      ↓
Final Verdict
```

---

## Future Enhancements

* Real-time webcam detection
* Explainable AI visualizations
* Multi-face tracking
* Batch processing support
* Cloud deployment
* Model performance dashboard
* Deepfake localization heatmaps
* Support for additional video formats

---

## Applications

* Social media content verification
* Fake news detection
* Digital forensics
* Cybersecurity investigations
* Media authentication
* Educational research
* Content moderation systems

---

## Acknowledgements

* Hugging Face Transformers
* PyTorch
* MediaPipe
* OpenCV
* FastAPI
* SigLIP Research Team

---

## Author

**Dinesh Shanmugam**

Artificial Intelligence & Data Science Engineer

* Python
* Machine Learning
* Deep Learning
* Computer Vision
* Data Science
* Generative AI

---

⭐ If you found this project useful, consider giving the repository a star.
