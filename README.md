
# NUCLEUS Terminal Ops v2.4.0

A high-performance terminal UI for jumphost management, server scanning, and web vulnerability analysis.

## 🐧 Linux Packaging (.deb & .rpm)

You can build native Linux installers directly using npm.

### 1. Build the packages
Ensure you have installed the project dependencies first:
```bash
npm install
npm run build:linux
```

### 2. Install on Debian/Ubuntu
```bash
sudo dpkg -i dist_desktop/nucleus-terminal_2.4.0_amd64.deb
# If there are missing dependencies:
sudo apt-get install -f
```

### 3. Install on Red Hat/Fedora/CentOS
```bash
sudo rpm -i dist_desktop/nucleus-terminal-2.4.0.x86_64.rpm
```

## 🚀 Development Mode (Electron)
To run the terminal in an Electron window with hot-reload enabled:
```bash
npm run electron-dev
```

## 🌐 Web Mode
To run in a standard browser:
```bash
npm run dev
```

## 🛠️ Security Setup
Create a `.env` file and add:
```env
VITE_API_KEY=your_gemini_api_key
```
