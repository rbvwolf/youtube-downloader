import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, StatusBar, SafeAreaView, StyleSheet, ActivityIndicator, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/Api';
import { formatViews, formatDuration } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useDownloads } from '../context/DownloadContext';
import { useSearchHistory } from '../context/SearchContext';
import VideoCard from '../components/VideoCard';
import VoiceSearchOverlay from '../components/VoiceSearchOverlay';
import VoiceSearchModal from '../components/VoiceSearchModal';
import QualitySelectionModal from '../components/QualitySelectionModal';
import VideoPreviewModal from '../components/VideoPreviewModal';
import PlaylistModal from '../components/PlaylistModal';

/** Arama sonuçlarında playlist için özel kart */
function PlaylistCard({ playlist, theme, onPress }) {
    return (
        <TouchableOpacity
            style={{
                flexDirection: 'row',
                backgroundColor: theme.card,
                borderRadius: 16,
                marginBottom: 12,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.border,
            }}
            activeOpacity={0.85}
            onPress={onPress}
        >
            {/* Thumbnail */}
            <View style={{ width: 130, height: 86, backgroundColor: theme.chipInactiveBg, position: 'relative' }}>
                {playlist.thumbnail ? (
                    <Image source={{ uri: playlist.thumbnail }} style={{ width: '100%', height: '100%' }} />
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="playlist-play" size={40} color={theme.iconInactive} />
                    </View>
                )}
                {/* Playlist badge */}
                <View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: 4, alignItems: 'center',
                }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                        📋 {playlist.video_count || '?'} video
                    </Text>
                </View>
            </View>
            {/* Info */}
            <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
                <View style={{
                    alignSelf: 'flex-start', backgroundColor: theme.primary + '22',
                    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 6,
                }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary }}>PLAYLIST</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, lineHeight: 20 }} numberOfLines={2}>
                    {playlist.title}
                </Text>
                {!!playlist.channel && (
                    <Text style={{ fontSize: 12, color: theme.subText, marginTop: 4 }} numberOfLines={1}>
                        {playlist.channel}
                    </Text>
                )}
            </View>
            <View style={{ justifyContent: 'center', paddingRight: 12 }}>
                <MaterialIcons name="chevron-right" size={24} color={theme.iconInactive} />
            </View>
        </TouchableOpacity>
    );
}

