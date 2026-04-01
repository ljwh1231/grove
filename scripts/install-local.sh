#!/bin/bash
set -e

# Install Grove.app locally without Homebrew (for testing)
APP_SRC="release/Grove-darwin-$(uname -m | sed 's/aarch64/arm64/')/Grove.app"

if [ ! -d "$APP_SRC" ]; then
  echo "Grove.app not found. Run 'bash scripts/package.sh' first."
  exit 1
fi

echo "Installing Grove.app to /Applications..."
cp -R "$APP_SRC" /Applications/Grove.app
echo "Done. You can now launch Grove from /Applications or Spotlight."
