#!/usr/bin/env bash
set -e

echo "=== RENDER BRIDGE SHORT ON LINUX VPS ==="
mkdir -p out

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="out/bridge_short_${TIMESTAMP}.mp4"

echo "Output will be saved to: $OUTPUT_FILE"

# Headless Remotion Three.js rendering with Angle OpenGL backend
npx remotion render src/index.ts BridgeShort "$OUTPUT_FILE" \
  --gl=angle \
  --concurrency=4 \
  --log=info

echo "Render finished successfully: $OUTPUT_FILE"
