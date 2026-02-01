---
title: "Sentinel"
description: "A professional security camera streaming dashboard for Raspberry Pi with multi-camera support, motion detection, and recording capabilities."
techStack:
  - Python
  - Flask
  - OpenCV
  - Raspberry Pi
  - Picamera2
  - JavaScript
category: "IoT/Security"
repoUrl: "https://github.com/tapanmeena/Sentinel"
startDate: 2025-11-30
endDate: 2025-12-05
status: "completed"
featured: false
draft: false
---

## Overview

Sentinel is a futuristic security camera streaming dashboard built for Raspberry Pi. It supports multiple camera types (Pi cameras and RTSP/IP network cameras), provides live streaming, motion detection, and organized recording management.

## Features

- **Multi-Camera Support**: Pi cameras and RTSP/IP network cameras
- **Live Streaming**: Real-time MJPEG video streaming with grid view
- **Motion Detection**: Automatic recording triggered by motion with configurable sensitivity
- **Manual Recording**: On-demand video recording with thumbnail generation
- **Dark/Light Theme**: Toggle between themes with persistence
- **Mobile Responsive**: Full mobile support with hamburger menu navigation
- **Authentication**: Secure login system with session management
- **Per-Camera Storage**: Organized recordings by camera (recordings/cam1/, recordings/cam2/)
- **RTSP Reconnection**: Exponential backoff reconnection strategy (1s→30s) with visual indicators
- **Glassmorphism UI**: Modern dark theme with translucent elements

## Pages

| Route         | Description                          |
| ------------- | ------------------------------------ |
| `/`           | Main dashboard with live camera feed |
| `/recordings` | Browse and playback recorded videos  |
| `/settings`   | Configure motion detection           |
| `/devices`    | Camera status and management         |
| `/login`      | Authentication page                  |

## Camera Configuration

Supports two camera types:

- **picamera**: Raspberry Pi camera module with configurable resolution and framerate
- **rtsp**: Network/IP cameras with environment variable credential substitution

## Motion Detection Settings

Per-camera configuration stored in `motion_config.json`:

- `enabled` - Enable/disable motion detection
- `sensitivity` - Motion sensitivity threshold (1-100)
- `cooldown` - Seconds between motion recordings
- `buffer_seconds` - Pre-motion buffer duration

## Security Features

- Session-based authentication
- HTTP-only secure cookies
- CSRF protection via SameSite cookies
- Environment variable credential storage
- No hardcoded passwords in source

## Challenges

Building Sentinel involved:

1. Reliable RTSP stream handling with automatic reconnection
2. Efficient motion detection without excessive CPU usage
3. Synchronized multi-camera streaming and recording
4. Secure authentication for remote access

## Outcomes

Sentinel provides a professional, self-hosted security camera solution that runs efficiently on Raspberry Pi hardware.
