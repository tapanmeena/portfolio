---
title: "Attendance Manager Using Face Recognition"
description: "An automated attendance system using face recognition with support for live capture, video files, and image processing."
techStack:
  - Python
  - TensorFlow
  - OpenCV
category: "ML/AI"
repoUrl: "https://github.com/tapanmeena/Attendance-Manager-Using-Face-Recognisation"
startDate: 2018-10-01
status: "completed"
featured: false
draft: false
---

## Overview

This project automates attendance tracking using face recognition technology. It can process live camera feeds, video files, or static images to identify individuals and mark their attendance.

## Features

- **Multiple Input Modes**: Process live camera, video files, or images
- **Face Registration**: Add new faces to the database from images or videos
- **Model Training**: Train the recognition model on registered faces
- **Face Extraction**: Extract and save faces from images for dataset building
- **Real-time Recognition**: Identify multiple faces in real-time video streams

## Usage

```bash
# Process an image file
python main.py -i IMAGE

# Process a video file
python main.py -v VIDEO

# Process live camera capture
python main.py -c

# Train the model on image data
python main.py -t

# Register a new face from camera
python main.py -a

# Register a new face from video file
python main.py -av VIDEO

# Extract faces from an image
python main.py -g IMAGE
```

## Tech Stack Details

- **Face Detection**: MTCNN (Multi-task Cascaded Convolutional Networks)
- **Face Recognition**: FaceNet with Keras (facenet_keras.h5)
- **Computer Vision**: OpenCV (cv2) for image/video processing
- **Deep Learning**: TensorFlow + Keras backend

## Architecture

1. **Detection Stage**: MTCNN detects face bounding boxes in frames
2. **Embedding Stage**: FaceNet generates 128-dimensional face embeddings
3. **Recognition Stage**: Compare embeddings against registered faces
4. **Attendance Logging**: Mark identified individuals as present

## Challenges

Key challenges in this project:

1. Handling varying lighting conditions and camera angles
2. Training efficient models on limited face samples
3. Real-time processing performance optimization
4. Managing face registration and database updates

## Outcomes

The system successfully automates attendance tracking, reducing manual effort and improving accuracy compared to traditional methods. Received 4 stars and 2 forks on GitHub.
