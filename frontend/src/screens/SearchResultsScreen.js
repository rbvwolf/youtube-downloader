import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, StatusBar, SafeAreaView, StyleSheet, ActivityIndicator, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/Api';
import { formatViews } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function SearchResultsScreen({ route, navigation }) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const initialQuery = route.params?.query || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [videoFormats, setVideoFormats] = useState({ video_id: null, title: '', formats: [] });
    const [fetchingInfo, setFetchingInfo] = useState(false);

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
                setVideoFormats({
                    video_id: video.id,
                    title: data.details?.title || video.title,
                    formats: data.qualities
                });
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

    const triggerDownload = async (quality) => {
        setModalVisible(false); // Close modal first
        showToast("Starting download...", "info"); // Feedback that request is sent
        try {
            await api.downloadVideo(videoFormats.video_id, quality);
            showToast("Download started successfully!", "success");
        } catch (error) {
            console.error("Download failed:", error);
            showToast("Failed to start download.", "error");
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
        recognition.lang = 'tr-TR';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSearchQuery(transcript);
            handleSearch(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
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
                            placeholder="Search YouTube..."
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
                            <MaterialIcons name="mic" size={24} color={isListening ? theme.background : theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Video List */}
                <ScrollView style={styles.videoListContainer} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.loadingText}>Searching...</Text>
                        </View>
                    ) : (
                        videos.map((video) => (
                            <TouchableOpacity
                                key={video.id}
                                style={[styles.videoItemContainer, { cursor: 'pointer' }]}
                                onPress={() => fetchVideoInfo(video)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.thumbnailContainer}>
                                    <ImageBackground source={{ uri: video.thumbnail }} style={styles.thumbnailImage} />
                                    <View style={styles.durationBadge}>
                                        <Text style={styles.durationText}>
                                            {video.isLive ? 'LIVE' : video.duration}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.videoInfoContainer}>
                                    <View style={styles.channelAvatar} />
                                    <View style={styles.videoTextContainer}>
                                        <Text style={styles.videoTitle} numberOfLines={2}>
                                            {video.title}
                                        </Text>
                                        <Text style={styles.videoMetaText}>
                                            {video.channel} {video.views ? `• ${video.views}` : ''}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={[styles.moreButton, { cursor: 'pointer' }]}>
                                        <MaterialIcons name="more-vert" size={20} color={theme.iconInactive} />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                    <View style={styles.bottomPadding} />
                </ScrollView>
            </View>

            {/* Quality Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalDragHandle} />

                        {selectedVideo && (
                            <View style={styles.modalVideoHeader}>
                                <ImageBackground source={{ uri: selectedVideo.thumbnail }} style={styles.modalThumbnail} />
                                <View style={styles.modalVideoInfo}>
                                    <Text style={styles.modalTitle} numberOfLines={2}>
                                        {selectedVideo.title}
                                    </Text>
                                    <Text style={styles.modalChannel}>
                                        {selectedVideo.channel}
                                    </Text>
                                </View>
                            </View>
                        )}

                        <Text style={styles.modalSectionTitle}>Download Quality</Text>

                        {fetchingInfo ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={styles.modalLoadingText}>Fetching qualities...</Text>
                            </View>
                        ) : (
                            <ScrollView style={{ marginTop: 8 }} showsVerticalScrollIndicator={false}>
                                {videoFormats.formats.map((format, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.formatOption, { cursor: 'pointer' }]}
                                        onPress={() => triggerDownload(format.quality)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.formatIconContainer, { backgroundColor: theme.chipInactiveBg }]}>
                                                <MaterialIcons
                                                    name={format.quality === 'audio' ? 'audiotrack' : 'videocam'}
                                                    size={24}
                                                    color={theme.primary}
                                                />
                                            </View>
                                            <View style={{ marginLeft: 16 }}>
                                                <Text style={styles.formatResolution}>
                                                    {format.label}
                                                </Text>
                                                <Text style={styles.formatDetails}>
                                                    {format.quality === 'audio' ? 'MP3' : 'MP4'} format
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.downloadButtonSmall}>
                                            <MaterialIcons name="file-download" size={20} color={theme.card} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
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
        videoItemContainer: { marginBottom: 24 },
        thumbnailContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.chipInactiveBg, marginBottom: 12 },
        thumbnailImage: { width: '100%', height: '100%' },
        durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
        durationText: { fontSize: s(12), fontWeight: '600', color: 'white' },
        videoInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
        channelAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.border, marginRight: 12 },
        videoTextContainer: { flex: 1, justifyContent: 'center' },
        videoTitle: { fontSize: s(16), fontWeight: '700', color: theme.text, marginBottom: 4 },
        videoMetaText: { fontSize: s(12), fontWeight: '500', color: theme.subText },
        moreButton: { padding: 4 },
        bottomPadding: { height: 80 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: theme.contentBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, maxHeight: '80%', maxWidth: 800, width: '100%', alignSelf: 'center' },
        modalDragHandle: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
        modalVideoHeader: { flexDirection: 'row', marginBottom: 20 },
        modalThumbnail: { width: 120, height: 68, borderRadius: 8, overflow: 'hidden', marginRight: 16, backgroundColor: theme.chipInactiveBg },
        modalVideoInfo: { flex: 1, justifyContent: 'center' },
        modalTitle: { fontSize: s(16), fontWeight: 'bold', color: theme.text, marginBottom: 4 },
        modalChannel: { fontSize: s(13), color: theme.subText },
        modalSectionTitle: { fontSize: s(14), fontWeight: 'bold', color: theme.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
        modalLoading: { paddingVertical: 40, alignItems: 'center' },
        modalLoadingText: { marginTop: 16, color: theme.subText, fontSize: s(14) },
        formatOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.border, marginBottom: 8, borderRadius: 12 },
        formatIconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
        formatResolution: { fontSize: s(16), fontWeight: '600', color: theme.text },
        formatDetails: { fontSize: s(12), color: theme.subText, marginTop: 4 },
        downloadButtonSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' }
    });
};
