import axios from 'axios';
import { Platform } from 'react-native';

// Backend URL — web ortamında tarayıcının adresi otomatik algılanır.
// Farklı bir cihazdan (telefon, LAN) erişimde bile çalışır.
function resolveBaseURL() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const host = window.location.hostname;
        const port = 8000;
        // localhost veya loopback => her zaman 127.0.0.1
        if (host === 'localhost' || host === '127.0.0.1' || host === '') {
            return `http://127.0.0.1:${port}`;
        }
        // Farklı bir IP/hostname (LAN, tünel vb.) => aynı host, backend portu
        return `http://${host}:${port}`;
    }
    // Native (Android/iOS) için varsayılan
    // Android emulatör: 10.0.2.2, gerçek cihaz: lokal IP yaz
    return 'http://127.0.0.1:8000';
}

const BASE_URL = resolveBaseURL();
console.log('[Api] BASE_URL =>', BASE_URL);

const api = axios.create({
    baseURL: BASE_URL,
});

// Web'de fetch ile YouTube autocomplete API'yi doğrudan çağır.
// clients1.google.com/complete/search — CORS başlığı olan, tarayıcı erişimine açık endpoint.
async function fetchSuggestionsWeb(query) {
    // Farklı URL'leri sırayla dene
    const urls = [
        `https://clients1.google.com/complete/search?client=youtube&hl=tr&gl=TR&q=${encodeURIComponent(query)}&callback=a`,
        `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`,
        `https://clients1.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`,
    ];

    // 2. URL: firefox client JSON döner, fetch ile CORS olur
    try {
        const res = await fetch(
            `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (res.ok) {
            const data = await res.json();
            console.log('[Suggest] firefox fetch raw:', data);
            if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
                return data[1].filter(s => typeof s === 'string').slice(0, 10);
            }
        }
    } catch (e) {
        console.log('[Suggest] firefox fetch hatası:', e.message);
    }

    // JSONP fallback (CSP kısıtlaması yoksa çalışır)
    return new Promise((resolve) => {
        const cbName = `__yt_cb_${Date.now()}`;
        const script = document.createElement('script');
        const timer = setTimeout(() => { cleanup(); resolve([]); }, 3000);

        const cleanup = () => {
            clearTimeout(timer);
            delete window[cbName];
            script.parentNode && script.parentNode.removeChild(script);
        };

        window[cbName] = (data) => {
            cleanup();
            console.log('[Suggest] JSONP raw data:', data);
            if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
                resolve(data[1].filter(s => typeof s === 'string').slice(0, 10));
            } else {
                resolve([]);
            }
        };

        script.src = `https://clients1.google.com/complete/search?client=youtube&hl=tr&gl=TR&q=${encodeURIComponent(query)}&callback=${cbName}`;
        script.onload = () => console.log('[Suggest] JSONP script yüklendi');
        script.onerror = (e) => { console.log('[Suggest] JSONP CSP bloğu veya ağ hatası:', e); cleanup(); resolve([]); };
        document.head.appendChild(script);
    });
}

export default {
    searchVideos: async (query) => {
        try {
            const response = await api.get('/search', { params: { q: query, max_results: 15 } });
            return response.data;
        } catch (error) {
            console.error("Search API Error:", error);
            throw error;
        }
    },

    getSuggestions: async (query) => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            try {
                const suggestions = await fetchSuggestionsWeb(query);
                console.log('Gelen Öneriler (web):', suggestions);
                return { suggestions };
            } catch (e) {
                console.log('Web Suggest hatası:', e);
                return { suggestions: [] };
            }
        }
        // Native: backend üzerinden
        try {
            const response = await api.get('/suggestions', { params: { q: query } });
            return response.data;
        } catch (error) {
            console.error("Suggestions API Error:", error);
            return { suggestions: [] };
        }
    },

    getVideoInfo: async (videoId) => {
        try {
            const response = await api.get(`/info/${videoId}`);
            return response.data;
        } catch (error) {
            console.error("Info API Error:", error);
            throw error;
        }
    },

    getVideoSizes: async (videoId) => {
        try {
            const response = await api.get('/video-info', { params: { video_id: videoId } });
            return response.data;
        } catch (error) {
            console.error("Video Sizes API Error:", error);
            throw error;
        }
    },

    getDownloadProgress: async (videoId) => {
        try {
            const response = await api.get(`/progress/${videoId}`);
            return response.data;
        } catch (error) {
            console.error("Progress API Error:", error);
            return null; // Don't throw to avoid crashing the interval
        }
    },

    downloadVideo: async (videoId, quality, downloadPath) => {
        try {
            const body = {
                video_id: videoId,
                quality: quality
            };
            if (downloadPath) body.download_path = downloadPath;
            const response = await api.post('/download', body);
            return response.data;
        } catch (error) {
            console.error("Download API Error:", error);
            throw error;
        }
    },

    cancelDownload: async (videoId) => {
        try {
            const response = await api.post(`/cancel/${videoId}`);
            return response.data;
        } catch (error) {
            console.error("Cancel API Error:", error);
            throw error;
        }
    },

    pickDirectory: async () => {
        try {
            const response = await api.get('/api/pick_directory');
            return response.data;
        } catch (error) {
            console.error("Pick Directory Error:", error);
            throw error;
        }
    },

    getDefaultDownloadDir: async () => {
        try {
            const response = await api.get('/api/get_download_dir');
            return response.data;
        } catch (error) {
            console.error("Get Default Download Dir Error:", error);
            throw error;
        }
    },

    openDirectory: async () => {
        try {
            const response = await api.get('/api/open_directory');
            return response.data;
        } catch (error) {
            console.error("Open Directory Error:", error);
            throw error;
        }
    },

    // Used for constructing absolute URLs (DownloadContext / LocalPlayerModal)
    getBaseURL: () => BASE_URL,
};
