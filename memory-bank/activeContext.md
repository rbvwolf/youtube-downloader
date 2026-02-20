# Active Context

## Odak Noktası
Şu an **Phase 2: Backend Development** aşaması tamamlandı ve frontend geçişine hazırlık yapılıyor. 

## Son Değişiklikler
- `backend/main.py` içerisinde FastAPI kullanılarak API iskeleti oluşturuldu.
- `yt-dlp` entegrasyonu yapılarak YouTube Data API'ye gerek kalmadan arama yapabilen `/search` simülasyonu yazıldı.
- `/info/{video_id}` endpoint'i ile kalite opsiyonlarını (Video ve Ses) dönen yapı kuruldu.
- `/download` endpoint'i ve FFmpeg tabanlı birleştirme (1080p, 720p, 480p, audio) arka plan görevlerine bağlandı.
- İndirmelerin kaydedileceği statik dizin `R:\Code\Youtube-Downloader-Downloads` ayarlandı.
- Backend gereksinimleri için `requirements.txt` oluşturuldu.

## Sonraki Adımlar (Next Steps)
1. Kullanıcının backend'i kendi ortamında test (virtualenv, FFmpeg kurulu mu kontrolü) etmesi.
2. Backend doğrulandıktan sonra **Phase 3: Frontend Foundations** kısmına (React Native projelerinin initialization) geçilmesi.
3. Frontend ve backend'in local ağda IP bazlı iletişiminin ayarlanması.

## Aktif Kararlar
- Frontend geliştirilmeye başlamadan önce backend'in stabil çalıştığı kesinleştirilmelidir çünkü video dönüştürme ve API entegrasyonu ana ürün bağlamıdır.
