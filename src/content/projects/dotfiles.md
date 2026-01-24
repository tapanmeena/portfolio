---
title: "Dotfiles"
description: "My personal development environment configuration. Includes shell configs, editor settings, and automated setup scripts."
techStack:
  - Bash
  - PowerShell
  - Lua
  - Git
category: "Developer Tools"
repoUrl: "https://github.com/tapanmeena/dotfiles"
startDate: 2023-01-15
status: "in-progress"
featured: false
draft: false
---

## Overview

A carefully curated collection of configuration files and scripts that set up my development environment across different machines. Supports both macOS and Windows with WSL.

## What's Included

- **Shell Configuration**: Zsh with Oh My Zsh, custom aliases, and functions
- **Neovim Setup**: Lua-based configuration with LSP support
- **Git Configuration**: Global gitconfig and gitignore
- **Terminal Emulators**: WezTerm and Windows Terminal configs
- **PowerShell Profile**: Custom prompt and utility functions

## Installation

The repository includes a bootstrap script that:

1. Detects the operating system
2. Installs required dependencies via package managers
3. Symlinks configuration files to appropriate locations
4. Sets up shell completions and plugins

## Philosophy

- Keep configurations minimal and well-documented
- Prefer built-in features over plugins when possible
- Maintain cross-platform compatibility
- Version control everything
