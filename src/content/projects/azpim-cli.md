---
title: "AZPIM CLI"
description: "A command-line tool for managing Azure Privileged Identity Management (PIM) roles. Streamlines the process of activating, deactivating, and listing PIM role assignments."
techStack:
  - TypeScript
  - Node.js
  - Azure SDK
  - Commander.js
  - Inquirer.js
  - Ora
  - Chalk
category: "CLI Tools"
repoUrl: "https://github.com/tapanmeena/azpim"
liveUrl: "https://www.npmjs.com/package/azpim"
blogUrl: "/blog/cli-tools/azpim-cli"
startDate: 2026-01-10
endDate: 2026-01-28
status: "completed"
featured: true
draft: false
---

## Overview

If you work with Azure in an enterprise environment, you know the PIM dance: open portal, navigate to PIM, wait for it to load, find the right subscription, click activate, type justification, submit, wait. Every. Single. Morning.

AZPIM CLI brings Azure Privileged Identity Management to your terminal. Same security model, same just-in-time access, same audit trail — just without the portal clicks.

## Features

- 🔐 **Quick Role Activation** — Activate eligible PIM roles with a single command
- 🔓 **Role Deactivation** — Deactivate active roles when no longer needed
- 📋 **Interactive Mode** — User-friendly menu-driven interface for role selection
- ✨ **Beautiful UI** — Polished terminal experience with spinners and colors
- 🔄 **Multi-role Support** — Activate or deactivate multiple roles at once
- 💾 **Presets System** — Save and reuse activation configurations for daily workflows
- 🚀 **Non-interactive Mode** — CLI flags for scripting and automation
- 📊 **Status Tracking** — Real-time feedback on activation/deactivation status
- 📤 **JSON Output** — Machine-readable output for integration with other tools
- 🔔 **Update Notifications** — Automatic update checks with configurable behavior

## Who Is This For?

- **Data Engineers** — Quickly activate roles for ADF, Databricks, and Storage access
- **Data Analysts** — Get Reader access to SQL databases and Log Analytics
- **Backend Developers** — Activate roles needed for local development with managed identity
- **DevOps Engineers** — Streamline cross-environment debugging workflows

## Usage

```bash
# Install globally
npm install -g azpim

# Interactive mode
azpim

# Activate with flags
azpim activate --role "Contributor" --reason "Daily development"

# Use a saved preset
azpim activate --preset morning-setup

# Deactivate roles
azpim deactivate
```

## Challenges

Building this tool required deep understanding of Azure's PIM APIs and authentication flows. Key challenges included:

1. **Azure PIM API complexity** — The difference between `roleEligibilityScheduleRequests` and `roleAssignmentScheduleRequests` took significant research to understand
2. **Authentication flexibility** — Supporting multiple auth methods (Azure CLI, VS Code, managed identity) via `DefaultAzureCredential`
3. **Token refresh** — Handling token refresh for long-running operations
4. **Error handling** — Providing meaningful error messages for common failure scenarios (expired tokens, insufficient permissions, etc.)
5. **CLI UX** — Making the terminal experience feel polished with spinners, colors, and clear feedback

## Outcomes

- **Time saved**: Role activation reduced from ~2 minutes (portal) to ~5 seconds (CLI)
- **Weekly impact**: ~23 minutes saved per week for heavy PIM users
- **Presets**: Common role combinations saved and reused with one command
- **Automation**: CI/CD pipelines can now activate PIM roles programmatically
