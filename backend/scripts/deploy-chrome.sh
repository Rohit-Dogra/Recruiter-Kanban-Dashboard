#!/bin/bash

# Production deployment script for Chrome installation
# Run this on your production server to install Chrome for PDF generation

echo "=== HirerMind Chrome Installation Script ==="
echo "Installing Chrome for PDF generation..."

# Update system packages
echo "Updating system packages..."
sudo apt-get update -y

# Install required dependencies
echo "Installing dependencies..."
sudo apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    software-properties-common

# Add Google Chrome repository
echo "Adding Google Chrome repository..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list

# Update package list with new repository
echo "Updating package list..."
sudo apt-get update -y

# Install Google Chrome
echo "Installing Google Chrome..."
sudo apt-get install -y google-chrome-stable

# Verify installation
if command -v google-chrome &> /dev/null; then
    CHROME_PATH=$(which google-chrome)
    echo "✅ Google Chrome installed successfully!"
    echo "Chrome path: $CHROME_PATH"
    echo "Chrome version: $(google-chrome --version)"
    
    # Update environment variable
    echo "Updating Chrome path in environment..."
    echo "CHROME_PATH=$CHROME_PATH" >> /var/app/current/.env
    
    echo "✅ Chrome installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your application: pm2 restart all"
    echo "2. Test offer letter generation"
    
else
    echo "❌ Chrome installation failed. Trying Chromium as fallback..."
    
    # Install Chromium as fallback
    sudo apt-get install -y chromium-browser
    
    if command -v chromium-browser &> /dev/null; then
        CHROMIUM_PATH=$(which chromium-browser)
        echo "✅ Chromium installed successfully!"
        echo "Chromium path: $CHROMIUM_PATH"
        echo "Chromium version: $(chromium-browser --version)"
        
        # Update environment variable
        echo "CHROME_PATH=$CHROMIUM_PATH" >> /var/app/current/.env
        
        echo "✅ Chromium installation completed successfully!"
    else
        echo "❌ Both Chrome and Chromium installation failed!"
        echo "The application will use fallback PDF generation."
        exit 1
    fi
fi

# Set proper permissions
echo "Setting proper permissions..."
sudo chmod +x $(which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || echo "/usr/bin/google-chrome")

# Test Chrome with required flags
echo "Testing Chrome with required flags..."
CHROME_EXEC=$(which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null)
if [ -n "$CHROME_EXEC" ]; then
    $CHROME_EXEC --version --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu
    if [ $? -eq 0 ]; then
        echo "✅ Chrome test successful!"
    else
        echo "⚠️  Chrome test failed, but installation completed. Check application logs."
    fi
fi

echo ""
echo "=== Installation Summary ==="
echo "Chrome/Chromium: $(which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || echo 'Not found')"
echo "Environment updated: /var/app/current/.env"
echo "Ready for PDF generation!"
echo ""
echo "Remember to restart your application to apply changes."