import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, StatusBar, SafeAreaView, StyleSheet, Platform, ActivityIndicator, AppState } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import api from '../services/Api';
import { formatViews, formatDuration } from '../utils/formatters';
import { useDownloads } from '../context/DownloadContext';
import { useSearchHistory } from '../context/SearchContext';
import VideoCard from '../components/VideoCard';
import VoiceSearchOverlay from '../components/VoiceSearchOverlay';
import VoiceSearchModal from '../components/VoiceSearchModal';
import QualitySelectionModal from '../components/QualitySelectionModal';
import VideoPreviewModal from '../components/VideoPreviewModal';

const RECENT_SEARCHES_KEY = '@recent_searches';
const DEFAULT_CHIPS = ['Music', 'Podcasts', 'News'];

// YouTube-style suggestion row with hover effect
function SuggestionRow({ item, isHistory, renderText, theme, styles, onPress, onFill }) {
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
            {/* Arama kutusunu o öneriyle dolduran ok — aramayı başlatmaz */}
            <TouchableOpacity
                style={{ padding: 8, cursor: 'pointer' }}
                onPress={(e) => {
                    e?.stopPropagation?.();
                    onFill && onFill(item);
                }}
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
    // Blur race condition önleyici: bir öneriye dokunulurken focus'u kapama
    const isTouchingSuggestion = useRef(false);

    const [trendingVideos, setTrendingVideos] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(false);

    // Clipboard algılama
    const [clipboardUrl, setClipboardUrl] = useState(null); // Panodan algılanan YouTube URL'si
    const lastCheckedClipboard = useRef(''); // Aynı URL için tekrar tekrar banner gösterme
    const appStateRef = useRef(AppState.currentState);

    // Voice Search (web)
    const [voiceSearchVisible, setVoiceSearchVisible] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const recognitionRef = React.useRef(null);

    // Voice Search (mobil native)
    const [nativeVoiceVisible, setNativeVoiceVisible] = useState(false);

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
            checkClipboard();  // Ekrana her dönüşte panoyu kontrol et
        });
        return unsubscribe;
    }, [navigation]);

    // Pano (Clipboard) kontrol fonksiyonu
    const checkClipboard = async () => {
        try {
            let text = '';
            if (Platform.OS === 'web') {
                // Web'de navigator.clipboard API'si — sadece güvenli context'te (https/localhost) çalışır
                if (navigator?.clipboard?.readText) {
                    text = await navigator.clipboard.readText();
                }
            } else {
                text = await Clipboard.getStringAsync();
            }

            if (!text) return;

            // YouTube URL kontrolü
            const isYouTubeUrl = /(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(text);
            if (isYouTubeUrl && text !== lastCheckedClipboard.current) {
                lastCheckedClipboard.current = text;
                setClipboardUrl(text.trim());
            }
        } catch (e) {
            // Clipboard okuma izni verilmemişse sessizce geç
            console.log('[Clipboard] Okunamadı:', e.message);
        }
    };

    // AppState dinleyicisi: uygulama arka plandan öne gelince panoyu kontrol et
    useEffect(() => {
        checkClipboard(); // İlk açılışta da kontrol et

        const subscription = AppState.addEventListener('change', (nextState) => {
            if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
                checkClipboard();
            }
            appStateRef.current = nextState;
        });

        return () => subscription?.remove();
    }, []);

    // Panodaki URL'yi video ID'ye çevir ve kalite modalını aç
    const handleClipboardDownload = async () => {
        if (!clipboardUrl) return;
        const match = clipboardUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([-\w]+)/);
        const videoId = match ? match[1] : null;
        if (!videoId) {
            showToast('Geçerli bir YouTube linki bulunamadı.', 'error');
            setClipboardUrl(null);
            return;
        }
        // Minimal bir video objesi oluştur, fetchVideoInfo zaten bilgileri çekecek
        const tempVideo = { id: videoId, title: 'Yükleniyor...', thumbnail: '', channel: '' };
        setClipboardUrl(null);
        fetchVideoInfo(tempVideo);
    };

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
        isTouchingSuggestion.current = false;
        navigation.navigate('SearchResults', { query });
    };

    // Öneri ok butonuna basılınca: aramayı tetikleme, sadece inputu doldur
    const handleFillQuery = (suggestion) => {
        setSearchQuery(suggestion);
        setIsSearchFocused(true);
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
        // --- Mobil: @react-native-voice/voice ile yerel ses tanima ---
        if (Platform.OS !== 'web') {
            setNativeVoiceVisible(true);
            return;
        }

        // --- Web: tarayici SpeechRecognition API ---
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Tarayicin sesli aramayı desteklemiyor. Chrome veya Edge kullan.', 'error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'tr-TR';
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
            console.error('Voice Error', e);
            if (e.error === 'not-allowed') {
                showToast(t('micDenied'), 'error');
            } else {
                showToast('Sesli arama hatasi: ' + e.error, 'error');
            }
            setVoiceSearchVisible(false);
        };
        recognition.onend = () => setVoiceSearchVisible(false);

        setVoiceSearchVisible(true);
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
            showToast('Sesli arama baslatilamıyor.', 'error');
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
        const label = quality === 'audio' ? 'MP3 sesi' : `${quality} video`;
        showToast(`${label} indirme baslatildi.`, 'info');
        try {
            await api.downloadVideo(video.id, quality, downloadPath);
            showToast(t('downloadSuccess'), 'success');
            startSimulation(video, quality);
        } catch (error) {
            console.error('Quick Download Error:', error);
            showToast('Indirme baslatılamadı. Backend çalışıyor mu?', 'error');
        }
    };

    const fetchVideoInfo = async (video) => {
        setSelectedVideo(video);
        setQualityModalVisible(true);
        setFetchingInfo(true);
        try {
            const data = await api.getVideoInfo(video.id);
            if (data && data.qualities) {
                // Gerçek bilgileri modal'a güncelle
                setSelectedVideo(prev => ({
                    ...prev,
                    title: data.details?.title || prev.title,
                    thumbnail: data.details?.thumbnail || prev.thumbnail,
                    duration: data.details?.duration || prev.duration,
                }));
                setVideoFormats(data.qualities);
            } else {
                showToast('Video kalite bilgisi alınamadı.', 'error');
            }
        } catch (error) {
            console.error('Info fetch failed:', error);
            showToast('Video bilgileri alınamadı. Lütfen tekrar deneyin.', 'error');
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
                                onBlur={() => {
                                    // Öneri listesine dokunuluyorsa focus'u kaybettirme
                                    setTimeout(() => {
                                        if (!isTouchingSuggestion.current) {
                                            setIsSearchFocused(false);
                                        }
                                    }, 300);
                                }}
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
                                            onPress={() => {
                                                isTouchingSuggestion.current = true;
                                                handleSearch(item);
                                            }}
                                            onFill={handleFillQuery}
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

                    {/* Clipboard Banner */}
                    {clipboardUrl && (
                        <View style={styles.clipboardBanner}>
                            <MaterialIcons name="link" size={18} color={theme.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.clipboardBannerText} numberOfLines={1}>
                                Panoda YouTube linki var
                            </Text>
                            <TouchableOpacity
                                style={[styles.clipboardBtn, { cursor: 'pointer' }]}
                                onPress={handleClipboardDownload}
                            >
                                <Text style={styles.clipboardBtnText}>Indir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ padding: 4, cursor: 'pointer' }}
                                onPress={() => setClipboardUrl(null)}
                            >
                                <MaterialIcons name="close" size={18} color={theme.iconInactive} />
                            </TouchableOpacity>
                        </View>
                    )}
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

            {/* Mobil sesli arama modal'i — sadece native platformlarda goruntulenir */}
            {nativeVoiceVisible && (
                <VoiceSearchModal
                    onClose={() => setNativeVoiceVisible(false)}
                    onResult={(text) => {
                        setNativeVoiceVisible(false);
                        handleSearch(text);
                    }}
                />
            )}
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
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
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
    // Clipboard banner — arama barının hemen altında gösterilir
    clipboardBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.primary + '40',
    },
    clipboardBannerText: {
        flex: 1,
        fontSize: 13,
        color: theme.subText,
        fontWeight: '500',
    },
    clipboardBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: theme.primary,
        borderRadius: 20,
        marginRight: 8,
    },
    clipboardBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
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
