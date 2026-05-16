import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Modal,
    Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/Api';
import { formatDuration } from '../utils/formatters';
import { useDownloads } from '../context/DownloadContext';
import { useToast } from '../context/ToastContext';
import VideoPreviewModal from './VideoPreviewModal';
import { useTheme } from '../context/ThemeContext';

const QUALITY_OPTIONS = [
    { label: 'MP3',   value: 'audio' },
    { label: 'M4A',   value: 'audio_m4a' },
    { label: '480p',  value: '480p' },
    { label: '720p',  value: '720p' },
    { label: '1080p', value: '1080p' },
];

// Sadece 11 karakterli geçerli YouTube video ID'leri kabul edilir
const VALID_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function estimateSizeMB(durationSec, quality) {
    if (!durationSec) return null;
    const kbps = (quality === 'audio' || quality === 'audio_m4a') ? 192
        : quality === '480p' ? 500
        : quality === '720p' ? 1500
        : 4000;
    return ((durationSec * kbps) / 8 / 1024).toFixed(1);
}

/** Klasör adı olarak kullanılamayacak karakterleri kaldır */
function sanitizeFolderName(name) {
    return (name || 'Playlist').replace(/[<>:"/\\|?*\0]/g, '_').trim().slice(0, 60);
}

export default function PlaylistModal({ visible, playlistId, playlistMeta, onClose, theme }) {
    const { startSimulation, downloadPath, completedDownloads } = useDownloads();
    const { showToast } = useToast();
    const { t } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const PAGE_SIZE = 100;
    const [page, setPage]         = useState(0);
    const [playlistData, setPlaylistData] = useState(null);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState(null);
    const [globalQuality, setGlobalQuality]   = useState('720p');
    const [videoQualities, setVideoQualities] = useState({});
    const [selectedIds, setSelectedIds]       = useState(new Set());
    const [downloading, setDownloading]       = useState(false);

    // Video önizleme
    const [previewVideo, setPreviewVideo] = useState(null);

    // Modal kapanınca sayfa sıfırla
    useEffect(() => { if (!visible) setPage(0); }, [visible]);

    useEffect(() => {
        if (!visible || !playlistId) return;
        setLoading(true);
        setError(null);
        setPlaylistData(null);
        setVideoQualities({});
        setPreviewVideo(null);

        api.getPlaylistDetails(playlistId, PAGE_SIZE, page * PAGE_SIZE)
            .then(data => {
                setPlaylistData(data);
                // Yalnızca geçerli ID'li videoları başlangıçta seç
                const validIds = new Set(
                    (data.videos || []).filter(v => v.id && VALID_ID_RE.test(v.id)).map(v => v.id)
                );
                setSelectedIds(validIds);
            })
            .catch(() => setError('Playlist yüklenemedi. Bağlantını kontrol et.'))
            .finally(() => setLoading(false));
    }, [visible, playlistId, page]);

    const getEffectiveQuality = useCallback(
        (id) => videoQualities[id] || globalQuality,
        [videoQualities, globalQuality]
    );

    /* Global kalite değişince → tüm override'ları temizle */
    const handleGlobalQualityChange = (q) => {
        setGlobalQuality(q);
        setVideoQualities({}); // override'lar sıfırlanır; tekrar tek tek değiştirilebilir
    };

    const totalMB = useMemo(() => {
        if (!playlistData) return 0;
        let total = 0;
        selectedIds.forEach(id => {
            const v = (playlistData.videos || []).find(x => x.id === id);
            if (!v?.duration) return;
            const q = getEffectiveQuality(id);
            const kbps = (q === 'audio' || q === 'audio_m4a') ? 192
                : q === '480p' ? 500 : q === '720p' ? 1500 : 4000;
            total += (v.duration * kbps) / 8 / 1024;
        });
        return total.toFixed(0);
    }, [selectedIds, videoQualities, globalQuality, playlistData, getEffectiveQuality]);

    const toggleSelect = (id) => {
        if (!VALID_ID_RE.test(id)) return; // geçersiz ID seçilemesin
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const setVideoQuality = (id, q) =>
        setVideoQualities(prev => ({ ...prev, [id]: q }));

    const handleDownload = async () => {
        if (!playlistData || selectedIds.size === 0) return;
        setDownloading(true);

        // Playlist alt klasörü: {indirme yolu}/{playlist adı}/
        const playlistFolder = (downloadPath && playlistData.title)
            ? `${downloadPath}/${sanitizeFolderName(playlistData.title)}`
            : downloadPath;

        // Geçerli ID filtresi
        const toDownload = (playlistData.videos || []).filter(
            v => selectedIds.has(v.id) && v.id && VALID_ID_RE.test(v.id)
        );
        const skipped = selectedIds.size - toDownload.length;

        let ok = 0;
        for (const video of toDownload) {
            const quality = getEffectiveQuality(video.id);
            try {
                await api.downloadVideo(video.id, quality, playlistFolder);
                startSimulation(video, quality, {
                    playlist_id:    playlistData.playlist_id || playlistId,
                    playlist_title: playlistData.title,
                });
                ok++;
            } catch {
                showToast(`"${(video.title || '').slice(0, 30)}…" başlatılamadı`, 'error');
            }
        }
        setDownloading(false);
        if (skipped > 0) showToast(`${skipped} video geçersiz ID nedeniyle atlandı`, 'warning');
        if (ok > 0) {
            showToast(`${ok} video indirme kuyruğuna eklendi`, 'success');
            onClose();
        }
    };

    /* ── Render ─────────────────────────────────────────── */
    return (
        <>
            <Modal
                visible={visible && !previewVideo}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                {/* Karartma alanı — tıklayınca kapat */}
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                    <View style={styles.sheet}>
                        {/* Handle çubuğu */}
                        <View style={styles.handleWrap}><View style={styles.handle} /></View>

                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.backBtn} accessibilityLabel="Kapat">
                                <MaterialIcons name="close" size={22} color={theme.iconInactive} />
                            </TouchableOpacity>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.headerTitle} numberOfLines={1}>
                                    {playlistData?.title || playlistMeta?.title || 'Playlist'}
                                </Text>
                                <Text style={styles.headerSub} numberOfLines={1}>
                                    {playlistData?.channel || ''}
                                    {playlistData?.video_count ? `  •  ${playlistData.video_count} video` : ''}
                                </Text>
                            </View>
                        </View>

                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color={theme.primary} />
                                <Text style={styles.centerText}>Playlist yükleniyor…</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.center}>
                                <MaterialIcons name="error-outline" size={48} color="#f44336" />
                                <Text style={styles.centerText}>{error}</Text>
                            </View>
                        ) : playlistData ? (
                            <>
                                {/* Global kalite — değişince override'lar sıfırlanır */}
                                <View style={styles.globalBar}>
                                    <Text style={styles.globalLabel}>Tüm videolar:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                                        {QUALITY_OPTIONS.map(opt => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                style={[styles.qChip, globalQuality === opt.value && !Object.keys(videoQualities).length && styles.qChipActive,
                                                        globalQuality === opt.value && styles.qChipActive]}
                                                onPress={() => handleGlobalQualityChange(opt.value)}
                                            >
                                                <Text style={[styles.qChipText, globalQuality === opt.value && styles.qChipTextActive]}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Seçim araçları */}
                                <View style={styles.selBar}>
                                    <TouchableOpacity style={styles.selBtn}
                                        onPress={() => setSelectedIds(new Set(
                                            (playlistData.videos || []).filter(v => v.id && VALID_ID_RE.test(v.id)).map(v => v.id)
                                        ))}>
                                        <Text style={styles.selBtnText}>Tümünü Seç</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.selBtn} onPress={() => setSelectedIds(new Set())}>
                                        <Text style={styles.selBtnText}>Kaldır</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.selCount}>
                                        {selectedIds.size} / {(playlistData.videos || []).length} seçili
                                        {playlistData.video_count > PAGE_SIZE ? ` (sayfa ${page + 1})` : ''}
                                    </Text>
                                </View>

                                {/* Sayfalama — yalnızca 100+ video varsa görünür */}
                                {(playlistData.video_count > PAGE_SIZE || page > 0) && (
                                    <View style={styles.pageBar}>
                                        <TouchableOpacity
                                            style={[styles.pageBtn, page === 0 && { opacity: 0.3 }]}
                                            onPress={() => page > 0 && setPage(p => p - 1)}
                                            disabled={page === 0}
                                        >
                                            <MaterialIcons name="navigate-before" size={18} color={theme.text} />
                                            <Text style={styles.pageBtnText}>Önceki</Text>
                                        </TouchableOpacity>

                                        <Text style={styles.pageInfo}>
                                            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, playlistData.video_count || 9999)}
                                            {playlistData.video_count ? ` / ${playlistData.video_count}` : ''}
                                        </Text>

                                        <TouchableOpacity
                                            style={[
                                                styles.pageBtn,
                                                (playlistData.videos || []).length < PAGE_SIZE && { opacity: 0.3 }
                                            ]}
                                            onPress={() => (playlistData.videos || []).length >= PAGE_SIZE && setPage(p => p + 1)}
                                            disabled={(playlistData.videos || []).length < PAGE_SIZE}
                                        >
                                            <Text style={styles.pageBtnText}>Sonraki</Text>
                                            <MaterialIcons name="navigate-next" size={18} color={theme.text} />
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Video listesi */}
                                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                                    {(playlistData.videos || []).map((video) => {
                                        const isValid    = video.id && VALID_ID_RE.test(video.id);
                                        const isSelected = isValid && selectedIds.has(video.id);
                                        const effectiveQ = getEffectiveQuality(video.id);
                                        const hasOverride = !!videoQualities[video.id];
                                        const sizeMB     = estimateSizeMB(video.duration, effectiveQ);

                                        return (
                                            <View key={video.id || Math.random()} style={[styles.videoRow, !isSelected && { opacity: isValid ? 0.38 : 0.2 }]}>
                                                {/* Üst satır: checkbox + thumbnail + başlık */}
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    {/* Checkbox */}
                                                    <TouchableOpacity
                                                        style={styles.checkbox}
                                                        onPress={() => isValid && toggleSelect(video.id)}
                                                        disabled={!isValid}
                                                    >
                                                        <MaterialIcons
                                                            name={isSelected ? 'check-box' : (isValid ? 'check-box-outline-blank' : 'block')}
                                                            size={22}
                                                            color={isSelected ? theme.primary : theme.iconInactive}
                                                        />
                                                    </TouchableOpacity>

                                                    {/* Thumbnail */}
                                                    <TouchableOpacity
                                                        style={styles.thumb}
                                                        onPress={() => isValid && setPreviewVideo(video)}
                                                        activeOpacity={0.8}
                                                    >
                                                        <Image
                                                            source={{ uri: video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` }}
                                                            style={styles.thumbImg}
                                                        />
                                                        <View style={styles.thumbPlay}>
                                                            <MaterialIcons name="play-circle-outline" size={22} color="rgba(255,255,255,0.9)" />
                                                        </View>
                                                        {!!video.duration && (
                                                            <View style={styles.durBadge}>
                                                                <Text style={styles.durText}>{formatDuration(video.duration)}</Text>
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>

                                                    {/* Başlık + boyut */}
                                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                                        <Text style={styles.videoTitle} numberOfLines={2}>{video.title || '(Bilinmeyen video)'}</Text>
                                                        {sizeMB && <Text style={styles.videoSize}>~{sizeMB} MB</Text>}
                                                        {!isValid && <Text style={{ fontSize: 10, color: '#f44336' }}>Geçersiz</Text>}
                                                    </View>
                                                </View>

                                                {/* Alt satır: kalite chip'leri (tam genişlik, taşmaz) */}
                                                <ScrollView
                                                    horizontal showsHorizontalScrollIndicator={false}
                                                    style={{ marginTop: 6, marginLeft: 30 }}
                                                    contentContainerStyle={{ paddingRight: 10 }}
                                                >
                                                    {QUALITY_OPTIONS.map(opt => {
                                                        const isActive = effectiveQ === opt.value;
                                                        const isOver   = hasOverride && isActive;
                                                        const prevDownload = completedDownloads.find(d => (d.video?.id || d.id) === video.id && d.quality === opt.value);
                                                        const isDownloaded = !!prevDownload;

                                                        return (
                                                            <TouchableOpacity
                                                                key={opt.value}
                                                                style={[
                                                                    styles.miniChip,
                                                                    isActive && (isOver ? styles.miniChipOverride : styles.miniChipActive),
                                                                    isDownloaded && !isActive && styles.miniChipDownloaded
                                                                ]}
                                                                onPress={() => isValid && setVideoQuality(video.id, opt.value)}
                                                                disabled={!isValid}
                                                            >
                                                                <Text style={[
                                                                    styles.miniChipText,
                                                                    isActive && styles.miniChipTextActive,
                                                                    isDownloaded && !isActive && styles.miniChipTextDownloaded
                                                                ]}>
                                                                    {opt.label} {isDownloaded ? '✓' : ''}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </ScrollView>
                                            </View>
                                        );
                                    })}
                                    <View style={{ height: 20 }} />
                                </ScrollView>

                                {/* Footer */}
                                <View style={styles.footer}>
                                    <View>
                                        <Text style={styles.footerTotal}>Toplam: ~{totalMB} MB</Text>
                                        <Text style={styles.footerSub}>{selectedIds.size} video seçili</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.dlBtn, (downloading || selectedIds.size === 0) && { opacity: 0.5 }]}
                                        onPress={handleDownload}
                                        disabled={downloading || selectedIds.size === 0}
                                    >
                                        {downloading
                                            ? <ActivityIndicator size="small" color="#fff" />
                                            : (
                                                <>
                                                    <MaterialIcons name="download" size={20} color="#fff" style={{ marginRight: 6 }} />
                                                    <Text style={styles.dlBtnText}>{selectedIds.size} İndir</Text>
                                                </>
                                            )
                                        }
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </Modal>

            {/* Video önizleme modalı — PlaylistModal'ın önünde açılır */}
            {previewVideo && (
                <VideoPreviewModal
                    visible={!!previewVideo}
                    video={previewVideo}
                    theme={theme}
                    t={t}
                    completedDownloads={completedDownloads || []}
                    onClose={() => setPreviewVideo(null)}
                    onDownload={(quality) => {
                        // Önizlemeden kalite seçilirse, o video için override yap
                        if (previewVideo?.id) setVideoQuality(previewVideo.id, quality);
                        setPreviewVideo(null);
                    }}
                    onMoreInfo={() => setPreviewVideo(null)}
                />
            )}
        </>
    );
}

const createStyles = (theme) => StyleSheet.create({
    /* Overlay & Sheet */
    overlay: {
        flex: 1,
        backgroundColor: theme.isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    backdrop: { flex: 1, width: '100%' },
    sheet: {
        backgroundColor: theme.contentBackground,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '92%',
        width: '100%',
        maxWidth: 700,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 24,
        overflow: 'hidden',
    },
    handleWrap:  { width: '100%', alignItems: 'center', paddingVertical: 10 },
    handle:      { width: 44, height: 5, backgroundColor: theme.border, borderRadius: 3 },

    /* Header */
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    backBtn:     { padding: 6 },
    headerTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    headerSub:   { fontSize: 11, color: theme.subText, marginTop: 2 },

    /* Center (loading/error) */
    center:     { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
    centerText: { color: theme.subText, marginTop: 12, fontSize: 14 },

    /* Global quality bar */
    globalBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
    globalLabel:    { fontSize: 12, color: theme.subText, marginRight: 10, flexShrink: 0 },
    qChip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: theme.chipInactiveBg, marginRight: 8 },
    qChipActive:    { backgroundColor: theme.primary },
    qChipText:      { fontSize: 12, fontWeight: '600', color: theme.subText },
    qChipTextActive:{ color: '#fff' },

    /* Selection bar */
    selBar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
    selBtn:     { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.chipInactiveBg, marginRight: 8 },
    selBtnText: { fontSize: 12, color: theme.text, fontWeight: '600' },
    selCount:   { flex: 1, textAlign: 'right', fontSize: 12, color: theme.subText },

    /* Video row — column layout */
    videoRow:   { flexDirection: 'column', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
    checkbox:   { marginRight: 6, padding: 4 },
    thumb:      { width: 80, height: 52, borderRadius: 6, overflow: 'hidden', backgroundColor: theme.chipInactiveBg, position: 'relative' },
    thumbImg:   { width: '100%', height: '100%' },
    thumbPlay:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
    durBadge:   { position: 'absolute', bottom: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 3, paddingVertical: 1, borderRadius: 3 },
    durText:    { color: '#fff', fontSize: 9, fontWeight: '500' },
    videoTitle: { fontSize: 13, fontWeight: '600', color: theme.text, lineHeight: 18 },
    videoSize:  { fontSize: 11, color: theme.subText, marginTop: 2 },

    /* Mini quality chips (per-video override) */
    miniChip:           { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, backgroundColor: theme.chipInactiveBg, marginRight: 6 },
    miniChipActive:     { backgroundColor: theme.iconInactive },
    miniChipOverride:   { backgroundColor: theme.primary },
    miniChipText:       { fontSize: 9, fontWeight: '600', color: theme.subText },
    miniChipTextActive: { color: theme.text },
    miniChipDownloaded: { borderWidth: 1, borderColor: theme.success || '#4CAF50', backgroundColor: 'transparent' },
    miniChipTextDownloaded: { color: theme.success || '#4CAF50' },

    /* Sayfalama */
    pageBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
    pageBtn:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, backgroundColor: theme.chipInactiveBg, cursor: 'pointer' },
    pageBtnText:  { fontSize: 12, fontWeight: '600', color: theme.text },
    pageInfo:     { fontSize: 12, color: theme.subText, fontWeight: '500' },

    /* Footer */
    footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 28, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
    footerTotal: { fontSize: 15, fontWeight: '700', color: theme.text },
    footerSub:   { fontSize: 12, color: theme.subText, marginTop: 2 },
    dlBtn:       { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
    dlBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
});
