# Proje Özeti: Youtube-Downloader

## Temel Bilgiler
- **Platform:** Mobil (React Native - iOS/Android)
- **Amacı:** Kullanıcıların YouTube videolarını arayıp, kalite seçerek cihazlarına indirmesini sağlayan reklamsız, kolay arayüzlü ve özellikle aile büyükleri için erişilebilir bir araç.

## Temel Gereksinimler
- **Arama:** YouTube Data API (veya yt-dlp similasyonu) ile video arama.
- **Sesli Arama:** `@react-native-voice/voice` ile yerel cihaz motoru kullanılarak sesli komutla arama (Özellikle aile büyükleri düşünülerek).
- **Kalite Seçimi:** 144p'den 4K'ya kadar video veya Sadece Ses (MP3/M4A) formatında indirme.
- **İndirme Yönetimi:** Arka planda indirme (Background Fetch) ve ilerleme çubuğu (Progress Bar).
- **Geçmiş:** İndirilen videoların cihazın yerel depolamasında listelenmesi ve tekrar oynatma/silme/paylaşma yetenekleri.

## Kullanıcı Deneyimi (UX) & Tasarım (UI)
- **Tema:** Google Stitch ve Material 3 (M3) standartları.
- **Tasarım Dili:** Temiz, yüksek kontrastlı ve erişilebilir (ör. Emoji destekli hata mesajları, büyük font seçeneği).
- **Etkileşim:**
  - Kopyalanan linkin uygulamaya girildiğinde otomatik algılanması.
  - Şık "Bottom Sheet" ile kalite seçimi.
  - Mikrofon ikonuna basıldığında açılan animasyonlu (Waveform) "Sesli Arama Modalı".
