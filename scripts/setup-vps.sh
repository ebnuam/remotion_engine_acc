#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Setting up VPS System Dependencies for Remotion Three.js"
echo "=========================================================="

sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  ffmpeg \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libgbm1 \
  libasound2t64 \
  fonts-freefont-ttf

echo "Installing npm dependencies..."
npm install

echo "=========================================================="
echo " Setup complete! You can now run:"
echo "   npm run render:linux"
echo "=========================================================="
