import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/Api';

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    // Stores download states by videoId. 
    // Format: { [videoId]: { progress: 0, timeLeft: 20 } }
    const [activeDownloads, setActiveDownloads] = useState({});
    const [completedDownloads, setCompletedDownloads] = useState([]);
    const [downloadPath, setDownloadPath] = useState('');

    // Interval referanslarını sakla — cancel anında temizlemek için
    const intervalsRef = useRef({});

    // Load from memory
    useEffect(() => {
        const load = async () => {
            try {
                const saved = await AsyncStorage.getItem('@completed_downloads');
                if (saved) setCompletedDownloads(JSON.parse(saved));

                const savedPath = await AsyncStorage.getItem('@download_path');
                if (savedPath) setDownloadPath(savedPath);
            } catch (e) {
                console.error("Failed to load downloads", e);
            }
        };
        load();
    }, []);

    // Save completed to memory
    useEffect(() => {
        const save = async () => {
            try {
                await AsyncStorage.setItem('@completed_downloads', JSON.stringify(completedDownloads));
            } catch (e) { }
        };
        save();
    }, [completedDownloads]);

    // Save path to memory
    const updateDownloadPath = async (path) => {
        setDownloadPath(path);
        try {
            await AsyncStorage.setItem('@download_path', path);
        } catch (e) { }
    };

    const cancelDownload = (videoId) => {
        // 1. Interval'ı anında durdur — UI bar geri gelmesin
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

        // 3. Backend'e fire-and-forget iptal isteği (beklemeden)
        api.cancelDownload(videoId).catch(e =>
            console.error('Failed to signal cancel to backend', e)
        );
    };

    const clearHistory = async () => {
        setCompletedDownloads([]);
        try {
            await AsyncStorage.removeItem('@completed_downloads');
        } catch (e) { }
    };

    const startSimulation = (video, quality) => {
        // Prevent duplicate
        if (activeDownloads[video.id] || intervalsRef.current[video.id]) return;

        setActiveDownloads(prev => ({
            ...prev,
            [video.id]: { progress: 0, timeLeft: 0, speed: '--', video, quality }
        }));

        const interval = setInterval(async () => {
            // İptal edildiyse interval zaten temizlenmiş olmalı, ama çift kontrol
            if (!intervalsRef.current[video.id]) return;

            const data = await api.getDownloadProgress(video.id);
            if (!data) return;

            // Backend progress dosyası yoksa (iptal/tamamlandı) interval'ı durdur
            if (data.progress === 0 && !data.completed && !data.error) {
                // Henüz progress gelmemiş olabilir, bekle
            }

            const currentProgress = parseFloat(data.progress || 0);
            const timeRemaining = data.eta || 0;
            const currentSpeed = data.speed || '0.0 MB/s';

            // Tamamlandı — interval'ı durdur ve completed'a taşı
            if (data.completed === true && data.filename) {
                clearInterval(intervalsRef.current[video.id]);
                delete intervalsRef.current[video.id];
                setTimeout(() => {
                    setActiveDownloads(prev => {
                        const copy = { ...prev };
                        delete copy[video.id];
                        return copy;
                    });
                    setCompletedDownloads(prev => {
                        if (prev.some(d => d.id === video.id && d.quality === quality)) return prev;
                        return [{ ...video, quality, downloadedAt: new Date().toISOString(), filename: data.filename }, ...prev];
                    });
                }, 1000);
                return;
            }

            // Hata durumunda interval'ı durdur
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

            setActiveDownloads(prev => ({
                ...prev,
                [video.id]: { progress: currentProgress.toFixed(1), timeLeft: timeRemaining, speed: currentSpeed, video, quality }
            }));
        }, 800);

        // Interval referansını sakla
        intervalsRef.current[video.id] = interval;
    };

    return (
        <DownloadContext.Provider value={{ activeDownloads, completedDownloads, downloadPath, updateDownloadPath, clearHistory, startSimulation, cancelDownload }}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownloads = () => useContext(DownloadContext);
