# Project Progress & To-Do List

## Current Status
- Prje iskeleti (`frontend/`, `backend/`, `memory-bank/`) oluşturuldu.
- `AGENTS.md` (Memory Bank) dokümantasyonu başlatıldı.
- `projectbrief.md`, `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md` dolduruldu.
- Backend ve Frontend geliştirme aşamasına geçiş için hazırız.

## What Works
- Başlangıç dokümantasyonu ve planlama tamamlandı.

## What's Left to Build (To-Do List)

### Phase 1: Planning & Initialization
- [x] Proje iskeletinin oluşturulması
- [x] Memory Bank dosyalarının (AGENTS.md kurallarına göre) oluşturulması
- [x] To-do listesinin `progress.md` içine eklenmesi

### Phase 2: Backend Development (Python/FastAPI)
- [x] Python ortamının (virtualenv) kurulması ve gereksinimlerin (`fastapi`, `uvicorn`, `yt-dlp`, vb.) yüklenmesi (requirements.txt hazırlandı)
- [x] `yt-dlp` ve `FFmpeg` entegrasyonu (indirme ve birleştirme mantığı kuruldu)
- [x] `/search` endpoint'inin oluşturulması (Sorgu alıp başlık, thumbnail, ID dönecek)
- [x] `/info/{video_id}` endpoint'inin oluşturulması (Videonun kalite formatlarını dönecek)
- [x] `/download` endpoint'inin oluşturulması (İndirmeyi başlatacak)

### Phase 3: Frontend Foundations (React Native)
- [ ] React Native (Expo veya CLI) projesinin başlatılması
- [ ] React Navigation kurulumu (Tabs & Stack)
- [ ] Material 3 (Google Stitch) tema standartlarının (renkler, fontlar vb.) tanımlanması
- [ ] Axios ayarlarının yapılıp Backend ile bağlantının test edilmesi

### Phase 4: Frontend Core Features & UI
- [ ] **Ana Ekran (Search Header):** M3 SearchBar, Büyüteç, Kırmızı Mikrofon ve Öneriler (Chips)
- [ ] **Sesli Arama:** `@react-native-voice/voice` ile bottom-sheet şeklinde mikrofon/dinleniyor ekranı
- [ ] **Kalite Seçimi:** Video tıklandığında açılan Bottom Sheet ve Radio Button'lar (144p - 4K, MP3)
- [ ] **İndirme Yöneticisi:** Arka plan indirme (Background Fetch) ve Progress Bar entegrasyonu

### Phase 5: Storage, UX Polish & Testing
- [ ] **Yerel Veritabanı:** İndirme geçmişi için SQLite entegrasyonu
- [ ] **İndirilenler Sekmesi:** Yatay kartlar, oynat, paylaş ve sil özellikleri
- [ ] **Kullanıcı İpuçları:** Otomatik link yapıştırma tespiti, emoji destekli sevimli hata mesajları
- [ ] **Erişilebilirlik:** Aile büyükleri için ayarlardan büyük font seçeneği
- [ ] Uçtan uca (E2E) testler ve hata ayıklamaları

## Known Issues
- Henüz tespit edilen bir hata yok.
