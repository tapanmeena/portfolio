---
title: "ScreenSage macOS"
description: "A lightweight macOS overlay that reads on-screen text using OCR and surfaces AI-powered coding guidance for technical interviews."
techStack:
  - Swift
  - macOS
  - Apple Vision
  - Azure OpenAI
category: "Desktop Apps"
repoUrl: "https://github.com/tapanmeena/ScreenSage-macOS"
demoUrl: "https://tapanmeena.com/screensage"
startDate: 2025-08-09
status: "in-progress"
featured: true
draft: false
---

## Overview

ScreenSage is a private, always-on-top macOS overlay that captures on-screen text and transforms it into concise, interview-ready suggestions using AI. It runs OCR locally via Apple Vision and sends extracted text to Azure OpenAI for intelligent responses.

## Features

- **AI Suggestions**: Markdown-rendered responses with coding-aware format:
  - Problem Statement
  - Thoughts (short bullets)
  - Pseudocode
  - Solution (code with comments)
  - Time & Space Complexity
- **Programming Language Support**: Auto-detect or select from Python, JavaScript/TypeScript, Swift, Java, C++, C#, Go, Rust, SQL, and more
- **Live OCR**: Apple Vision-powered text capture with configurable interval
- **Integrated Preferences**: Configure everything within the overlay
- **Global Hotkeys**: Work even when the app isn't focused
- **Movable Overlay**: Cmd+Arrows to move, Shift for faster movement
- **Follow Cursor Mode**: Adjustable X/Y offset to follow mouse
- **Save Capture Regions**: Reuse specific screen areas

## Global Hotkeys (Default)

- `Cmd+B` - Toggle Overlay
- `Cmd+T` - Toggle Transparency
- `Shift+Cmd+O` - Start/Pause OCR
- `Cmd+,` - Open Preferences
- `Cmd+Arrows` - Move overlay (press-and-hold, 5px)
- `Shift+Cmd+Arrows` - Move overlay faster (20px)

## Privacy & Security

- Overlay window excluded from typical screen-sharing captures
- OCR runs locally via Apple Vision
- Only extracted text sent to your configured Azure OpenAI endpoint
- No screen recording or storage

## Requirements

- macOS 13+
- Azure OpenAI resource (Endpoint, Deployment, API key)

## Challenges

Building ScreenSage required solving:

1. Seamless overlay rendering that doesn't interfere with other apps
2. Efficient OCR processing with minimal CPU impact
3. Smart AI prompt engineering for interview-relevant responses
4. Global hotkey registration that works across all applications

## Outcomes

ScreenSage provides discreet, real-time coding assistance during technical interviews while respecting privacy and platform guidelines.
