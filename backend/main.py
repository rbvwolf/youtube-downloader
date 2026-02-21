from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import os

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
        'outtmpl': os.path.join(DOWNLOAD_DIR, '%(title)s [%(id)s].%(ext)s'),
        'quiet': False,
        'noplaylist': True,
    }
    
    if quality == 'audio':
        # Sadece ses modunda mp3'e çevirme işlemi (FFmpeg kullanır)
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    else:
        # Video kalitelerinde, istenen yüksekliğe (.e.g 1080) eş veya daha düşük olan best_video + best_audio. (FFmpeg birleştirir)
        height = quality.replace('p', '')
        ydl_opts['format'] = f'bestvideo[height<={height}]+bestaudio/best'
        ydl_opts['merge_output_format'] = 'mp4'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
    except Exception as e:
        print(f"İndirme başarısız {video_id}: {e}")

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
