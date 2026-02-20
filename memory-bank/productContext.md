# Product Context

## Neden Bu Proje Var?
Piyasadaki mevcut YouTube video indirme araçları genellikle aşırı reklam barındıran, karmaşık arayüzlere sahip ve güven vermeyen web siteleri veya uygulamalardan oluşuyor. Özellikle teknolojiyle arası çok iyi olmayan kullanıcılar (örneğin aile büyükleri) bu araçları kullanırken zorlanmakta, yanlış yerlere tıklayarak zararlı içeriklere veya reklamlara maruz kalmaktadır. 

Youtube-Downloader projesi bu problemleri çözmek üzere tasarlanmıştır.

## Çözdüğü Problemler
1. **Karmaşık Arayüzler ve Reklamlar:** Tamamen reklamsız, temiz ve anlaşılır (Material 3 standartlarında) bir arayüz sunar.
2. **Kullanım Zorluğu:** Kalite seçenekleri basitçe ifade edilir ("1080p - Full HD", "Sadece Ses - MP3" gibi).
3. **Arama Zorluğu:** Sesli arama özelliği ile klavye kullanmakta zorlanan kişilerin tek tuşla istediklerini bulmasını sağlar.
4. **Link Kopyalama Karmaşası:** Panodaki kopyalanmış linki otomatik tanıyarak indirme önerisinde bulunur.

## Nasıl Çalışmalı?
1. Kullanıcı uygulamayı açar ve ana ekrandan ya metin yazarak, ya sesli komutla, ya da uygulamaya gelmeden önce YouTube'dan kopyaladığı bir linke onay vererek bir video bulur.
2. Ekranda listelenen videolardan birine tıkladığında alttan şık bir menü (Bottom Sheet) açılır ve hangi kalitede indireceğini seçer (Video veya MP3).
3. Dev boyutlu ve belirgin "İNDİRMEYİ BAŞLAT" butonuna basar.
4. İndirme işlemi arka planda, ilerleme çubuğu gösterilerek tamamlanır.
5. İndirilen içeriklere 'Geçmiş' (Downloads) sekmesinden kolayca ulaşır ve internetsiz izleyebilir / dinleyebilir.

## Kullanıcı Deneyimi (UX) Hedefleri
- **Erişilebilirlik:** Aile büyükleri için yüksek kontrast seçenekleri, büyük ve okunaklı fontlar.
- **Yumuşatılmış Hata Bildirimleri:** Teknik terimler yerine emojilerle desteklenen samimi hata mesajları (ör: "😮 İnternet yok", "😅 Videoyu bulamadık").
- **Google Stitch:** Arayüzün Android/Google ekosistemine yabancılık çekilmemesi adına tanındık M3 standartlarına uygun dizayn edilmesi.
- **Kesintisizlik:** İndirmelerin arka planda kopmadan devam etmesi.
