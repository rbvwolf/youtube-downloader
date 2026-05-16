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
        // Her ortamda (web & native) kendi backend /suggestions ucunu kullanıyoruz.
        try {
            const response = await api.get('/suggestions', { params: { q: query } });
            return response.data;
        } catch (error) {
            console.error('Suggestions API Error:', error);
            return { suggestions: [] };
        }
    },

    getPlaylistDetails: async (playlistId, limit = 100, offset = 0) => {
        try {
            const response = await api.get(`/playlist/${playlistId}`, { params: { limit, offset } });
            return response.data;
        } catch (error) {
            console.error('Playlist API Error:', error);
            throw error;
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

    openDirectory: async (path) => {
        try {
            const response = await api.get('/api/open_directory', { params: { path } });
            return response.data;
        } catch (error) {
            console.error("Open Directory Error:", error);
            throw error;
        }
    },

    // Used for constructing absolute URLs (DownloadContext / LocalPlayerModal)
    getBaseURL: () => BASE_URL,

    deleteFile: async (filepath) => {
        try {
            const response = await api.delete('/file', { data: { filepath } });
            return response.data;
        } catch (error) {
            console.error('Delete File Error:', error);
            throw error;
        }
    },
};
