---
title: "Cloud Cost Analyzer"
description: "An automated tool for analyzing and optimizing Azure cloud costs. Provides actionable recommendations for reducing cloud spending."
techStack:
  - Python
  - Azure SDK
  - Pandas
  - FastAPI
category: "Cloud Tools"
repoUrl: "https://github.com/tapanmeena/cloud-cost-analyzer"
startDate: 2024-06-10
endDate: 2024-12-20
status: "completed"
featured: false
draft: false
---

## Overview

Cloud Cost Analyzer is a tool that helps organizations understand and optimize their Azure cloud spending. It automatically analyzes resource usage patterns and provides recommendations for cost savings.

## Features

- **Cost Breakdown**: Detailed breakdown of costs by service, resource group, and tags
- **Anomaly Detection**: Identifies unusual spending patterns
- **Right-sizing Recommendations**: Suggests optimal VM sizes based on usage
- **Reserved Instance Analysis**: Calculates potential savings from reserved instances
- **Scheduled Reports**: Automated weekly/monthly cost reports

## Architecture

The tool consists of:

1. Data collection agents that pull cost data from Azure Cost Management API
2. Analysis engine built with Pandas for data processing
3. FastAPI backend for serving recommendations
4. Simple dashboard for visualization

## Results

Deployed for internal use, the tool identified potential savings of 30% on monthly cloud costs through right-sizing and reserved instance recommendations.
