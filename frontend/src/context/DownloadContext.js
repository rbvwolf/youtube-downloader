import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from '../services/Api';
import {
    insertDownload,
    getAllDownloads,
    deleteDownload as dbDeleteDownload,
    clearAllDownloads,
} from '../services/Database';

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    // Aktif (devam eden) indirmeler — sadece bellekte tutulur
    const [activeDownloads, setActiveDownloads] = useState({});

    // Tamamlanan indirmeler — SQLite'tan yüklenir ve senkron tutulur
    const [completedDownloads, setCompletedDownloads] = useState([]);

    // Kullanıcının seçtiği indirme klasörü (basit string, AsyncStorage yeterli)
    const [downloadPath, setDownloadPath] = useState('');

    // Interval referansları — iptal anında temizlemek için
    const intervalsRef = useRef({});

    // Uygulama açılışında SQLite'tan geçmişi yükle
    useEffect(() => {
        const load = async () => {
            try {
                // Fetch completed downloads from DB
                const rows = await getAllDownloads();
                setCompletedDownloads(rows);

                // Get saved download path from AsyncStorage
                const savedPath = await AsyncStorage.getItem('@download_path');
                if (savedPath) {
                    setDownloadPath(savedPath);
                } else {
                    try {
                        const defaultDir = await api.getDefaultDownloadDir();
                        if (defaultDir && defaultDir.path) {
                            setDownloadPath(defaultDir.path);
                        }
                    } catch (err) {
                        console.error('[DownloadContext] Default path error:', err);
                    }
                }
            } catch (e) {
                console.error('[DownloadContext] Load error:', e);
            }
        };
        load();
    }, []);

    // İndirme klasörünü güncelle ve AsyncStorage'a kaydet
    const updateDownloadPath = async (path) => {
        setDownloadPath(path);
        try {
            await AsyncStorage.setItem('@download_path', path);
        } catch (e) {
            console.error('[DownloadContext] Path kayıt hatası:', e);
        }
    };

    // Belirli bir indirmeyi sil (SQLite + state + disk)
    const removeDownload = async (videoId, quality) => {
        try {
            // Disk'ten sil (filename varsa)
            const entry = completedDownloads.find(d => d.id === videoId && d.quality === quality);
            if (entry?.filename) {
                try { await api.deleteFile(entry.filename); } catch { /* dosya yoksa sorun değil */ }
            }
            await dbDeleteDownload(videoId, quality);
            setCompletedDownloads(prev =>
                prev.filter(d => !(d.id === videoId && d.quality === quality))
            );
        } catch (e) {
            console.error('[DownloadContext] Silme hatası:', e);
        }
    };

    // Tüm geçmişi temizle (SQLite + state + disk)
    const clearHistory = async () => {
        try {
            // Tüm dosyaları diskten sil
            for (const entry of completedDownloads) {
                if (entry?.filename) {
                    try { await api.deleteFile(entry.filename); } catch { /* devam et */ }
                }
            }
            await clearAllDownloads();
            setCompletedDownloads([]);
        } catch (e) {
            console.error('[DownloadContext] Geçmiş temizleme hatası:', e);
        }
    };

    // Aktif indirmeyi iptal et
    const cancelDownload = (videoId) => {
        // 1. Interval'ı anında durdur
        if (intervalsRef.current[videoId]) {
            clearInterval(intervalsRef.current[videoId]);
            delete intervalsRef.current[videoId];
        }

        // 2. UI'den anında kaldır (optimistic update)
        setActiveDownloads(prev => {
            const updated = { ...prev };
            delete updated[videoId];
            return updated;
        });

        // 3. Backend'e fire-and-forget iptal isteği
        api.cancelDownload(videoId).catch(e =>
            console.error('[DownloadContext] Backend iptal sinyali gönderilemedi:', e)
        );
    };

    // İndirme başlatıldığında progress polling döngüsünü başlat
    const startSimulation = (video, quality, playlistMeta = {}) => {
        // Aynı video için çift başlatmayı engelle
        if (activeDownloads[video.id] || intervalsRef.current[video.id]) return;

        setActiveDownloads(prev => ({
            ...prev,
            [video.id]: {
                progress: 0, timeLeft: 0, speed: '--', video, quality,
                playlist_id:    playlistMeta?.playlist_id    ?? null,
                playlist_title: playlistMeta?.playlist_title ?? null,
                startedAt:      Date.now(),
            },
        }));

        const interval = setInterval(async () => {
            if (!intervalsRef.current[video.id]) return;

            const data = await api.getDownloadProgress(video.id);
            if (!data) return;

            const currentProgress = parseFloat(data.progress || 0);
            const timeRemaining  = data.eta   || 0;
            const currentSpeed   = data.speed || '0.0 MB/s';

            // --- İndirme tamamlandı ---
            if (data.completed === true && data.filename) {
                clearInterval(intervalsRef.current[video.id]);
                delete intervalsRef.current[video.id];

                // SQLite'a kaydet ve state'i güncelle
                setTimeout(async () => {
                    const newEntry = {
                        ...video,
                        quality,
                        downloadedAt: new Date().toISOString(),
                        filename: data.filename,
                        playlist_id:    playlistMeta?.playlist_id    ?? null,
                        playlist_title: playlistMeta?.playlist_title ?? null,
                    };

                    try {
                        await insertDownload(newEntry);
                    } catch (e) {
                        console.error('[DownloadContext] SQLite kayıt hatası:', e);
                    }

                    setActiveDownloads(prev => {
                        const copy = { ...prev };
                        delete copy[video.id];
                        return copy;
                    });

                    setCompletedDownloads(prev => {
                        // Aynı video + kalite çifti zaten varsa ekleme
                        if (prev.some(d => d.id === video.id && d.quality === quality)) return prev;
                        return [newEntry, ...prev];
                    });
                }, 1000);

                return;
            }

            // --- Hata durumu ---
            if (data.error) {
                clearInterval(intervalsRef.current[video.id]);
                delete intervalsRef.current[video.id];
                setActiveDownloads(prev => {
                    const copy = { ...prev };
                    delete copy[video.id];
                    return copy;
                });
                return;
            }

            // --- Devam ediyor ---
            setActiveDownloads(prev => ({
                ...prev,
                [video.id]: {
                    ...prev[video.id],   // playlist_id, playlist_title, startedAt korunur
                    progress: currentProgress.toFixed(1),
                    timeLeft: timeRemaining,
                    speed: currentSpeed,
                    video,
                    quality,
                },
            }));
        }, 800);

        intervalsRef.current[video.id] = interval;
    };

    return (
        <DownloadContext.Provider
            value={{
                activeDownloads,
                completedDownloads,
                downloadPath,
                updateDownloadPath,
                clearHistory,
                removeDownload,   // Tek kayıt silme
                startSimulation,
                cancelDownload,
            }}
        >
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownloads = () => useContext(DownloadContext);