export default function SearchResultsScreen({ route, navigation }) {
    const { theme, t } = useTheme();
    const { showToast } = useToast();
    const { startSimulation } = useDownloads();
    const { saveRecentSearch } = useSearchHistory();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const initialQuery = route.params?.query || '';
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [videoFormats, setVideoFormats] = useState([]);
    const [fetchingInfo, setFetchingInfo] = useState(false);

    // Öneriler
    const [suggestions, setSuggestions] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const isTouchingSuggestion = useRef(false);
    const suggTimerRef = useRef(null);

    // Playlist modal
    const [playlistModalData, setPlaylistModalData] = useState(null);

    // Preview
    const [previewVideo, setPreviewVideo] = useState(null);
    const { completedDownloads, downloadPath } = useDownloads();

    // Voice Search (web)
    const [voiceSearchVisible, setVoiceSearchVisible] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const recognitionRef = React.useRef(null);

    // Voice Search (mobil native)
    const [nativeVoiceVisible, setNativeVoiceVisible] = useState(false);

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    const PLAYLIST_QUERY_RE = /[?&]list=[A-Za-z0-9_-]{6,}|^PL[A-Za-z0-9_-]{6,}$/;

    const handleSearch = async (queryToSearch) => {
        let query = queryToSearch || searchQuery;
        if (!query.trim()) return;

        // Geçmişten "📋 Title|ID" formatında geldiyse asıl ID'yi/URL'yi al
        if (query.startsWith('📋 ') && query.includes('|')) {
            query = query.split('|')[1].trim();
        }

        const isPlaylist = PLAYLIST_QUERY_RE.test(query.trim());

        // Normal aramalar hemen geçmişe eklenir; playlist URL'leri sonuç geldikten sonra eklenir
        if (!isPlaylist) saveRecentSearch(query.trim());

        setSuggestions([]);
        setIsSearchFocused(false);
        setLoading(true);
        try {
            const data = await api.searchVideos(query);
            if (data && data.results) {
                const formattedVideos = data.results.map(v => ({
                    id: v.id,
                    title: v.title,
                    channel: v.channel || 'YouTube',
                    views: v.view_count ? `${formatViews(v.view_count)} views` : '',
                    duration: v.duration ? formatDuration(v.duration) : (v.is_playlist ? `${v.video_count} video` : 'LIVE'),
                    thumbnail: v.thumbnails?.[0]?.url || v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
                    isLive: !v.duration && !v.is_playlist,
                    is_playlist:   v.is_playlist   || false,
                    playlist_id:   v.playlist_id   || v.id,
                    video_count:   v.video_count,
                }));
                setVideos(formattedVideos);

                // Playlist URL aratıldıysa: ilk playlist sonucunun adını kaydet
                if (isPlaylist) {
                    const plResult = formattedVideos.find(v => v.is_playlist);
                    if (plResult?.title) {
                        saveRecentSearch(`📋 ${plResult.title}|${plResult.playlist_id}`);
                    } else {
                        // Başlık bulunamadı — kısaltılmış ID
                        const plMatch = /[?&]list=([A-Za-z0-9_-]{6,})/.exec(query);
                        const plId = plMatch ? plMatch[1] : query.trim();
                        saveRecentSearch(`📋 ${plId.slice(0, 24)}…|${plId}`);
                    }
                }
            }
        } catch (error) {
            console.error(error);
            showToast('Arama sonuçları alınamadı. Bağlantını kontrol et.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Öneri getirme (debounce)
    const fetchSuggestions = (q) => {
        if (suggTimerRef.current) clearTimeout(suggTimerRef.current);
        if (!q.trim()) { setSuggestions([]); return; }
        suggTimerRef.current = setTimeout(async () => {
            try {
                const data = await api.getSuggestions(q.trim());
                setSuggestions((data?.suggestions || []).slice(0, 8));
            } catch {
                setSuggestions([]);
            }
        }, 300);
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
                showToast('Video kalite bilgisi alınamadı.', 'error');
            }
        } catch (error) {
            console.error('Info fetch failed:', error);
            showToast('Video bilgileri alınamadı. Lütfen tekrar deneyin.', 'error');
            setModalVisible(false);
        } finally {
            setFetchingInfo(false);
        }
    };

    const handleQuickDownload = async (video, quality) => {
        setModalVisible(false);
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
                    <View style={{ flex: 1, position: 'relative' }}>
                        <View style={styles.searchBar}>
                            <View style={styles.searchIconContainer}>
                                <MaterialIcons name="search" size={24} color={theme.iconInactive} />
                            </View>
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('searchPlaceholder')}
                                placeholderTextColor={theme.iconInactive}
                                value={searchQuery}
                                onChangeText={(text) => { setSearchQuery(text); fetchSuggestions(text); }}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => { if (!isTouchingSuggestion.current) setSuggestions([]); }}
                                onSubmitEditing={() => handleSearch(searchQuery)}
                                returnKeyType="search"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => { setSearchQuery(''); fetchSuggestions(''); }} style={{ padding: 8, cursor: 'pointer' }}>
                                    <MaterialIcons name="close" size={20} color={theme.iconInactive} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => handleSearch(searchQuery)} style={{ padding: 8, cursor: 'pointer', backgroundColor: theme.isDark ? '#333' : '#eee', borderRadius: 20, marginRight: 4 }}>
                                <MaterialIcons name="search" size={20} color={theme.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={startVoiceSearch} style={[styles.micButton, { cursor: 'pointer' }]}>
                                <MaterialIcons name="mic" size={24} color={voiceSearchVisible ? theme.background : theme.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Öneri dropdown */}
                        {isSearchFocused && suggestions.length > 0 && (
                            <View style={[styles.suggestionContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                {suggestions.map((s, i) => {
                                    let displayStr = s;
                                    if (s.startsWith('📋 ') && s.includes('|')) {
                                        displayStr = `📋 ${s.split('|')[0].replace('📋 ', '').trim()}`;
                                    }
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={styles.suggestionRow}
                                            onPressIn={() => { isTouchingSuggestion.current = true; }}
                                            onPress={() => {
                                                isTouchingSuggestion.current = false;
                                                setSearchQuery(displayStr);
                                                handleSearch(s); // Orijinal string'i search'e yolla (ID'yi barındırır)
                                            }}
                                        >
                                            <MaterialIcons name="search" size={16} color={theme.iconInactive} style={{ marginRight: 10 }} />
                                            <Text style={{ flex: 1, fontSize: 14, color: theme.text }} numberOfLines={1}>{displayStr}</Text>
                                            <TouchableOpacity
                                                onPressIn={() => { isTouchingSuggestion.current = true; }}
                                                onPress={() => { isTouchingSuggestion.current = false; setSearchQuery(displayStr); }}
                                            >
                                                <MaterialIcons name="north-west" size={16} color={theme.iconInactive} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
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
                        videos.map((video) =>
                            video.is_playlist ? (
                                <PlaylistCard
                                    key={video.playlist_id || video.id}
                                    playlist={video}
                                    theme={theme}
                                    onPress={() => setPlaylistModalData(video)}
                                />
                            ) : (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    theme={theme}
                                    onDownload={(quality) => handleQuickDownload(video, quality)}
                                    onMoreInfo={() => fetchVideoInfo(video)}
                                    onPlay={() => setPreviewVideo(video)}
                                />
                            )
                        )
                    )}
                    <View style={styles.bottomPadding} />
                </ScrollView>
            </View>

            <VoiceSearchOverlay
                visible={voiceSearchVisible}
                onCancel={() => {
                    if (recognitionRef.current) recognitionRef.current.stop();
                    setVoiceSearchVisible(false);
                }}
                transcript={voiceTranscript}
                theme={theme}
            />

            {/* Mobil sesli arama modal'i */}
            {nativeVoiceVisible && (
                <VoiceSearchModal
                    onClose={() => setNativeVoiceVisible(false)}
                    onResult={(text) => {
                        setNativeVoiceVisible(false);
                        setSearchQuery(text);
                        handleSearch(text);
                    }}
                />
            )}

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

            <PlaylistModal
                visible={!!playlistModalData}
                playlistId={playlistModalData?.playlist_id}
                playlistMeta={playlistModalData}
                onClose={() => setPlaylistModalData(null)}
                theme={theme}
            />
        </SafeAreaView>
    );
}

const createStyles = (theme) => {
    const s = (size) => size * (theme.fontScale || 1);

    return StyleSheet.create({
        safeArea: { flex: 1, backgroundColor: theme.background },
        contentContainer: { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: theme.contentBackground },
        searchHeaderContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: theme.headerBackground, zIndex: 100 },
        searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: theme.searchBackground, borderRadius: 28, paddingHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2, borderWidth: theme.isDark ? 1 : 0, borderColor: theme.border },
        searchIconContainer: { padding: 12 },
        searchInput: { flex: 1, fontSize: s(16), color: theme.text, outlineStyle: 'none' },
        micButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primaryBg, justifyContent: 'center', alignItems: 'center' },
        suggestionContainer: { position: 'absolute', top: 60, left: 0, right: 0, borderRadius: 16, borderWidth: 1, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10, overflow: 'hidden' },
        suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
        videoListContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
        loadingContainer: { marginTop: 40, alignItems: 'center', justifyContent: 'center' },
        loadingText: { marginTop: 12, color: theme.subText, fontSize: s(14), fontWeight: '500' },
        bottomPadding: { height: 80 }
    });
};
