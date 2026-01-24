---
title: "PricePulse"
description: "A full-stack Myntra price tracker that monitors product prices, visualizes historical trends, and helps users catch discounts before they disappear."
techStack:
  - TypeScript
  - Next.js
  - React
  - TailwindCSS
  - Express.js
  - Turbopack
category: "Web Apps"
repoUrl: "https://github.com/tapanmeena/PricePulse"
startDate: 2025-11-01
status: "in-progress"
featured: true
draft: false
---

## Overview

PricePulse is a polished Next.js frontend paired with an Express API backend that helps you monitor Myntra catalogue items, surface historical price swings, and react before the next discount disappears.

## Features

- **Multi-URL Intake**: Paste up to 10 Myntra URLs at once and queue them for scraping
- **Smart Catalogue**: Search by product or domain, filter by availability state
- **Insightful Charts**: Area charts with yearly tooltips, min/max markers for price history
- **Price Intelligence**: Lowest/highest badges, target price checks, and availability timestamps
- **Accessible Feedback**: Optimistic loaders, keyboard shortcuts (⌘/Ctrl + K search), responsive layouts
- **Scheduler Integration**: Backend cron-based scheduler for automatic price checks

## Tech Stack Details

- **Frontend**: Next.js 15.5.6 (App Router), React 19.2.0, TailwindCSS 4.1.15, Turbopack
- **Backend**: Express.js API proxy for scraping and price tracking
- **Language**: TypeScript 5.9.3

## Challenges

Key technical challenges included:

1. Building a reliable scraper that handles Myntra's dynamic content
2. Designing an efficient price history storage and retrieval system
3. Creating responsive charts that gracefully handle flat price histories
4. Implementing real-time scheduler status and manual trigger functionality

## Outcomes

PricePulse provides a streamlined way to track prices across multiple products, with visual insights that make it easy to identify the best time to buy.
