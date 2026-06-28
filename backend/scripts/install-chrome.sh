#!/bin/bash

# Install Chrome on Ubuntu/Debian production server
# Run this script on your production server to install Chrome

echo "Installing Google Chrome for PDF generation..."

# Update package list
sudo apt-get update

# Install dependencies
sudo apt-get install -y wget gnupg

# Add Google Chrome repository
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list

# Update package list again
sudo apt-get update

# Install Google Chrome
sudo apt-get install -y google-chrome-stable

# Verify installation
if command -v google-chrome &> /dev/null; then
    echo "Google Chrome installed successfully at: $(which google-chrome)"
    google-chrome --version
else
    echo "Chrome installation failed. Trying Chromium as fallback..."
    sudo apt-get install -y chromium-browser
    if command -v chromium-browser &> /dev/null; then
        echo "Chromium installed successfully at: $(which chromium-browser)"
        chromium-browser --version
    else
        echo "Both Chrome and Chromium installation failed!"
        exit 1
    fi
fi

echo "Browser installation completed!"