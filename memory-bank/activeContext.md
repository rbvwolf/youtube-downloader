# Active Context

## Odak Noktası
Şu an **Phase 1: Planning & Initialization** aşamasındayız. Projenin genel hatları, klasör iskeletleri ve temel `memory-bank/` (AGENTS.md kuralları gereği) dökümantasyonları hazırlanmış durumdadır.

## Son Değişiklikler
- `memory-bank/` altındaki konfigürasyon ve bağlam dosyaları (`projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `progress.md`) tamamen oluşturuldu ve birbirleriyle tutarlı bir şekilde bağlandı.
- Önceden oluşturulan `techStack.md` silinerek yerine doğru standartta olan `techContext.md` geçirildi.
- Phased (aşamalı) To-Do listesi güncellendi.
- `backend/` ve `frontend/` boş klasörleri oluşturuldu.

## Sonraki Adımlar (Next Steps)
1. Backend (`Python/FastAPI`) tarafına geçiş yapılacak.
2. Python sanal ortamının (virtualenv) oluşturulması.
3. `fastapi`, `uvicorn`, `yt-dlp` kütüphanelerinin yüklenmesi.
4. Hedeflenen API endpoint'leri (`/search`, `/info`, `/download`) için temel dosyaların (örn: `main.py`) ayağa kaldırılması.

## Aktif Kararlar
- Geliştirme ilk olarak backend üzerinden başlayacak ve `yt-dlp` ile ilgili kritik çekirdek mantıklar doğru oturtulduktan sonra React Native (frontend) inşasına gecilecek.
- Tasarım açısından Material 3 standartları baz alınmak üzere notlar düşüldü, frontend başladığında bu dizayn sistemi kullanılacak.
