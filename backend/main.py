from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import yt_dlp
import os
import re

app = FastAPI(title="Youtube-Downloader API")

# Frontend (React Native) ile haberleşebilmek için CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# İstek doğrultusunda videoların kaydedileceği dizin
DOWNLOAD_DIR = r"R:\Code\Youtube-Downloader-Downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Frontend'in indirilen dosyalara doğrudan erişebilmesi için StaticFiles tanımlaması
app.mount("/downloads", StaticFiles(directory=DOWNLOAD_DIR), name="downloads")

class DownloadRequest(BaseModel):
    video_id: str
    quality: str  # Beklenen değerler: '1080p', '720p', '480p', 'audio'

@app.get("/search")
async def search(q: str, max_results: int = 10):
    """
    YouTube Data API kullanmadan yt-dlp üzerinden arama simülasyonu yapar.
    """
    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # ytsearch ile API key gereksinimi olmadan arama
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

@app.get("/info/{video_id}")
async def get_info(video_id: str):
    """
    Belirtilen videonun temel meta verilerini ve indirme kalite opsiyonlarını döner.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    ydl_opts = {
        'quiet': True,
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
            
            def get_size(height=None, is_audio=False):
                best_size = 0
                for f in formats:
                    size = f.get('filesize') or f.get('filesize_approx') or 0
                    if is_audio:
                        if f.get('vcodec') == 'none' and f.get('acodec') != 'none':
                            if size > best_size: best_size = size
                    else:
                        if f.get('height') == height and f.get('vcodec') != 'none':
                            # Just video stream size, yt-dlp merges video+audio so true size is video+audio
                            # We just approximate by adding the best audio size later if we want, or just return max video size
                            if size > best_size: best_size = size
                return best_size

            audio_size = get_size(is_audio=True)
            
            def format_mb(video_bytes):
                # Approximation: video size + audio size
                total = video_bytes + audio_size if video_bytes else 0
                if not total and not audio_size: return "-- MB"
                if not video_bytes:  # Audio only
                    return f"{audio_size / (1024 * 1024):.1f} MB"
                return f"{total / (1024 * 1024):.1f} MB"

            qualities = [
                {"quality": "audio", "label": "Audio Only (MP3)", "size": format_mb(0)},
                {"quality": "1080p", "label": "Full HD (1080p)", "size": format_mb(get_size(1080))},
                {"quality": "720p", "label": "HD (720p)", "size": format_mb(get_size(720))},
                {"quality": "480p", "label": "Standard (480p)", "size": format_mb(get_size(480))},
            ]
            
            return {
                "details": details,
                "qualities": qualities
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def download_video_sync(video_id: str, quality: str):
    """
    Arka planda çalışan yt-dlp indirme ve ffmpeg birleştirme fonksiyonu.
    """
    url = f"https://www.youtube.com/watch?v={video_id}"
    
    ydl_opts: dict = {
        'quiet': False,
        'noplaylist': True,
        'concurrent_fragment_downloads': 10,
        'http_chunk_size': 10485760,
    }

    progress_file = os.path.join(DOWNLOAD_DIR, f"{video_id}_progress.json")
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            try:
                percent = d.get('_percent_str', '0.0%').strip()
                # Clean up ansi escape sequences from yt-dlp strings
                import re
                percent = re.sub(r'\x1b[^m]*m', '', percent)

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
            except Exception as e:
                pass
        elif d['status'] == 'finished':
            try:
                import json
                final_filename = os.path.basename(d.get('filename', ''))
                # Mirror the replacements done by the Exec post-processor
                final_filename = final_filename.replace('.mpg.mp3', '.mp3').replace('.mp4.mp3', '.mp3')
                import re
                final_filename = re.sub(r'\.mpg (\d+p)\.mp4', r' \1.mp4', final_filename)
                final_filename = re.sub(r'\.mp4 (\d+p)\.mp4', r' \1.mp4', final_filename)
                
                with open(progress_file, 'w') as f:
                    json.dump({"progress": "100", "speed": "Done", "eta": 0, "completed": True, "filename": final_filename}, f)
            except:
                pass

    ydl_opts['progress_hooks'] = [progress_hook]

    # Use outtmpl with a python function or a specific replacement to strip .mpg if it exists in the title
    # yt-dlp 2023+ allows python dicts. We will just use the standard template, but clean up the title using the 'replace' or 'autonumber' no, just use a custom outtmpl class or postprocessor.
    # Actually, the easiest way is to let yt-dlp download, but since we define outtmpl:
    
    if quality == 'audio':
        # Sadece ses modunda mp3'e çevirme işlemi (FFmpeg kullanır)
        ydl_opts['outtmpl'] = os.path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s')
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }, {
            # Strip .mpg and other unwanted extensions from the final filename
            'key': 'Exec',
            'exec_cmd': 'python -c "import os, sys; p = sys.argv[1]; d, f = os.path.split(p); f_new = f.replace(\'.mpg.mp3\', \'.mp3\').replace(\'.mp4.mp3\', \'.mp3\'); os.rename(p, os.path.join(d, f_new)) if f != f_new else None"',
            'when': 'post_process'
        }]
    else:
        # Video kalitelerinde donanım uyumluluğu (Opus codec sorunu vb.) için m4a/aac ve mp4 eşleşmesi
        height = quality.replace('p', '')
        # User requested: "Başlık 1080p.mp4"
        ydl_opts['outtmpl'] = os.path.join(DOWNLOAD_DIR, f'%(title)s {quality}.%(ext)s')
        ydl_opts['format'] = f'bestvideo[ext=mp4][height<={height}]+bestaudio[ext=m4a]/best[ext=mp4]/best'
        ydl_opts['merge_output_format'] = 'mp4'
        ydl_opts['postprocessors'] = [{
            'key': 'Exec',
            'exec_cmd': f'python -c "import os, sys; p = sys.argv[1]; d, f = os.path.split(p); f_new = f.replace(\'.mpg {quality}.mp4\', \' {quality}.mp4\').replace(\'.mp4 {quality}.mp4\', \' {quality}.mp4\'); os.rename(p, os.path.join(d, f_new)) if f != f_new else None"',
            'when': 'post_process'
        }]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        print(f"İndirme başarısız {video_id}: {e}")
        try:
            import json
            with open(progress_file, 'w') as f:
                json.dump({"error": str(e)}, f)
        except: pass

@app.post("/download")
async def download(request: DownloadRequest, background_tasks: BackgroundTasks):
    """
    FastAPI Background Tasks kullanarak indirmeyi başlatır.
    """
    background_tasks.add_task(download_video_sync, request.video_id, request.quality)
    return {
        "status": "success",
        "message": f"İndirme işlemi ({request.quality}) arka planda başlatıldı.",
        "video_id": request.video_id,
        "download_directory": DOWNLOAD_DIR
    }

@app.get("/video-info")
async def get_video_info(video_id: str):
    """
    İndirme yapmadan sadece video bilgilerini çeken endpoint.
    Mevcut formatların çözünürlüklerini ve filesize listesini MB döner.
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
