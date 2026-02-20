# Technical Context

## Frontend (Mobil - React Native)
- **Framework:** React Native (Expo kullanımı tercih edilebilir çünkü native kod integrasyonu `expo-dev-client` ile çok daha hızlıdır, ancak `@react-native-voice/voice` plugin ayarları dikkatli yapılmalıdır).
- **Ağ İstekleri:** Axios
- **Yönlendirme (Routing):** React Navigation (Tab Navigator ve Stack Navigator iç içe geçecek).
- **Ses Tanıma Motoru:** `@react-native-voice/voice` (Cihazın yerleşik Speech-to-Text motorunu kullanır, tr-TR desteği).
- **UI:** Özelleştirilmiş Material 3 bileşenleri.

## Backend (Sunucu - Python)
- **Dil:** Python 3.10+
- **Framework:** FastAPI (Uvicorn ile asenkron çalışma)
- **Kütüphaneler:** 
  - `yt-dlp`: Videoları bulmak ve indirmek için çekirdek kütüphane.
  - Sistemin kurulu bağımlılığı: `FFmpeg` (Video ile sesi birleştirmek (muxing) veya farklı kaliteleri işlemek için yt-dlp tarafından arka planda zorunlu olarak kullanılır).

## Veritabanı (Local)
- **Veritabanı:** `SQLite` (React Native ortamında `expo-sqlite` veya `react-native-sqlite-storage`)
- **Kullanım Amacı:** Kullanıcının daha önce indirdiği videoların meta verilerini (Başlık, Local Path, Tarih, Thumbnail vs.) mobil cihazda tutmak.

## Teknik Kısıtlamalar ve Bağımlılıklar
1. **FFmpeg Zorunluluğu:** Backend sunucusunda (veya çalışacağı ortamda) mutlaka FFmpeg'in sistem ortam değişkenlerine (`PATH`) ekli olması gerekir. `yt-dlp` yüksek kaliteli videoların sesini ve görüntüsünü indirdikten sonra birleştirmek için bunu kullanır.
2. **Mobil İzinler:**
   - Sesli arama için **Mikrofon izni**.
   - Offline izleme / kaydetme için (Android) **Storage ve Media İzinleri** (veya MediaStore/File System API kullanımları).
3. **İndirme Verimliliği:** Sunucuya (FastAPI) indirildikten sonra istemciye aktarılması yerine, mimarinin doğrudan indirme linkini (Direct Link) React Native'e verip vermeyeceği geliştirme aşamasında performans testlerine bağlı kararlaştırılacaktır. Ancak genel pratik; indirme/birleştirme süreci için sunucuda işleyip hazır dosyayı veya işlenmiş stream'i mobile göndermek yönündedir (Eğer mobil cihazın yt-dlp portu yoksa).

## Geliştirme Ortamı
- Python için `venv` veya `pipenv`.
- React Native için NodeJS, Android Studio (Emulator) veya iOS Simulator.
