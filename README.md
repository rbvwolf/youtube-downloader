# YouTube Downloader

A modern, full-stack application designed to search, stream, and download YouTube videos and audio seamlessly. Built with cross-platform compatibility in mind, it features a sleek UI, robust background downloading, and built-in security mechanisms.

## Key Features
* **Smart Search:** Real-time YouTube autocomplete suggestions and fast video searching without needing a YouTube Data API key.
* **Format Flexibility:** Download videos in various qualities (1080p, 720p, 480p) or extract audio only (MP3, M4A, WebM).
* **Built-in Media Player:** Stream your downloaded music and videos directly within the app's native player.
* **Cross-Platform Directory Picker:** Native OS folder selection to save your downloads exactly where you want them.
* **Persistent Settings:** Remembers your download directory and preferred theme (Light/Dark Mode).
* **Security:** Equipped with IP-based rate limiting (`slowapi`), strict input sanitization, and directory traversal protection.

## Tech Stack

### Frontend
* **Framework:** React Native / Expo (Web, Android, iOS ready)
* **Storage:** SQLite (for download history) & AsyncStorage (for settings)
* **Icons:** `@expo/vector-icons` (MaterialIcons)

### Backend
* **Framework:** FastAPI (Python)
* **Core Engine:** `yt-dlp` (Video processing) & `FFmpeg` (Format merging)
* **Concurrency:** `asyncio` & FastAPI Background Tasks
* **Security:** `slowapi` (Rate Limiting) & `pydantic` (Data Validation)

## Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) & npm
* [Python 3.10+](https://www.python.org/)
* [FFmpeg](https://ffmpeg.org/) (Must be installed and added to system PATH)

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo development server (Web)
npx expo start --web
```

## Security Note
This project is intended for personal use and educational purposes. It implements strict backend rate limits and directory constraints to prevent external abuse if hosted publicly. Please respect YouTube's Terms of Service when using this tool.
