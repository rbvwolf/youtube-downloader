import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, StatusBar, SafeAreaView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../services/Api';
import { formatViews, formatDuration } from '../utils/formatters';
import { useDownloads } from '../context/DownloadContext';
import { useSearchHistory } from '../context/SearchContext';
import VideoCard from '../components/VideoCard';
import VoiceSearchOverlay from '../components/VoiceSearchOverlay';
import QualitySelectionModal from '../components/QualitySelectionModal';
import VideoPreviewModal from '../components/VideoPreviewModal';

const RECENT_SEARCHES_KEY = '@recent_searches';
const DEFAULT_CHIPS = ['Music', 'Podcasts', 'News'];

// YouTube-style suggestion row with hover effect
function SuggestionRow({ item, isHistory, renderText, theme, styles, onPress }) {
    const [hovered, setHovered] = React.useState(false);
    return (
        <TouchableOpacity
            style={[
                styles.suggestionItem,
                { cursor: 'pointer' },
                hovered && { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }
            ]}
            onPress={onPress}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            activeOpacity={0.8}
        >
            <MaterialIcons
                name={isHistory ? 'history' : 'search'}
                size={20}
                color={theme.iconInactive}
                style={{ marginRight: 14, flexShrink: 0 }}
            />
            <View style={{ flex: 1 }}>{renderText()}</View>
            {/* Arrow to fill current query with suggestion */}
            <TouchableOpacity
                style={{ padding: 8, cursor: 'pointer' }}
                onPress={(e) => { e?.stopPropagation?.(); }}
            >
                <MaterialIcons name="north-west" size={16} color={theme.iconInactive} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export default function HomeScreen({ navigation }) {
    const { theme, t } = useTheme();
    const { showToast } = useToast();
    const { startSimulation } = useDownloads();
    const { recentSearches, saveRecentSearch, clearRecentSearches, loadRecentSearches } = useSearchHistory();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const [trendingVideos, setTrendingVideos] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(false);

    // Voice Search
    const [voiceSearchVisible, setVoiceSearchVisible] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const recognitionRef = React.useRef(null);

    // Quality Modal
    const [qualityModalVisible, setQualityModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoFormats, setVideoFormats] = useState([]);
    const [fetchingInfo, setFetchingInfo] = useState(false);

    // Preview
    const [previewVideo, setPreviewVideo] = useState(null);
    const { completedDownloads, downloadPath } = useDownloads();

    useEffect(() => {
        loadRecentSearches();
        fetchTrending();

        const unsubscribe = navigation.addListener('focus', () => {
            loadRecentSearches();
            setSearchQuery(''); // reset search query when coming back
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (searchQuery.trim().length > 0) {
                const q = searchQuery.toLowerCase().trim();
                const translatedChips = [t('music'), t('podcasts'), t('news')];
                const allAvailable = [...new Set([...translatedChips, ...recentSearches])];
                const localFiltered = allAvailable.filter(item => item.toLowerCase().includes(q) && item.toLowerCase() !== q);

                try {
                    const data = await api.getSuggestions(q);
                    console.log('Gelen Öneriler:', data);
                    let remoteSuggestions = data?.suggestions || [];
                    // Combine local and remote
                    const combined = [...new Set([...localFiltered, ...remoteSuggestions])];
                    console.log('Birleşik Öneriler:', combined);
                    setSuggestions(combined.slice(0, 8));
                } catch (e) {
                    console.log('Öneri fetch hatası:', e);
                    setSuggestions(localFiltered.slice(0, 5));
                }
            } else {
                setSuggestions([]);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchSuggestions();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, recentSearches, t]);

    const handleSearch = (queryToSearch) => {
        const query = (queryToSearch || searchQuery).trim();
        if (!query) return;

        saveRecentSearch(query);
        setSearchQuery('');
        setSuggestions([]);
        setIsSearchFocused(false);
        navigation.navigate('SearchResults', { query });
    };

    // Renders suggestion text: typed portion normal, suggested suffix bold
    const renderSuggestionText = (suggestion) => {
        const q = searchQuery.trim().toLowerCase();
        const s = suggestion.toLowerCase();
        if (q && s.startsWith(q)) {
            const typed = suggestion.slice(0, searchQuery.trim().length);
            const suggested = suggestion.slice(searchQuery.trim().length);
            return (
                <Text style={styles.suggestionText}>
                    <Text style={{ fontWeight: '400' }}>{typed}</Text>
                    <Text style={{ fontWeight: '700' }}>{suggested}</Text>
                </Text>
            );
        }
        return <Text style={[styles.suggestionText, { fontWeight: '700' }]}>{suggestion}</Text>;
    };

    const fetchTrending = async () => {
        setLoadingTrending(true);
        try {
            // Fetch Turkish trending videos
            const data = await api.searchVideos('Türkiye trend videolar');
            if (data && data.results) {
                const formatted = data.results.slice(0, 5).map(v => ({
                    id: v.id,
                    title: v.title,
                    channel: 'YouTube Engine',
                    views: v.view_count ? `${formatViews(v.view_count)} views` : '',
                    duration: v.duration ? formatDuration(v.duration) : 'LIVE',
                    thumbnail: v.thumbnails && v.thumbnails.length > 0 ? v.thumbnails[0].url : 'https://via.placeholder.com/320x180',
                    isLive: !v.duration
                }));
                setTrendingVideos(formatted);
            }
        } catch (e) {
            console.error("Failed to fetch trending:", e);
        } finally {
            setLoadingTrending(false);
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
        recognition.lang = 'en-US'; // Or map based on language pref
        recognition.interimResults = true;

        recognition.onstart = () => {
            setVoiceTranscript('');
            // Optional: You could update an inner state here, but visibility is handled synchronously below
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
                showToast(t('micDenied'), "error");
            } else {
                showToast("Voice search error: " + e.error, "error");
            }
            setVoiceSearchVisible(false);
        };
        recognition.onend = () => setVoiceSearchVisible(false);

        // Show visibility immediately before start to provide visual feedback instantly
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

    const handleQuickDownload = async (video, quality) => {
        showToast(`Starting ${quality === 'audio' ? 'MP3' : 'MP4'} download...`, "info");
        try {
            await api.downloadVideo(video.id, quality, downloadPath);
            showToast(t('downloadSuccess'), "success");
            startSimulation(video, quality);
        } catch (error) {
            console.error("Quick Download Error:", error);
            showToast(t('downloadError'), "error");
        }
    };

    const fetchVideoInfo = async (video) => {
        setSelectedVideo(video);
        setQualityModalVisible(true);
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
            setQualityModalVisible(false);
        } finally {
            setFetchingInfo(false);
        }
    };

    const renderVideoCard = (video) => (
        <View style={{ width: 340, marginRight: 16 }} key={video.id}>
            <VideoCard
                video={video}
                theme={theme}
                onDownload={(quality) => handleQuickDownload(video, quality)}
                onMoreInfo={() => fetchVideoInfo(video)}
                onPlay={() => setPreviewVideo(video)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.contentContainer}>
                {/* Search Header */}
                <View style={styles.searchHeaderContainer}>
                    <View style={{ zIndex: 9999, elevation: 10, overflow: 'visible' }}>
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
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                returnKeyType="search"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8, cursor: 'pointer' }}>
                                    <MaterialIcons name="close" size={20} color={theme.iconInactive} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={startVoiceSearch}
                                style={[styles.micButton, { cursor: 'pointer' }]}
                            >
                                <MaterialIcons name="mic" size={24} color={isListening ? theme.background : theme.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* YouTube-style Suggestions Dropdown */}
                        {isSearchFocused && suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {suggestions.map((item, index) => {
                                    const isHistory = recentSearches.includes(item);
                                    return (
                                        <SuggestionRow
                                            key={index}
                                            item={item}
                                            isHistory={isHistory}
                                            renderText={() => renderSuggestionText(item)}
                                            theme={theme}
                                            styles={styles}
                                            onPress={() => handleSearch(item)}
                                        />
                                    );
                                })}
                                {/* Footer */}
                                <View style={styles.suggestionFooter}>
                                    <Text style={styles.suggestionFooterText}>Arama tahminlerini bildirme</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Fixed & Recent Chips */}
                    <View style={styles.recentSection}>
                        <View style={styles.recentHeader}>
                            <Text style={styles.sectionTitle}>{t('discover')}</Text>
                            {recentSearches.length > 0 && (
                                <TouchableOpacity onPress={clearRecentSearches} style={{ cursor: 'pointer' }}>
                                    <Text style={styles.clearText}>{t('clearHistory')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.chipsContainer}>
                            {/* Persistent Chips */}
                            {['music', 'podcasts', 'news'].map((itemKey, index) => (
                                <TouchableOpacity
                                    key={`default-${index}`}
                                    style={[styles.filterChip, { backgroundColor: theme.primary, borderColor: theme.primary, cursor: 'pointer' }]}
                                    onPress={() => handleSearch(t(itemKey))}
                                >
                                    <Text style={[styles.filterChipText, { color: '#fff' }]}>{t(itemKey)}</Text>
                                </TouchableOpacity>
                            ))}
                            {/* History Chips */}
                            {recentSearches.map((item, index) => (
                                <TouchableOpacity
                                    key={`history-${index}`}
                                    style={[styles.filterChip, { cursor: 'pointer' }]}
                                    onPress={() => handleSearch(item)}
                                >
                                    <Text style={styles.filterChipText}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Trending Section */}
                    <View style={styles.trendingSection}>
                        <Text style={styles.sectionTitle}>{t('trendingVideos')}</Text>
                        {loadingTrending ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.primary} />
                            </View>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12, paddingRight: 16 }}>
                                {trendingVideos.map(renderVideoCard)}
                            </ScrollView>
                        )}
                    </View>
                </ScrollView>
            </View>

            <VoiceSearchOverlay
                visible={voiceSearchVisible}
                onCancel={cancelVoiceSearch}
                transcript={voiceTranscript}
                theme={theme}
            />

            <QualitySelectionModal
                visible={qualityModalVisible}
                onClose={() => setQualityModalVisible(false)}
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

const createStyles = (theme) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.background },
    contentContainer: {
        flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center',
        backgroundColor: theme.contentBackground,
        overflow: 'visible',
    },
    searchHeaderContainer: {
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16,
        backgroundColor: theme.headerBackground,
        zIndex: 9999,
        elevation: 10,
        overflow: 'visible',
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', height: 56,
        backgroundColor: theme.searchBackground, borderRadius: 28,
        paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2,
        borderWidth: theme.isDark ? 1 : 0, borderColor: theme.border,
        zIndex: 11
    },
    searchIconContainer: { padding: 12 },
    searchInput: { flex: 1, fontSize: 16, color: theme.text, outlineStyle: 'none' },
    micButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primaryBg,
        justifyContent: 'center', alignItems: 'center'
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 62,
        left: 0,
        right: 0,
        backgroundColor: theme.isDark ? '#212121' : '#fff',
        borderRadius: 12,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: theme.isDark ? 0.5 : 0.18,
        shadowRadius: 20,
        elevation: 15,
        borderWidth: 1,
        borderColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
        zIndex: 10000,
        overflow: 'visible',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    suggestionText: {
        fontSize: 15,
        color: theme.text,
        fontWeight: '400',
        flex: 1,
    },
    suggestionFooter: {
        borderTopWidth: 1,
        borderTopColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'flex-end',
    },
    suggestionFooterText: {
        fontSize: 11,
        color: theme.iconInactive,
        fontStyle: 'italic',
    },
    scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
    recentSection: { marginBottom: 32 },
    recentHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    clearText: { fontSize: 14, color: theme.primary, fontWeight: '600' },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    filterChip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
        marginRight: 8, marginBottom: 12, backgroundColor: theme.chipInactiveBg,
        borderWidth: theme.isDark ? 1 : 0, borderColor: theme.border
    },
    filterChipText: { fontSize: 14, fontWeight: '500', color: theme.text },
    trendingSection: {
        marginTop: 8
    },
    loadingContainer: { padding: 40, alignItems: 'center' }
});
