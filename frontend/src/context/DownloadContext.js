import React, { createContext, useState, useContext } from 'react';

const DownloadContext = createContext();

export const DownloadProvider = ({ children }) => {
    // Stores download states by videoId. 
    // Format: { [videoId]: { progress: 0, timeLeft: 20 } }
    const [activeDownloads, setActiveDownloads] = useState({});

    const startSimulation = (videoId) => {
        // Prevent duplicate simulation
        if (activeDownloads[videoId]) return;

        let progress = 0;
        let timeLeft = 25; // simulate 25 seconds download

        setActiveDownloads(prev => ({
            ...prev,
            [videoId]: { progress, timeLeft }
        }));

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 2; // Add 2-6% per second
            timeLeft -= 1;

            if (progress >= 100 || timeLeft <= 0) {
                progress = 100;
                timeLeft = 0;
                clearInterval(interval);

                // Keep it at 100% for a brief moment, then remove
                setTimeout(() => {
                    setActiveDownloads(prev => {
                        const newAcc = { ...prev };
                        delete newAcc[videoId];
                        return newAcc;
                    });
                }, 2000);
            }

            setActiveDownloads(prev => ({
                ...prev,
                [videoId]: { progress, timeLeft }
            }));
        }, 1000);
    };

    return (
        <DownloadContext.Provider value={{ activeDownloads, startSimulation }}>
            {children}
        </DownloadContext.Provider>
    );
};

export const useDownloads = () => useContext(DownloadContext);
