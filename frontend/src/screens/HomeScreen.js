import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, StatusBar, SafeAreaView, StyleSheet, ActivityIndicator, Platform, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/Api';
import { formatViews } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function HomeScreen() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [searchQuery, setSearchQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [activeCategory, setActiveCategory] = useState('Recent');
    const [isListening, setIsListening] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [videoFormats, setVideoFormats] = useState({ video_id: null, title: '', formats: [] });
    const [fetchingInfo, setFetchingInfo] = useState(false);

    // Initial load: Fetch some default trending or empty state
    useEffect(() => {
        handleSearch('lofi hip hop'); // Default generic search for visual feedback
    }, []);

    const handleSearch = async (queryToSearch) => {
        const query = queryToSearch || searchQuery;
        if (!query.trim()) return;

        setLoading(true);
        try {
            const data = await api.searchVideos(query);
            if (data && data.results) {
                // Map yt-dlp response to UI format
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

    const handleCategorySelect = (category) => {
        setActiveCategory(category);
        setSearchQuery(category === 'Recent' ? 'lofi hip hop' : category);
        handleSearch(category === 'Recent' ? 'lofi hip hop' : category);
    };

    const fetchVideoInfo = async (video) => {
        setSelectedVideo(video);
        setModalVisible(true);
        setFetchingInfo(true);
        try {
            const data = await api.getVideoInfo(video.id);
            if (data && data.formats) {
                setVideoFormats({
                    video_id: video.id,
                    title: video.title,
                    formats: data.formats
                });
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
            alert('Voice search is only supported on web currently.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice search is not supported in your browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'tr-TR'; // Setting to Turkish based on conversation, or 'en-US' fallback. Let's use 'en-US' or let browser decide by not forcing unless needed. We'll set 'tr-TR' and fallback. Actually let's use the browser default.

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
                <View style={styles.searchHeaderContainer}>
                    <View style={styles.searchBar}>
                        <View style={styles.searchIconContainer}>
                            <MaterialIcons name="search" size={24} color={theme.iconInactive} />
                        </View>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search YouTube or paste link..."
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

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterScrollContent}
                    >
                        {['Recent', 'Trending', 'Music', 'Gaming'].map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[styles.filterChip, activeCategory === category ? styles.filterChipActive : styles.filterChipInactive, { cursor: 'pointer' }]}
                                onPress={() => handleCategorySelect(category)}
                            >
                                <Text style={activeCategory === category ? styles.filterChipTextActive : styles.filterChipTextInactive}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
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

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={[styles.fab, { cursor: 'pointer' }]}
                    activeOpacity={0.9}
                >
                    <MaterialIcons name="add-link" size={28} color="white" />
                </TouchableOpacity>
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
                        <Text style={styles.modalTitle} numberOfLines={2}>
                            {videoFormats.title || 'Loading options...'}
                        </Text>

                        {fetchingInfo ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={styles.modalLoadingText}>Fetching qualities...</Text>
                            </View>
                        ) : (
                            <ScrollView style={{ marginTop: 16 }} showsVerticalScrollIndicator={false}>
                                {videoFormats.formats.map((format, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.formatOption, { cursor: 'pointer' }]}
                                        onPress={() => triggerDownload(format.format_id)}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <MaterialIcons
                                                name={format.vcodec !== 'none' ? 'videocam' : 'audiotrack'}
                                                size={24}
                                                color={theme.primary}
                                            />
                                            <View style={{ marginLeft: 16 }}>
                                                <Text style={styles.formatResolution}>
                                                    {format.resolution === 'audio only' ? 'Audio Only' : format.resolution}
                                                </Text>
                                                <Text style={styles.formatDetails}>
                                                    {format.ext.toUpperCase()} • {format.filesize ? (format.filesize / 1024 / 1024).toFixed(1) + ' MB' : 'Size unknown'}
                                                </Text>
                                            </View>
                                        </View>
                                        <MaterialIcons name="file-download" size={24} color={theme.iconInactive} />
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

const createStyles = (theme) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background
    },
    contentContainer: { // Desktop Responsiveness Container
        flex: 1,
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
        backgroundColor: theme.contentBackground
    },
    searchHeaderContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: theme.headerBackground
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: theme.searchBackground,
        borderRadius: 28,
        paddingHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0.2 : 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border
    },
    searchIconContainer: {
        padding: 12
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.text,
        outlineStyle: 'none' // Remove default web focus outline
    },
    micButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.primaryBg,
        justifyContent: 'center',
        alignItems: 'center'
    },
    filterContainer: {
        height: 48,
        marginBottom: 8
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        alignItems: 'center'
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        justifyContent: 'center',
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.border
    },
    filterChipInactive: {
        backgroundColor: theme.chipInactiveBg
    },
    filterChipActive: {
        backgroundColor: theme.primary
    },
    filterChipTextInactive: {
        fontSize: 14,
        fontWeight: '500',
        color: theme.chipInactiveText
    },
    filterChipTextActive: {
        fontSize: 14,
        fontWeight: '500',
        color: '#ffffff'
    },
    videoListContainer: {
        flex: 1,
        paddingHorizontal: 16
    },
    loadingContainer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingText: {
        marginTop: 12,
        color: theme.subText,
        fontSize: 14,
        fontWeight: '500'
    },
    videoItemContainer: {
        marginBottom: 24
    },
    thumbnailContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.chipInactiveBg,
        marginBottom: 12
    },
    thumbnailImage: {
        width: '100%',
        height: '100%'
    },
    durationBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4
    },
    durationText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'white'
    },
    videoInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    channelAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.border,
        marginRight: 12
    },
    videoTextContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 4
    },
    videoMetaText: {
        fontSize: 12,
        fontWeight: '500',
        color: theme.subText
    },
    moreButton: {
        padding: 4
    },
    bottomPadding: {
        height: 80
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.contentBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 24,
        maxHeight: '80%',
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
    },
    modalDragHandle: {
        width: 40,
        height: 4,
        backgroundColor: theme.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalLoading: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    modalLoadingText: {
        marginTop: 16,
        color: theme.subText,
        fontSize: 14,
    },
    formatOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    formatResolution: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
    },
    formatDetails: {
        fontSize: 12,
        color: theme.subText,
        marginTop: 4,
    }
});
