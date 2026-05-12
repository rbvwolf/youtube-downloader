from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import yt_dlp
import os
import re
import shutil
import subprocess

app = FastAPI(title="Youtube-Downloader API")

import pathlib

# CORS Configuration for Frontend (React Native) communication
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",  # Used regex because allow_origins=["*"] conflicts with allow_credentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory where videos will be saved
# Dynamic: defaults to the OS's user 'Downloads' directory
# Can be overridden via environment variable: DOWNLOAD_DIR=/custom/path
default_downloads = str(pathlib.Path.home() / "Downloads")
DOWNLOAD_DIR = os.environ.get("DOWNLOAD_DIR", default_downloads)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# /downloads/{filename} — tarayıcıya zorla indirme yaptıran endpoint
@app.get("/downloads/{filename:path}")
async def serve_download(filename: str):
    filepath = os.path.join(DOWNLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    return FileResponse(
        filepath,
        filename=os.path.basename(filepath)
    )


def check_ffmpeg():
    """Checks if FFmpeg is installed on the system."""
    if shutil.which("ffmpeg") is None:
        print("\n" + "="*60)
        print("⚠️  WARNING: FFmpeg not found!")
        print("   Without FFmpeg, 1080p/720p video downloads")
        print("   (video+audio merging) will fail.")
        print("   Installation: https://ffmpeg.org/download.html")
        print("   Windows: winget install ffmpeg")
        print("   Linux:   sudo apt install ffmpeg")
        print("   macOS:   brew install ffmpeg")
        print("="*60 + "\n")
    else:
        try:
            result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
            version_line = result.stdout.split("\n")[0] if result.stdout else "unknown version"
            print(f"✅ FFmpeg found: {version_line}")
        except Exception:
            print("✅ FFmpeg found.")

check_ffmpeg()
print(f"📁 Download directory: {DOWNLOAD_DIR}")

import asyncio

def _open_picker():
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    folder_path = filedialog.askdirectory(parent=root, title="Select Download Folder")
    root.destroy()
    return folder_path

@app.get("/api/get_download_dir")
async def get_download_dir():
    return {"path": DOWNLOAD_DIR}

@app.get("/api/pick_directory")
async def pick_directory():
    try:
        folder_path = await asyncio.to_thread(_open_picker)
        return {"path": folder_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class DownloadRequest(BaseModel):
    video_id: str
    quality: str  # Beklenen değerler: '1080p', '720p', '480p', 'audio'
    download_path: Optional[str] = None

# Global dictionary to track active downloads for cancellation
active_downloads = {}
# Quick cancellation flags — checked during progress_hook
cancel_flags = {}

@app.get("/search")
async def search(q: str, max_results: int = 10):
    """
    Simulates a search via yt-dlp without needing YouTube Data API.
    """
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # ytsearch without API key
            result = ydl.extract_info(f"ytsearch{max_results}:{q}", download=False)
            entries = result.get('entries', [])
            
            search_results = []
            for entry in entries:
                search_results.append({
                    "id": entry.get("id"),
                    "title": entry.get("title"),
                    "thumbnails": entry.get("thumbnails"),
                    "duration": entry.get("duration"),
                    "view_count": entry.get("view_count")
                })
            return {"results": search_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/suggestions")
async def get_suggestions(q: str):
    """
    Fetches search suggestions from YouTube's autocomplete API.
    Returns: { "suggestions": ["sug1", "sug2", ...] }
    """
    import requests
    try:
        url = f"http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q={q}"
        response = requests.get(url, timeout=5, headers={
            'Accept-Language': 'tr-TR,tr;q=0.9',
            'User-Agent': 'Mozilla/5.0'
        })
        response.raise_for_status()
        data = response.json()  # Format: ["query", ["sug1", "sug2", ...]]
        if isinstance(data, list) and len(data) > 1 and isinstance(data[1], list):
            suggestions = [s for s in data[1] if isinstance(s, str)]
            print(f"[Suggestions] q='{q}' => {suggestions[:5]}")
            return {"suggestions": suggestions[:10]}
        return {"suggestions": []}
    except Exception as e:
        print(f"[Suggestions ERROR] q='{q}': {e}")
        return {"suggestions": []}

# /suggest alias — same response format as /suggestions
@app.get("/suggest")
async def suggest_alias(q: str):
    return await get_suggestions(q)

@app.get("/info/{video_id}")
async def get_info(video_id: str):
    """
    Returns basic metadata and available download quality options for the specified video.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        'cookiefile': 'cookies.txt',
        'js_runtimes': {'node': {}},
        'nocheckcertificate': True,
        'youtube_include_dash_manifest': False,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            details = {
                "id": info.get("id"),
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration")
            }
            
            formats = info.get('formats', [])
            
            def get_size(height=None, is_audio=False, ext=None):
                best_size = 0
                for f in formats:
                    size = f.get('filesize') or f.get('filesize_approx') or 0
                    if is_audio:
                        if f.get('vcodec') == 'none' and f.get('acodec') != 'none':
                            if ext:
                                if f.get('ext') == ext and size > best_size: best_size = size
                            else:
                                if size > best_size: best_size = size
                    else:
                        if f.get('height') == height and f.get('vcodec') != 'none':
                            # Just video stream size, yt-dlp merges video+audio so true size is video+audio
                            # We just approximate by adding the best audio size later if we want, or just return max video size
                            if size > best_size: best_size = size
                return best_size

            audio_size = get_size(is_audio=True)
            m4a_size = get_size(is_audio=True, ext='m4a')
            webm_size = get_size(is_audio=True, ext='webm')
            
            def format_mb(video_bytes):
                # Approximation: video size + audio size
                total = video_bytes + audio_size if video_bytes else 0
                if not total and not audio_size: return "-- MB"
                if not video_bytes:  # Audio only
                    return f"{audio_size / (1024 * 1024):.1f} MB"
                return f"{total / (1024 * 1024):.1f} MB"

            qualities = [
                {"quality": "audio", "label": "Audio Only (MP3)", "size": format_mb(0)}
            ]
            
            if m4a_size > 0:
                qualities.append({"quality": "audio_m4a", "label": "Audio Only (M4A)", "size": f"{m4a_size / (1024 * 1024):.1f} MB"})
            if webm_size > 0:
                qualities.append({"quality": "audio_webm", "label": "Audio Only (WebM)", "size": f"{webm_size / (1024 * 1024):.1f} MB"})

            qualities.extend([
                {"quality": "1080p", "label": "Full HD (1080p)", "size": format_mb(get_size(1080))},
                {"quality": "720p", "label": "HD (720p)", "size": format_mb(get_size(720))},
                {"quality": "480p", "label": "Standard (480p)", "size": format_mb(get_size(480))},
            ])
            
            return {
                "details": details,
                "qualities": qualities
            }
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        if 'Sign in to confirm' in error_msg or 'bot' in error_msg.lower():
            return {
                "details": {
                    "id": video_id,
                    "title": "Failed to fetch video info (Bot Protection)",
                    "thumbnail": "https://via.placeholder.com/320x180?text=Bot+Protection",
                    "duration": 0
                },
                "qualities": [
                    {"quality": "audio", "label": "Audio Only (MP3)", "size": "-- MB"},
                    {"quality": "audio_m4a", "label": "Audio Only (M4A)", "size": "-- MB"},
                    {"quality": "audio_webm", "label": "Audio Only (WebM)", "size": "-- MB"},
                    {"quality": "1080p", "label": "Full HD (1080p)", "size": "-- MB"},
                    {"quality": "720p", "label": "HD (720p)", "size": "-- MB"},
                    {"quality": "480p", "label": "Standard (480p)", "size": "-- MB"},
                ]
            }
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def download_video_sync(video_id: str, quality: str, download_path: str = None):
    """
    Background yt-dlp download and ffmpeg merging function.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    actual_dir = download_path if download_path else DOWNLOAD_DIR
    os.makedirs(actual_dir, exist_ok=True)
    
    ydl_opts: dict = {
        'cookiefile': 'cookies.txt',
        'js_runtimes': {'node': {}},
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'concurrent_fragment_downloads': 4,  # Reduced to 4 to limit speed and prevent bot protection
        'buffersize': 1024 * 64,               # 64KB buffer for smoother writes
        'nocheckcertificate': True,
        'youtube_include_dash_manifest': False,
    }

    progress_file = os.path.join(DOWNLOAD_DIR, f"{video_id}_progress.json")
    
    def progress_hook(d):
        # Fast cancellation check — checked via cancel_flags or active_downloads
        if cancel_flags.get(video_id) or not active_downloads.get(video_id, True):
            raise Exception('CANCELLED')

        if d['status'] == 'downloading':
            try:
                percent = d.get('_percent_str', '0.0%').strip()
                import re as _re
                percent = _re.sub(r'\x1b[^m]*m', '', percent)

                speed_bytes = d.get('speed')
                if speed_bytes:
                    speed_mb = speed_bytes / 1024 / 1024
                    speed_str = f"{speed_mb:.1f} MB/s"
                else:
                    speed_str = "0.0 MB/s"

                eta = d.get('eta', 0)

                import json
                with open(progress_file, 'w') as f:
                    json.dump({"progress": percent.replace('%', ''), "speed": speed_str, "eta": eta}, f)
            except Exception:
                pass
        # 'finished' status only arrives when raw file is downloaded (pre-ffmpeg)
        # We send the completion signal in postprocessor_hook.

    def postprocessor_hook(d):
        """Called after ALL processing (including ffmpeg conversion) is finished."""
        if d.get('status') != 'finished':
            return
        try:
            import json
            final_filepath = d.get('info_dict', {}).get('filepath') or d.get('filename', '')
            if not final_filepath:
                return
            with open(progress_file, 'w') as f:
                json.dump({"progress": "100", "speed": "Done", "eta": 0, "completed": True, "filename": final_filepath}, f)
            # Clear progress file after 15 seconds
            import threading
            def _cleanup():
                import time
                time.sleep(15)
                try:
                    if os.path.exists(progress_file):
                        os.remove(progress_file)
                except:
                    pass
            threading.Thread(target=_cleanup, daemon=True).start()
        except Exception as e:
            print("Postprocessor hook error:", e)

    ydl_opts['progress_hooks'] = [progress_hook]
    ydl_opts['postprocessor_hooks'] = [postprocessor_hook]

    # Use outtmpl with a python function or a specific replacement to strip .mpg if it exists in the title
    # yt-dlp 2023+ allows python dicts. We will just use the standard template, but clean up the title using the 'replace' or 'autonumber' no, just use a custom outtmpl class or postprocessor.
    # Actually, the easiest way is to let yt-dlp download, but since we define outtmpl:
    
    if quality.startswith('audio'):
        ydl_opts['outtmpl'] = os.path.join(actual_dir, '%(title)s.%(ext)s')

        if quality == 'audio_m4a':
            ydl_opts['format'] = 'bestaudio[ext=m4a]/bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'm4a',
                'preferredquality': '192',
            }]
        elif quality == 'audio_webm':
            ydl_opts['format'] = 'bestaudio[ext=webm]/bestaudio/best'
            # WebM audio codec is downloaded without conversion, no extra postprocessor needed
        else:
            # audio → MP3
            ydl_opts['format'] = 'bestaudio/best'
            ydl_opts['postprocessors'] = [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }]
    else:
        # Video quality — format: "Title 1080p.mp4"
        ydl_opts['outtmpl'] = os.path.join(actual_dir, f'%(title)s {quality}.%(ext)s')
        ydl_opts['format'] = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        ydl_opts['merge_output_format'] = 'mp4'

    try:
        active_downloads[video_id] = True
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        if 'Sign in to confirm' in error_msg or 'bot' in error_msg.lower():
            print(f"[Bot Protection] {video_id}: YouTube IP ban or JS challenge failed.")
            try:
                import json
                with open(progress_file, 'w') as f:
                    json.dump({"error": "YouTube Bot Protection Triggered. Please change IP or wait 5 mins", "formats": []}, f)
            except: pass
            return
        
        is_cancelled = 'CANCELLED' in str(e)
        print(f"{'Cancelled' if is_cancelled else 'Download failed'} {video_id}: {e}")
    except Exception as e:
        is_cancelled = 'CANCELLED' in str(e)
        print(f"{'Cancelled' if is_cancelled else 'Download failed'} {video_id}: {e}")

        if is_cancelled:
            # Clean up all temporary files for the cancelled download
            import glob
            patterns = [
                os.path.join(actual_dir, f'*.part'),
                os.path.join(actual_dir, f'*.ytdl'),
                os.path.join(actual_dir, f'*.part-Frag*'),
            ]
            for pattern in patterns:
                for temp_file in glob.glob(pattern):
                    try:
                        os.remove(temp_file)
                        print(f"[Cleanup] Deleted: {temp_file}")
                    except Exception as ce:
                        print(f"[Cleanup] Failed to delete {temp_file}: {ce}")
            # Delete the temporary progress file immediately
            try:
                if os.path.exists(progress_file):
                    os.remove(progress_file)
            except: pass
        else:
            try:
                import json
                with open(progress_file, 'w') as f:
                    json.dump({"error": str(e)}, f)
            except: pass
    finally:
        cancel_flags.pop(video_id, None)
        if video_id in active_downloads:
            del active_downloads[video_id]
        # Delete progress file after 5s on error/cancel
        import threading
        def _cleanup_on_cancel():
            import time
            time.sleep(5)
            try:
                if os.path.exists(progress_file):
                    os.remove(progress_file)
            except: pass
        threading.Thread(target=_cleanup_on_cancel, daemon=True).start()

