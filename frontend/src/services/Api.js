import axios from 'axios';

// Backend IP Adresinizi buraya girin. Eğer emulator kullanıyorsanız 10.0.2.2 olabilir.
const BASE_URL = 'http://127.0.0.1:8000';

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

    getVideoInfo: async (videoId) => {
        try {
            const response = await api.get(`/info/${videoId}`);
            return response.data;
        } catch (error) {
            console.error("Info API Error:", error);
            throw error;
        }
    },

    downloadVideo: async (videoId, quality) => {
        try {
            const response = await api.post('/download', {
                video_id: videoId,
                quality: quality
            });
            return response.data;
        } catch (error) {
            console.error("Download API Error:", error);
            throw error;
        }
    }
};
