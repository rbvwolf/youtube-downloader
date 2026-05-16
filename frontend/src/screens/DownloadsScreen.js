import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, StyleSheet, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDownloads } from '../context/DownloadContext';
import LocalPlayerModal from '../components/LocalPlayerModal';
import { useToast } from '../context/ToastContext';
import { formatDuration } from '../utils/formatters';
import api from '../services/Api';

/** Süreyi gösterir: sayı ise formatlar, string ise oldugu gibi gösterir */
const displayDuration = (dur) => {
    if (!dur) return '';
    return typeof dur === 'number' ? formatDuration(dur) : dur;
};

function DownloadCard({ item, theme, styles, onPress, onDelete, onCancel, compact = false }) {
    const isAudio = item.quality === 'audio' || item.quality === 'audio_m4a' || item.quality?.includes('mp3');
    const video   = item.video || item;
    return (
        <TouchableOpacity style={[styles.card, compact && { marginBottom: 8 }, { cursor: 'pointer' }]} activeOpacity={0.9}
            onPress={() => { if (!item.isActive) onPress?.(); }}>
            <View style={{ flexDirection: 'row' }}>
                {isAudio ? (
                    <TouchableOpacity style={[styles.thumbnailCont, { backgroundColor: theme.primaryBg, alignItems: 'center', justifyContent: 'center' }]}
                        activeOpacity={0.8} onPress={() => !item.isActive && onPress?.()}>
                        <MaterialIcons name="headphones" size={32} color={theme.primary} />
                        <View style={styles.playOverlay}><MaterialIcons name="play-arrow" size={32} color="white" /></View>
                        <View style={styles.durationBadge}><Text style={styles.durationText}>{displayDuration(video.duration) || 'Ses'}</Text></View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.thumbnailCont} activeOpacity={0.8} onPress={() => !item.isActive && onPress?.()}>
                        <ImageBackground source={{ uri: video.thumbnail }} style={[styles.fullImage, item.isActive && { opacity: 0.8 }]} />
                        <View style={styles.playOverlay}><MaterialIcons name="play-arrow" size={32} color="white" /></View>
                        {item.isActive
                            ? <View style={[styles.overlayCenter, { backgroundColor: 'rgba(0,0,0,0.3)' }]}><MaterialIcons name="downloading" size={28} color="white" /></View>
                            : <View style={styles.durationBadge}><Text style={styles.durationText}>{displayDuration(video.duration)}</Text></View>}
                    </TouchableOpacity>
                )}
                <View style={styles.cardInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={[styles.cardTitle, { flex: 1, marginRight: 8 }]} numberOfLines={2}>{video.title}</Text>
                        {!item.isActive && (
                            <TouchableOpacity style={{ padding: 4, cursor: 'pointer' }} onPress={onDelete}>
                                <MaterialIcons name="delete-outline" size={20} color={theme.danger || '#f44336'} />
                            </TouchableOpacity>
                        )}
                        {item.isActive && <MaterialIcons name="more-vert" size={20} color={theme.iconInactive} />}
                    </View>
                    {item.isActive ? (
                        <View style={{ marginTop: 4 }}>
                            <Text style={styles.cardSubText}>İndiriliyor %{item.progress}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
                                <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${item.progress}%` }]} /></View>
                                <TouchableOpacity onPress={onCancel} style={{ cursor: 'pointer' }} activeOpacity={0.7}>
                                    <MaterialIcons name="close" size={24} color={theme.danger} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={styles.cardSubText}>~{item.timeLeft}s kaldı</Text>
                                <Text style={[styles.cardSubText, { fontWeight: '600' }]}>{item.speed}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                            <View style={[styles.qualityTag, isAudio ? { backgroundColor: theme.primaryBg } : { backgroundColor: 'rgba(33,150,243,0.15)' }]}>
                                <Text style={[styles.qualityTagText, isAudio ? { color: theme.primary } : { color: '#2196F3' }]}>
                                    {isAudio ? 'Ses' : item.quality}
                                </Text>
                            </View>
                            <Text style={styles.cardSubText}>{item.downloadedAt ? new Date(item.downloadedAt).toLocaleString() : 'Tamamlandı'}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function DownloadsScreen() {
    const { theme, t } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { activeDownloads, completedDownloads, downloadPath, clearHistory, cancelDownload, removeDownload } = useDownloads();
    const { showToast } = useToast();

    const [filter, setFilter] = useState('All');
    const [previewItem, setPreviewItem] = useState(null);
    const [expandedPlaylists, setExpandedPlaylists] = useState(new Set());

    const activeList    = Object.values(activeDownloads).map(d => ({ ...d, isActive: true }));
    const completedList = completedDownloads.map(d => ({ ...d, isActive: false }));

    /* Tüm öğeleri tek liste olarak kronolojik sırala (en yeni üstte) */
    const unifiedList = useMemo(() => {
        const groupMap = {};
        const soloItems = [];

        [...activeList, ...completedList].forEach(item => {
            const pid = item.playlist_id;
            const ts  = item.startedAt
                || (item.downloadedAt ? new Date(item.downloadedAt).getTime() : 0);

            if (pid) {
                if (!groupMap[pid]) {
                    groupMap[pid] = {
                        type: 'group',
                        playlist_id:    pid,
                        playlist_title: item.playlist_title || 'Playlist',
                        items:      [],
                        ts:         0,
                        activeCount: 0,
                    };
                }
                groupMap[pid].items.push(item);
                if (item.isActive) groupMap[pid].activeCount++;
                if (ts > groupMap[pid].ts) groupMap[pid].ts = ts;
            } else {
                soloItems.push({ type: 'solo', item, ts });
            }
        });

        const groups = Object.values(groupMap).map(g => ({ ...g }));
        const all = [...soloItems, ...groups];
        all.sort((a, b) => b.ts - a.ts);
        return all;
    }, [activeDownloads, completedDownloads]);

    /* Filtre */
    const filteredList = useMemo(() => {
        return unifiedList.filter(entry => {
            if (entry.type === 'solo') {
                const isActive = entry.item.isActive;
                return (filter === 'All') || (filter === 'Active' && isActive) || (filter === 'Completed' && !isActive);
            } else {
                const hasActive    = entry.activeCount > 0;
                const hasCompleted = entry.items.some(i => !i.isActive);
                return (filter === 'All')
                    || (filter === 'Active' && hasActive)
                    || (filter === 'Completed' && hasCompleted);
            }
        }).map(entry => {
            if (entry.type === 'group') {
                const filteredItems = entry.items.filter(i =>
                    (filter === 'All') || (filter === 'Active' && i.isActive) || (filter === 'Completed' && !i.isActive)
                );
                return { ...entry, items: filteredItems };
            }
            return entry;
        });
    }, [unifiedList, filter]);

    const isEmpty = filteredList.length === 0;

    const togglePlaylist = (id) => {
        setExpandedPlaylists(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const confirmDeleteGroup = (group) => {
        const completedItems = group.items.filter(i => !i.isActive);
        const activeItems    = group.items.filter(i =>  i.isActive);
        const msg = `"${group.playlist_title}" playlistındaki ${group.items.length} video silinecek (dosyalar da disk'ten kaldırılacak). Emin misin?`;

        const doDelete = async () => {
            // Önce aktif indirmeleri iptal et
            activeItems.forEach(i => cancelDownload((i.video || i).id));
            // Sonra tamamlananları disk+DB'den sil
            for (const item of completedItems) {
                const v = item.video || item;
                await removeDownload(v.id, item.quality);
            }
            showToast(`Playlist silindi.`, 'success');
        };

        if (Platform.OS === 'web') {
            if (window.confirm(msg)) doDelete();
        } else {
            Alert.alert('Playlistı Sil', msg, [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: doDelete },
            ]);
        }
    };

    const confirmClearHistory = () => {
        if (completedDownloads.length === 0) return;
        const doIt = async () => { await clearHistory(); showToast('Tüm geçmiş temizlendi.', 'success'); };
        if (Platform.OS === 'web') {
            if (window.confirm('Tüm geçmişi silmek istediğinize emin misiniz?')) doIt();
        } else {
            Alert.alert('Geçmişi Temizle', 'Tüm geçmişi silmek istediğinize emin misiniz?', [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: doIt },
            ]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.headerTitle}>{t('downloadsTitle')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity style={[styles.iconBtn, { cursor: 'pointer', marginRight: 8 }]}
                                onPress={async () => { try { await api.openDirectory(downloadPath); } catch { showToast('Klasör açılamadı.', 'error'); } }}>
                                <MaterialIcons name="folder-open" size={24} color={theme.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconBtn, { cursor: 'pointer' }]} onPress={confirmClearHistory}>
                                <MaterialIcons name="delete-outline" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ height: 40, marginTop: 16 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                            {['All', 'Active', 'Completed'].map(f => (
                                <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && { backgroundColor: theme.text }, { cursor: 'pointer' }]} onPress={() => setFilter(f)}>
                                    <Text style={[styles.filterBtnText, filter === f && { color: theme.background }]}>
                                        {f === 'All' ? t('all') : f === 'Active' ? t('active') : t('completed')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>

                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {isEmpty ? (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <MaterialIcons name="cloud-off" size={64} color={theme.iconInactive} />
                            <Text style={{ marginTop: 16, color: theme.subText, fontSize: 16 }}>{t('noDownloadsFound')}</Text>
                        </View>
                    ) : filteredList.map((entry, idx) => {
                        if (entry.type === 'solo') {
                            const item = entry.item;
                            return (
                                <DownloadCard
                                    key={`solo-${idx}`}
                                    item={item}
                                    theme={theme}
                                    styles={styles}
                                    onPress={() => setPreviewItem(item)}
                                    onDelete={async () => { await removeDownload((item.video || item).id, item.quality); showToast('Kayıt silindi.', 'success'); }}
                                    onCancel={() => cancelDownload((item.video || item).id)}
                                />
                            );
                        }
                        // Playlist group
                        const isOpen = expandedPlaylists.has(entry.playlist_id);
                        return (
                            <View key={`group-${entry.playlist_id}`} style={styles.playlistGroup}>
                                <View style={[styles.playlistGroupHeader, { flexDirection: 'row', alignItems: 'center' }]}>
                                    <TouchableOpacity
                                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                                        onPress={() => togglePlaylist(entry.playlist_id)}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialIcons name="playlist-play" size={24} color={theme.primary} />
                                        <Text style={styles.playlistGroupTitle} numberOfLines={1}>{entry.playlist_title}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            {entry.activeCount > 0 && (
                                                <View style={{ backgroundColor: theme.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
                                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{entry.activeCount} aktif</Text>
                                                </View>
                                            )}
                                            <Text style={styles.playlistGroupCount}>{entry.items.length} video</Text>
                                        </View>
                                        <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={24} color={theme.iconInactive} />
                                    </TouchableOpacity>
                                    {/* Playlist silme butonu */}
                                    <TouchableOpacity
                                        style={{ padding: 6, marginLeft: 4, cursor: 'pointer' }}
                                        onPress={() => confirmDeleteGroup(entry)}
                                    >
                                        <MaterialIcons name="delete-outline" size={20} color={theme.danger || '#f44336'} />
                                    </TouchableOpacity>
                                </View>
                                {isOpen && (
                                    <View style={styles.playlistGroupContent}>
                                        {entry.items.map((item, i) => (
                                            <DownloadCard
                                                key={`pl-${entry.playlist_id}-${i}`}
                                                item={item}
                                                theme={theme}
                                                styles={styles}
                                                compact
                                                onPress={() => setPreviewItem(item)}
                                                onDelete={async () => { await removeDownload((item.video || item).id, item.quality); showToast('Kayıt silindi.', 'success'); }}
                                                onCancel={() => cancelDownload((item.video || item).id)}
                                            />
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

            <LocalPlayerModal visible={!!previewItem} item={previewItem} theme={theme} t={t} onClose={() => setPreviewItem(null)} />
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container:           { flex: 1, backgroundColor: theme.background },
    contentContainer:    { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: theme.contentBackground },
    header:              { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: theme.headerBackground, borderBottomWidth: 1, borderBottomColor: theme.border },
    rowBetween:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle:         { fontSize: 24, fontWeight: 'bold', color: theme.text },
    iconBtn:             { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    filterBtn:           { height: 36, paddingHorizontal: 20, borderRadius: 18, backgroundColor: theme.chipInactiveBg, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    filterBtnText:       { fontSize: 14, fontWeight: '600', color: theme.subText },
    listContainer:       { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    card:                { backgroundColor: theme.card, borderRadius: 24, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: theme.border },
    thumbnailCont:       { width: 120, height: 76, borderRadius: 12, backgroundColor: theme.chipInactiveBg, overflow: 'hidden' },
    fullImage:           { width: '100%', height: '100%' },
    playOverlay:         { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    overlayCenter:       { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    durationBadge:       { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    durationText:        { color: 'white', fontSize: 10, fontWeight: '500' },
    cardInfo:            { flex: 1, marginLeft: 12, justifyContent: 'center' },
    cardTitle:           { fontSize: 14, fontWeight: '600', color: theme.text, lineHeight: 20 },
    cardSubText:         { fontSize: 12, color: theme.subText },
    progressBarBg:       { flex: 1, height: 6, backgroundColor: theme.border, borderRadius: 3, marginRight: 16, overflow: 'hidden' },
    progressBarFill:     { height: '100%', backgroundColor: theme.primary, borderRadius: 3 },
    qualityTag:          { backgroundColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    qualityTagText:      { fontSize: 10, fontWeight: '600', color: theme.subText },
    playlistGroup:       { marginBottom: 12 },
    playlistGroupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, cursor: 'pointer' },
    playlistGroupTitle:  { flex: 1, fontSize: 15, fontWeight: '700', color: theme.text },
    playlistGroupCount:  { fontSize: 12, color: theme.subText },
    playlistGroupContent:{ marginTop: 6, paddingLeft: 8 },
});
