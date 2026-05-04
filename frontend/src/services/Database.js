/**
 * Database.js — expo-sqlite ile indirme geçmişi yönetimi.
 * Expo SDK 51 / expo-sqlite ~14.x async API kullanır.
 */
import * as SQLite from 'expo-sqlite';

let _db = null;

/**
 * Singleton veritabanı bağlantısı döner.
 * İlk çağrıda tabloyu oluşturur.
 */
export async function getDatabase() {
    if (_db) return _db;
    _db = await SQLite.openDatabaseAsync('youtube_downloader.db');
    await _db.execAsync(`
        CREATE TABLE IF NOT EXISTS downloads (
            rowid      INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id   TEXT NOT NULL,
            title      TEXT,
            thumbnail  TEXT,
            channel    TEXT,
            quality    TEXT,
            downloaded_at TEXT,
            filename   TEXT,
            duration   TEXT,
            views      TEXT
        );
    `);
    return _db;
}

/**
 * Yeni bir indirilen kaydı ekler.
 * Aynı video_id + quality çifti zaten varsa üzerine yazar (REPLACE).
 */
export async function insertDownload(item) {
    const db = await getDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO downloads
            (video_id, title, thumbnail, channel, quality, downloaded_at, filename, duration, views)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            item.id          ?? '',
            item.title       ?? '',
            item.thumbnail   ?? '',
            item.channel     ?? '',
            item.quality     ?? '',
            item.downloadedAt ?? new Date().toISOString(),
            item.filename    ?? '',
            item.duration    ?? '',
            item.views       ?? '',
        ]
    );
}

/**
 * Tüm indirilen kayıtları döner (en yeni önce).
 * Dönen satırları DownloadContext'in beklediği formata çevirir.
 */
export async function getAllDownloads() {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
        'SELECT * FROM downloads ORDER BY downloaded_at DESC'
    );
    return rows.map(row => ({
        id:           row.video_id,
        title:        row.title,
        thumbnail:    row.thumbnail,
        channel:      row.channel,
        quality:      row.quality,
        downloadedAt: row.downloaded_at,
        filename:     row.filename,
        duration:     row.duration,
        views:        row.views,
    }));
}

/**
 * Belirli bir kaydı siler.
 */
export async function deleteDownload(videoId, quality) {
    const db = await getDatabase();
    await db.runAsync(
        'DELETE FROM downloads WHERE video_id = ? AND quality = ?',
        [videoId, quality]
    );
}

/**
 * Tüm geçmişi siler.
 */
export async function clearAllDownloads() {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM downloads');
}
