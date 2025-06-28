const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Creating Kosign Unlock Distribution Package...\n');

// Configuration
const distDir = 'dist';
const packageName = 'kosign-unlock-standalone';
const packageDir = path.join(distDir, packageName);

// Clean and create directories
console.log('📁 Setting up directories...');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(packageDir, { recursive: true });

// Copy build directory contents directly to package root
console.log('📦 Copying build files...');
execSync(`cp -r build/* "${packageDir}/"`, { stdio: 'inherit' });

// Create startup scripts for different platforms
console.log('🚀 Creating startup scripts...');

// Windows batch file
const windowsScript = `@echo off
echo.
echo ================================
echo   Kosign Unlock - Starting...
echo ================================
echo.

REM Try to start with Python 3 server
python -c "import http.server; import socketserver; import webbrowser; import threading; import time; handler = http.server.SimpleHTTPRequestHandler; httpd = socketserver.TCPServer(('127.0.0.1', 8000), handler); print('Server running at http://localhost:8000'); threading.Timer(1.5, lambda: webbrowser.open('http://localhost:8000')).start(); httpd.serve_forever()" 2>nul

if %errorlevel% neq 0 (
    REM Try Python 2 if Python 3 failed
    python -c "import SimpleHTTPServer; import SocketServer; import webbrowser; import threading; import time; handler = SimpleHTTPServer.SimpleHTTPRequestHandler; httpd = SocketServer.TCPServer(('127.0.0.1', 8000), handler); print('Server running at http://localhost:8000'); threading.Timer(1.5, lambda: webbrowser.open('http://localhost:8000')).start(); httpd.serve_forever()" 2>nul
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ Python not found! 
        echo Opening index.html directly in your default browser...
        echo.
        start index.html
        echo.
        echo 💡 For best experience, install Python and run this script again
        echo    Download from: https://www.python.org
        pause
    )
)`;

fs.writeFileSync(path.join(packageDir, 'start.bat'), windowsScript);

// Unix/Mac shell script
const unixScript = `#!/bin/bash
echo ""
echo "================================"
echo "   Kosign Unlock - Starting..."
echo "================================"
echo ""

# Function to try starting Python server
start_python_server() {
    echo "🚀 Starting local server..."
    
    # Try Python 3 first
    if command -v python3 &> /dev/null; then
        echo "✅ Using Python 3"
        python3 -c "
import http.server
import socketserver
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.5)
    webbrowser.open('http://localhost:8000')

handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(('127.0.0.1', 8000), handler)
print('✅ Server running at: http://localhost:8000')
print('🔒 Kosign Unlock is now available offline!')
print('🛑 Press Ctrl+C to stop the server')
print('')

threading.Thread(target=open_browser).start()
httpd.serve_forever()
"
        return 0
    fi
    
    # Try Python 2 if Python 3 not available
    if command -v python &> /dev/null; then
        echo "✅ Using Python 2"
        python -c "
import SimpleHTTPServer
import SocketServer
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.5)
    webbrowser.open('http://localhost:8000')

handler = SimpleHTTPServer.SimpleHTTPRequestHandler
httpd = SocketServer.TCPServer(('127.0.0.1', 8000), handler)
print('✅ Server running at: http://localhost:8000')
print('🔒 Kosign Unlock is now available offline!')
print('🛑 Press Ctrl+C to stop the server')
print('')

threading.Thread(target=open_browser).start()
httpd.serve_forever()
"
        return 0
    fi
    
    return 1
}

# Try to start Python server
if ! start_python_server; then
    echo ""
    echo "❌ Python not found!"
    echo "Opening index.html directly in your default browser..."
    echo ""
    
    # Try different ways to open the file
    if command -v open &> /dev/null; then
        # macOS
        open index.html
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open index.html
    else
        echo "Please open index.html manually in your browser"
    fi
    
    echo ""
    echo "💡 For best experience, install Python:"
    echo "   macOS: brew install python3"
    echo "   Ubuntu: sudo apt install python3"
    echo "   Or download from: https://www.python.org"
fi`;

fs.writeFileSync(path.join(packageDir, 'start.sh'), unixScript);
execSync(`chmod +x "${path.join(packageDir, 'start.sh')}"`);

// Create README
console.log('📚 Creating README...');
const originalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const readme = `# Kosign Unlock - Standalone Version

This is a completely self-contained version of Kosign Unlock that runs offline with **zero dependencies**.

## Requirements
- **No special requirements!** 
- Just a modern web browser (Chrome, Firefox, Safari, Edge)
- Optional: Python (for better experience with local server)

## Quick Start

### Option 1: Easy Start (Recommended)
**Windows:** Double-click \`start.bat\`  
**Mac/Linux:** Double-click \`start.sh\`

The script will:
- Try to start a local Python server (if available)
- Automatically open your browser
- Fall back to opening the file directly if Python isn't available

### Option 2: Direct File Access
Simply open \`index.html\` in your web browser by double-clicking it.

### Option 3: Manual Server (Best Experience)
If you have Python installed:
\`\`\`bash
# Python 3
python3 -m http.server 8000

# Python 2  
python -m SimpleHTTPServer 8000
\`\`\`
Then open: http://localhost:8000

## Features
✅ **Zero dependencies** - works completely standalone
✅ **Complete offline operation** - no internet required
✅ **All cryptographic functions work locally**
✅ **Secure QR code scanning**
✅ **Multiple vault format support** (V1 legacy + V2 single QR)
✅ **Camera switching** for mobile devices
✅ **Dark theme** optimized for security
✅ **Cross-platform** - works on Windows, Mac, Linux

## Security Notes
🔒 **Maximum Security Design:**
- This version runs completely offline for maximum security
- All vault decryption happens locally in your browser
- No data is sent to any external servers
- No external dependencies to worry about
- For best security, disconnect from internet before use

## Browser Compatibility
✅ Chrome 60+  
✅ Firefox 55+  
✅ Safari 12+  
✅ Edge 79+  

## Troubleshooting

**Camera not working?**
- Make sure you allow camera permissions when prompted
- Try the camera toggle button to switch between front/back cameras

**File access issues?**
- Some browsers restrict local file access for security
- Use the provided startup scripts for best experience
- Or serve the files through any web server

## Version: ${originalPackage.version}
## Created: ${new Date().toISOString().split('T')[0]}

---
**Kosign Unlock** - Secure, offline cryptocurrency vault unlocking tool  
GitHub: https://github.com/xxbtc/kosign-unlock
`;

fs.writeFileSync(path.join(packageDir, 'README.md'), readme);

// Create license file
console.log('⚖️  Creating license...');
const license = `MIT License

Copyright (c) ${new Date().getFullYear()} Kosign Unlock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

fs.writeFileSync(path.join(packageDir, 'LICENSE'), license);

// Create ZIP file
console.log('🗜️  Creating ZIP archive...');
process.chdir(distDir);
execSync(`zip -r "${packageName}.zip" "${packageName}/"`, { stdio: 'inherit' });
process.chdir('../');

console.log('\n✅ Distribution package created successfully!');
console.log('📍 Location:', path.resolve(distDir, `${packageName}.zip`));
console.log('📦 Package size:', (fs.statSync(path.join(distDir, `${packageName}.zip`)).size / 1024 / 1024).toFixed(2), 'MB');

console.log('\n🎉 Done! Users can now:');
console.log('1. Download the ZIP file');
console.log('2. Extract it anywhere'); 
console.log('3. Run start.bat (Windows) or start.sh (Mac/Linux)');
console.log('4. Use Kosign Unlock completely offline!\n'); 