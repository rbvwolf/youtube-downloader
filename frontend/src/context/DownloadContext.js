import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/Api';

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    // Stores download states by videoId. 
    // Format: { [videoId]: { progress: 0, timeLeft: 20 } }
    const [activeDownloads, setActiveDownloads] = useState({});
    const [completedDownloads, setCompletedDownloads] = useState([]);

    // Load from memory
    useEffect(() => {
        const load = async () => {
            try {
                const saved = await AsyncStorage.getItem('@completed_downloads');
                if (saved) setCompletedDownloads(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load downloads", e);
            }
        };
        load();
    }, []);

    // Save to memory
    useEffect(() => {
        const save = async () => {
            try {
                await AsyncStorage.setItem('@completed_downloads', JSON.stringify(completedDownloads));
            } catch (e) { }
        };
        save();
    }, [completedDownloads]);

    const startSimulation = (video, quality) => {
        // Prevent duplicate simulation
        if (activeDownloads[video.id]) return;

        let progress = 0;
        let timeLeft = 25; // simulate 25 seconds download

        setActiveDownloads(prev => ({
            ...prev,
            [video.id]: { progress, timeLeft, video, quality }
        }));

        const interval = setInterval(async () => {
            const data = await api.getDownloadProgress(video.id);
            if (!data) return;

            let currentProgress = parseFloat(data.progress || 0);
            let timeRemaining = data.eta || 0;
            let currentSpeed = data.speed || '0.0 MB/s';

            if (data.completed || currentProgress >= 100) {
                clearInterval(interval);

                setTimeout(() => {
                    setActiveDownloads(prev => {
                        const newAcc = { ...prev };
                        delete newAcc[video.id];
                        return newAcc;
                    });
                    setCompletedDownloads(prev => {
                        if (prev.some(d => d.id === video.id && d.quality === quality)) return prev;
                        const newItem = { ...video, quality, downloadedAt: new Date().toISOString(), filename: data.filename };
                        return [newItem, ...prev];
                    });
                }, 1000);
            }

            setActiveDownloads(prev => ({
                ...prev,
                [video.id]: { progress: currentProgress.toFixed(1), timeLeft: timeRemaining, speed: currentSpeed, video, quality }
            }));
        }, 800);
    };

    return (
        <DownloadContext.Provider value={{ activeDownloads, completedDownloads, startSimulation }}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownloads = () => useContext(DownloadContext);