@app.post("/cancel/{video_id}")
async def cancel_download(video_id: str):
    """
    Cancels an active download. Sets both cancel_flags and active_downloads flag.
    """
    cancel_flags[video_id] = True
    active_downloads[video_id] = False
    return {"status": "success", "message": "Cancel request sent"}

@app.post("/download")
async def download(request: DownloadRequest, background_tasks: BackgroundTasks):
    """
    Starts the download using FastAPI Background Tasks.
    """
    background_tasks.add_task(download_video_sync, request.video_id, request.quality, request.download_path)
    return {
        "status": "success",
        "message": f"Download task ({request.quality}) started in background.",
        "video_id": request.video_id,
        "download_directory": request.download_path or DOWNLOAD_DIR
    }

@app.get("/video-info")
async def get_video_info(video_id: str):
    """
    Endpoint that fetches video info without downloading.
    Returns resolutions and filesize list in MB.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {'quiet': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            
            result_formats = []
            for f in formats:
                size_bytes = f.get('filesize') or f.get('filesize_approx') or 0
                size_mb = round(size_bytes / (1024 * 1024), 2) if size_bytes else 0
                
                resolution = f.get('resolution') or f.get('format_note') or f"{f.get('width', '')}x{f.get('height', '')}"
                
                result_formats.append({
                    "format_id": f.get('format_id'),
                    "ext": f.get('ext'),
                    "resolution": resolution,
                    "filesize_mb": size_mb,
                    "vcodec": f.get('vcodec'),
                    "acodec": f.get('acodec')
                })
                
            return {
                "id": info.get("id"),
                "title": info.get("title"),
                "formats": result_formats
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress/{video_id}")
async def get_progress(video_id: str):
    """
    Returns the real-time download progress from the JSON file created by yt-dlp hooks.
    """
    import json
    progress_file = os.path.join(DOWNLOAD_DIR, f"{video_id}_progress.json")
    if os.path.exists(progress_file):
        try:
            with open(progress_file, 'r') as f:
                data = json.load(f)
                return data
        except:
             return {"progress": 0, "speed": "0.0 MB/s", "eta": 0}
    return {"progress": 0, "speed": "0.0 MB/s", "eta": 0}

@app.get("/play")
async def play_local_file(filepath: str):
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)
