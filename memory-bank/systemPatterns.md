# System Patterns

## Sistem Mimarisi
Proje klasik bir İstemci-Sunucu (Client-Server) mimarisine dayanmaktadır. Mobil cihazlarda çalışan React Native (Frontend) uygulaması, veri işlemlerini ve video indirmelerini yöneten Python FastAPI (Backend) sunucusuyla API aracılığıyla konuşur.

### Frontend (React Native)
- **Modüler Yapı:** Component bazlı geliştirme (örn: `SearchBar`, `VoiceModal`, `VideoCard`, `QualityBottomSheet`).
- **State Management:** İsteklerin ve uygulamanın durumunu yönetmek için React Hooks (veya gerekli görülürse Context/Zustand).
- **Asenkron İşlemler:** Backend ile `axios` kullanılarak asenkron `Promise` tabanlı haberleşme.
- **Background Processes:** İndirmenin uygulama kapalıyken veya arka plandayken devam etmesi için Background Fetch görevleri.

### Backend (Python/FastAPI)
- **RESTful API:** 
  - `GET /search?q={query}`: `yt-dlp` veya YouTube API üzerinden arama yapıp özet sonuçları JSON olarak döner.
  - `GET /info/{video_id}`: `yt-dlp` ile formatları okur ve kullanılabilir kaliteleri (video, boyut, ses vb.) listeler.
  - `POST /download`: Seçilen kalite ve video id'sine göre indirme başlatır.
- **Core İşleyici:** `yt-dlp` arka planda ana indirme motorudur, gerektiğinde `FFmpeg` ile görüntü ve ses birleştirme (multiplexing) işlemleri için sistem komutları kullanılır.
- **Asenkron API Sunucusu:** FastAPI'nin asenkron yapısı (`async def`) indirme yaparken diğer istekleri bloklamamak için kullanılacaktır.

## Tasarım Kalıpları
- **Material 3 (M3):** Bileşen kalıpları (Component Patterns) M3 kurallarına göre oluşturulur (Tam yuvarlatılmış köşeler, Material Elevation, Chips, Bottom Nav vb.).
- **Google Stitch:** Arka planda blur efektleri (Secondary Container renk tonları), sayfa geçişlerindeki yumuşaklık ve standart Google uygulamalarının tutarlılığı izlenecektir.

## Kritik Uygulama Yolları (Critical Paths)
1. **Pano (Clipboard) Algılama:** Uygulama açılışında `AppState` incelenir, eğer panoda YouTube linki varsa doğrudan modal gösterilir.
2. **Sesli Arama Akışı:** Ses motoru `onSpeechResults` anında tetiklenir ve sonuç `searchQuery`'ye set edilip doğrudan `/search` endpoint'ine gönderilir. Ekstra bir butona basmak gerekmez.
3. **Format Filtreleme:** `yt-dlp`'den gelen ham format listesi doğrudan UI'a yansıtılmaz. Backend, bu formatları sadeleştirerek 4-5 standart seçeneğe indirgeli şekilde (Örn: 1080p, 720p, 480p, MP3) olarak sunar.
