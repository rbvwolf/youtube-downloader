/**
 * Database.js — İndirme geçmişi yönetimi.
 *
 * Platform ayrımı:
 *  - Web    → AsyncStorage (tarayıcı localStorage'ı üzerinde çalışır)
 *  - Native → expo-sqlite (gerçek SQLite)
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEB_STORAGE_KEY = '@download_history';

// ─────────────────────────────────────────────
// WEB: AsyncStorage tabanlı Mock DB
// ─────────────────────────────────────────────

async function webGetAll() {
    try {
        const raw = await AsyncStorage.getItem(WEB_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

async function webSave(rows) {
    await AsyncStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(rows));
}

async function webInsert(item) {
    const rows = await webGetAll();
    // Aynı video_id + quality çifti varsa güncelle
    const idx = rows.findIndex(r => r.id === (item.id ?? '') && r.quality === (item.quality ?? ''));
    const newEntry = {
        id:             item.id             ?? '',
        title:          item.title          ?? '',
        thumbnail:      item.thumbnail      ?? '',
        channel:        item.channel        ?? '',
        quality:        item.quality        ?? '',
        downloadedAt:   item.downloadedAt   ?? new Date().toISOString(),
        filename:       item.filename       ?? '',
        duration:       item.duration       ?? '',
        views:          item.views          ?? '',
        playlist_id:    item.playlist_id    ?? null,
        playlist_title: item.playlist_title ?? null,
    };
    if (idx >= 0) {
        rows[idx] = newEntry;
    } else {
        rows.unshift(newEntry); // en yeni başa
    }
    await webSave(rows);
}

async function webDelete(videoId, quality) {
    const rows = await webGetAll();
    await webSave(rows.filter(r => !(r.id === videoId && r.quality === quality)));
}

async function webClear() {
    await AsyncStorage.removeItem(WEB_STORAGE_KEY);
}

// ─────────────────────────────────────────────
// NATIVE: expo-sqlite
// ─────────────────────────────────────────────

let _db = null;

async function getNativeDatabase() {
    // Dinamik import: web bundle'ına expo-sqlite dahil edilmesin
    const SQLite = await import('expo-sqlite');
    if (_db) return _db;
    _db = await SQLite.openDatabaseAsync('youtube_downloader.db');
    await _db.execAsync(`
        CREATE TABLE IF NOT EXISTS downloads (
            rowid         INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id      TEXT NOT NULL,
            title         TEXT,
            thumbnail     TEXT,
            channel       TEXT,
            quality       TEXT,
            downloaded_at TEXT,
            filename      TEXT,
            duration      TEXT,
            views         TEXT,
            playlist_id   TEXT,
            playlist_title TEXT
        );
    `);
    // Migration: mevcut DB'ye yeni sütunlar ekle (varsa hata yoksay)
    await _db.execAsync(`ALTER TABLE downloads ADD COLUMN playlist_id TEXT`).catch(() => {});
    await _db.execAsync(`ALTER TABLE downloads ADD COLUMN playlist_title TEXT`).catch(() => {});
    return _db;
}

async function nativeInsert(item) {
    const db = await getNativeDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO downloads
            (video_id, title, thumbnail, channel, quality, downloaded_at, filename, duration, views, playlist_id, playlist_title)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            item.id             ?? '',
            item.title          ?? '',
            item.thumbnail      ?? '',
            item.channel        ?? '',
            item.quality        ?? '',
            item.downloadedAt   ?? new Date().toISOString(),
            item.filename       ?? '',
            item.duration       ?? '',
            item.views          ?? '',
            item.playlist_id    ?? null,
            item.playlist_title ?? null,
        ]
    );
}

async function nativeGetAll() {
    const db = await getNativeDatabase();
    const rows = await db.getAllAsync('SELECT * FROM downloads ORDER BY downloaded_at DESC');
    return rows.map(row => ({
        id:             row.video_id,
        title:          row.title,
        thumbnail:      row.thumbnail,
        channel:        row.channel,
        quality:        row.quality,
        downloadedAt:   row.downloaded_at,
        filename:       row.filename,
        duration:       row.duration,
        views:          row.views,
        playlist_id:    row.playlist_id    ?? null,
        playlist_title: row.playlist_title ?? null,
    }));
}

async function nativeDelete(videoId, quality) {
    const db = await getNativeDatabase();
    await db.runAsync('DELETE FROM downloads WHERE video_id = ? AND quality = ?', [videoId, quality]);
}

async function nativeClear() {
    const db = await getNativeDatabase();
    await db.runAsync('DELETE FROM downloads');
}

// ─────────────────────────────────────────────
// PUBLIC API — platform bağımsız
// ─────────────────────────────────────────────

const isWeb = Platform.OS === 'web';

/** Yeni bir indirilen kaydı ekler (aynı video+quality varsa üzerine yazar). */
export async function insertDownload(item) {
    if (isWeb) return webInsert(item);
    return nativeInsert(item);
}

/** Tüm indirilen kayıtları döner (en yeni önce). */
export async function getAllDownloads() {
    if (isWeb) return webGetAll();
    return nativeGetAll();
}

/** Belirli bir kaydı siler. */
export async function deleteDownload(videoId, quality) {
    if (isWeb) return webDelete(videoId, quality);
    return nativeDelete(videoId, quality);
}

/** Tüm geçmişi siler. */
export async function clearAllDownloads() {
    if (isWeb) return webClear();
    return nativeClear();
}
