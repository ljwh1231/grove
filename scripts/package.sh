#!/bin/bash
set -e

VERSION=$(node -p "require('./package.json').version")
ARCH=${1:-$(uname -m)}

# Normalize arch name
if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  ELECTRON_ARCH="arm64"
elif [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "x64" ]; then
  ELECTRON_ARCH="x64"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

echo "=== Grove v${VERSION} — Building for darwin-${ELECTRON_ARCH} ==="

# 1. Build frontend + electron
echo "[1/3] Building..."
npm run build

# 2. Package with electron-packager
echo "[2/3] Packaging..."
./node_modules/.bin/electron-packager . Grove \
  --platform=darwin \
  --arch=${ELECTRON_ARCH} \
  --out=release \
  --icon=build/icon.icns \
  --overwrite \
  --ignore="^/src" \
  --ignore="^/electron" \
  --ignore="^/design" \
  --ignore="^/build" \
  --ignore="^/scripts" \
  --ignore="^/homebrew-tap" \
  --ignore="^/\.claude" \
  --ignore="^/node_modules/(@types|typescript|vite|@vitejs|concurrently|wait-on|electron-builder|@electron/packager)" \
  --app-bundle-id=com.grove.app \
  --app-category-type=public.app-category.developer-tools

# 3. Create zip
echo "[3/3] Creating zip..."
ZIP_NAME="Grove-${VERSION}-${ELECTRON_ARCH}.zip"
cd release
ditto -c -k --sequesterRsrc --keepParent "Grove-darwin-${ELECTRON_ARCH}/Grove.app" "${ZIP_NAME}"

SHA=$(shasum -a 256 "${ZIP_NAME}" | awk '{print $1}')
SIZE=$(ls -lh "${ZIP_NAME}" | awk '{print $5}')

echo ""
echo "=== Done ==="
echo "  App:  release/Grove-darwin-${ELECTRON_ARCH}/Grove.app"
echo "  Zip:  release/${ZIP_NAME} (${SIZE})"
echo "  SHA:  ${SHA}"
echo ""
echo "To update the Cask formula, replace the sha256 for ${ELECTRON_ARCH}:"
echo "  sha256 \"${SHA}\""
