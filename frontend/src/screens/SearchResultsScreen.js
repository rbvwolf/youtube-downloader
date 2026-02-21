import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, StatusBar, SafeAreaView, StyleSheet, ActivityIndicator, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/Api';
import { formatViews } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useDownloads } from '../context/DownloadContext';
import VideoCard from '../components/VideoCard';
import VoiceSearchOverlay from '../components/VoiceSearchOverlay';
import QualitySelectionModal from '../components/QualitySelectionModal';
import VideoPreviewModal from '../components/VideoPreviewModal';

export default function SearchResultsScreen({ route, navigation }) {
    const { theme, t } = useTheme();
    const { showToast } = useToast();
    const { startSimulation } = useDownloads();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const initialQuery = route.params?.query || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [videoFormats, setVideoFormats] = useState([]);
    const [fetchingInfo, setFetchingInfo] = useState(false);

    // Preview
    const [previewVideo, setPreviewVideo] = useState(null);
    const completedDownloads = useDownloads().completedDownloads;

    // Voice Search
    const [voiceSearchVisible, setVoiceSearchVisible] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const recognitionRef = React.useRef(null);

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    const handleSearch = async (queryToSearch) => {
        const query = queryToSearch || searchQuery;
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await api.searchVideos(query);
            if (data && data.results) {
                const formattedVideos = data.results.map(v => ({
                    id: v.id,
                    title: v.title,
                    channel: 'YouTube',
                    views: v.view_count ? `${formatViews(v.view_count)} views` : '',
                    duration: v.duration ? new Date(v.duration * 1000).toISOString().substring(14, 19) : 'LIVE',
                    thumbnail: v.thumbnails && v.thumbnails.length > 0 ? v.thumbnails[0].url : 'https://via.placeholder.com/320x180',
                    isLive: !v.duration
                }));
                setVideos(formattedVideos);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVideoInfo = async (video) => {
        setSelectedVideo(video);
        setModalVisible(true);
        setFetchingInfo(true);
        try {
            const data = await api.getVideoInfo(video.id);
            if (data && data.qualities) {
                setVideoFormats(data.qualities);
            } else {
                showToast("Format details could not be found", "error");
            }
        } catch (error) {
            console.error("Info fetch failed:", error);
            showToast("Failed to fetch video formats", "error");
            setModalVisible(false);
        } finally {
            setFetchingInfo(false);
        }
    };

    const handleQuickDownload = async (video, quality) => {
        setModalVisible(false);
        showToast(`Starting ${quality === 'audio' ? 'MP3' : 'MP4'} download...`, "info");
        try {
            await api.downloadVideo(video.id, quality);
            showToast(t('downloadSuccess'), "success");
            startSimulation(video, quality);
        } catch (error) {
            console.error("Quick Download Error:", error);
            showToast(t('downloadError'), "error");
        }
    };

    const startVoiceSearch = () => {
        if (Platform.OS !== 'web') {
            showToast('Voice search is only supported on web currently.', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Voice search is not supported in your browser.', 'error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.interimResults = true;

        recognition.onstart = () => {
            setVoiceTranscript('');
        };

        recognition.onresult = (event) => {
            let current = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                current += event.results[i][0].transcript;
            }
            setVoiceTranscript(current);

            if (event.results[0].isFinal) {
                setTimeout(() => {
                    setVoiceSearchVisible(false);
                    setSearchQuery(current);
                    handleSearch(current);
                }, 1000);
            }
        };

        recognition.onerror = (e) => {
            console.error("Voice Error", e);
            if (e.error === 'not-allowed') {
                showToast("Microphone access denied. Please allow it in settings.", "error");
            } else {
                showToast("Voice search error: " + e.error, "error");
            }
            setVoiceSearchVisible(false);
        };
        recognition.onend = () => setVoiceSearchVisible(false);

        setVoiceSearchVisible(true);
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
            showToast("Failed to start voice recognition.", "error");
            setVoiceSearchVisible(false);
        }
    };

    const cancelVoiceSearch = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setVoiceSearchVisible(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.contentContainer}>
                {/* Search Header */}
                <View style={[styles.searchHeaderContainer, { flexDirection: 'row', alignItems: 'center' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
                        <MaterialIcons name="arrow-back" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.searchBar}>
                        <View style={styles.searchIconContainer}>
                            <MaterialIcons name="search" size={24} color={theme.iconInactive} />
                        </View>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('searchPlaceholder')}
                            placeholderTextColor={theme.iconInactive}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={() => handleSearch(searchQuery)}
                            returnKeyType="search"
                        />
                        <TouchableOpacity
                            onPress={startVoiceSearch}
                            style={[styles.micButton, { cursor: 'pointer' }]}
                        >
                            <MaterialIcons name="mic" size={24} color={voiceSearchVisible ? theme.background : theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Video List */}
                <ScrollView style={styles.videoListContainer} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.loadingText}>{t('searching')}</Text>
                        </View>
                    ) : (
                        videos.map((video) => (
                            <VideoCard
                                key={video.id}
                                video={video}
                                theme={theme}
                                onDownload={(quality) => handleQuickDownload(video, quality)}
                                onMoreInfo={() => fetchVideoInfo(video)}
                                onPlay={() => setPreviewVideo(video)}
                            />
                        ))
                    )}
                    <View style={styles.bottomPadding} />
                </ScrollView>
            </View>

            <VoiceSearchOverlay
                visible={voiceSearchVisible}
                onCancel={cancelVoiceSearch}
                transcript={voiceTranscript}
                theme={theme}
            />

            <QualitySelectionModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                video={selectedVideo}
                formats={videoFormats}
                isFetching={fetchingInfo}
                theme={theme}
                onDownload={(quality) => handleQuickDownload(selectedVideo, quality)}
            />

            <VideoPreviewModal
                visible={!!previewVideo}
                video={previewVideo}
                theme={theme}
                t={t}
                completedDownloads={completedDownloads}
                onClose={() => setPreviewVideo(null)}
                onDownload={(quality) => {
                    handleQuickDownload(previewVideo, quality);
                    setPreviewVideo(null);
                }}
                onMoreInfo={(v) => {
                    setPreviewVideo(null);
                    fetchVideoInfo(previewVideo);
                }}
            />
        </SafeAreaView>
    );
}

const createStyles = (theme) => {
    const s = (size) => size * (theme.fontScale || 1);

    return StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.background },
        contentContainer: { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: theme.contentBackground },
        searchHeaderContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: theme.headerBackground },
        searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: theme.searchBackground, borderRadius: 28, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2, borderWidth: theme.isDark ? 1 : 0, borderColor: theme.border },
        searchIconContainer: { padding: 12 },
        searchInput: { flex: 1, fontSize: s(16), color: theme.text, outlineStyle: 'none' },
        micButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primaryBg, justifyContent: 'center', alignItems: 'center' },
        videoListContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
        loadingContainer: { marginTop: 40, alignItems: 'center', justifyContent: 'center' },
        loadingText: { marginTop: 12, color: theme.subText, fontSize: s(14), fontWeight: '500' },
        loadingText: { marginTop: 12, color: theme.subText, fontSize: s(14), fontWeight: '500' },
        bottomPadding: { height: 80 }
    });
};
