import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useDownloads } from '../context/DownloadContext';
import LocalPlayerModal from '../components/LocalPlayerModal';
import { useToast } from '../context/ToastContext';
import api from '../services/Api';

export default function DownloadsScreen() {
    const { theme, t } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { activeDownloads, completedDownloads, downloadPath, startSimulation, clearHistory, cancelDownload, removeDownload } = useDownloads();
    const { showToast } = useToast();

    const [filter, setFilter] = useState('All'); // 'All', 'Active', 'Completed'

    // Preview modal states
    const [previewItem, setPreviewItem] = useState(null);

    const activeList = Object.values(activeDownloads).map(d => ({ ...d, isActive: true }));
    const completedList = completedDownloads.map(d => ({ ...d, isActive: false }));

    let displayedList = [];
    if (filter === 'All') displayedList = [...activeList, ...completedList];
    else if (filter === 'Active') displayedList = activeList;
    else if (filter === 'Completed') displayedList = completedList;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.headerTitle}>{t('downloadsTitle')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                style={[styles.iconBtn, { cursor: 'pointer', marginRight: 8 }]}
                                onPress={async () => {
                                    try {
                                        await api.openDirectory();
                                    } catch (e) {
                                        showToast('Failed to open directory.', 'error');
                                    }
                                }}
                            >
                                <MaterialIcons name="folder-open" size={24} color={theme.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.iconBtn, { cursor: 'pointer' }]}
                                onPress={async () => {
                                    if (completedDownloads.length === 0) return;
                                    await clearHistory();
                                    showToast('Tum gecmis temizlendi.', 'success');
                                }}
                            >
                                <MaterialIcons name="delete-outline" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ height: 40, marginTop: 16 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                            <TouchableOpacity style={[styles.filterBtn, filter === 'All' && { backgroundColor: theme.text }, { cursor: 'pointer' }]} onPress={() => setFilter('All')}>
                                <Text style={[styles.filterBtnText, filter === 'All' && { color: theme.background }]}>{t('all')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterBtn, filter === 'Active' && { backgroundColor: theme.text }, { cursor: 'pointer' }]} onPress={() => setFilter('Active')}>
                                <Text style={[styles.filterBtnText, filter === 'Active' && { color: theme.background }]}>{t('active')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterBtn, filter === 'Completed' && { backgroundColor: theme.text }, { cursor: 'pointer' }]} onPress={() => setFilter('Completed')}>
                                <Text style={[styles.filterBtnText, filter === 'Completed' && { color: theme.background }]}>{t('completed')}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>

                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {displayedList.length === 0 ? (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <MaterialIcons name="cloud-off" size={64} color={theme.iconInactive} />
                            <Text style={{ marginTop: 16, color: theme.subText, fontSize: 16 }}>{t('noDownloadsFound')}</Text>
                        </View>
                    ) : (
                        displayedList.map((item, idx) => {
                            const isAudio = item.quality === 'audio' || item.quality?.includes('mp3');
                            const video = item.video || item;

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.card, { cursor: 'pointer' }]}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        if (!item.isActive) setPreviewItem(item);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row' }}>
                                        {/* Thumbnail */}
                                        {isAudio ? (
                                            <TouchableOpacity style={[styles.thumbnailCont, { backgroundColor: theme.primaryBg, alignItems: 'center', justifyContent: 'center' }]} activeOpacity={0.8} onPress={() => !item.isActive && setPreviewItem(item)}>
                                                <MaterialIcons name="headphones" size={32} color={theme.primary} />
                                                <View style={styles.playOverlay}>
                                                    <MaterialIcons name="play-arrow" size={32} color="white" />
                                                </View>
                                                <View style={styles.durationBadge}>
                                                    <Text style={styles.durationText}>{video.duration || 'Ses'}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.thumbnailCont}
                                                activeOpacity={0.8}
                                                onPress={() => !item.isActive && setPreviewItem(item)}
                                            >
                                                <ImageBackground
                                                    source={{ uri: video.thumbnail }}
                                                    style={[styles.fullImage, item.isActive && { opacity: 0.8 }]}
                                                />
                                                <View style={styles.playOverlay}>
                                                    <MaterialIcons name="play-arrow" size={32} color="white" />
                                                </View>
                                                {item.isActive ? (
                                                    <View style={[styles.overlayCenter, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                                                        <MaterialIcons name="downloading" size={28} color="white" />
                                                    </View>
                                                ) : (
                                                    <View style={styles.durationBadge}>
                                                        <Text style={styles.durationText}>{video.duration}</Text>
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        )}

                                        {/* Info */}
                                        <View style={styles.cardInfo}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Text style={[styles.cardTitle, { flex: 1, marginRight: 8 }]} numberOfLines={2}>{video.title}</Text>
                                                {/* Tamamlanmis kaydi sil */}
                                                {!item.isActive && (
                                                    <TouchableOpacity
                                                        style={{ padding: 4, cursor: 'pointer' }}
                                                        onPress={async () => {
                                                            await removeDownload(video.id, item.quality);
                                                            showToast('Kayit silindi.', 'success');
                                                        }}
                                                        accessibilityLabel="Kaydi sil"
                                                    >
                                                        <MaterialIcons name="delete-outline" size={20} color={theme.danger || '#f44336'} />
                                                    </TouchableOpacity>
                                                )}
                                                {item.isActive && (
                                                    <MaterialIcons name="more-vert" size={20} color={theme.iconInactive} />
                                                )}
                                            </View>

                                            {item.isActive ? (
                                                <View style={{ marginTop: 4 }}>
                                                    <Text style={styles.cardSubText}>{t('downloading')} {item.progress}%</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
                                                        <View style={styles.progressBarBg}>
                                                            <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
                                                        </View>
                                                        <TouchableOpacity onPress={() => cancelDownload(video.id)} style={{ cursor: 'pointer' }} activeOpacity={0.7} accessibilityLabel="Cancel download">
                                                            <MaterialIcons name="close" size={24} color={theme.danger} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                        <Text style={styles.cardSubText}>~{item.timeLeft}s {t('left')}</Text>
                                                        <Text style={[styles.cardSubText, { fontWeight: '600' }]} importantForAccessibility="no">{item.speed}</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                                    <View style={[styles.qualityTag, isAudio ? { backgroundColor: theme.primaryBg } : { backgroundColor: 'rgba(33, 150, 243, 0.15)' }]}>
                                                        <Text style={[styles.qualityTagText, isAudio ? { color: theme.primary } : { color: '#2196F3' }]}>
                                                            {isAudio ? 'Ses' : item.quality}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.cardSubText}>{item.downloadedAt ? new Date(item.downloadedAt).toLocaleString() : t('completed')}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>

            {/* Video Player Overlay */}
            <LocalPlayerModal
                visible={!!previewItem}
                item={previewItem}
                theme={theme}
                t={t}
                onClose={() => setPreviewItem(null)}
            />

        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    contentContainer: { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: theme.contentBackground },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: theme.headerBackground, borderBottomWidth: 1, borderBottomColor: theme.border },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    filterBtn: { height: 36, paddingHorizontal: 20, borderRadius: 18, backgroundColor: theme.chipInactiveBg, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    filterBtnText: { fontSize: 14, fontWeight: '600', color: theme.subText },
    listContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    card: { backgroundColor: theme.card, borderRadius: 24, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: theme.border },
    thumbnailCont: { width: 120, height: 76, borderRadius: 12, backgroundColor: theme.chipInactiveBg, overflow: 'hidden' }, // Using chipInactiveBg for placeholder background
    fullImage: { width: '100%', height: '100%' },
    playOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    overlayCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    durationBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    durationText: { color: 'white', fontSize: 10, fontWeight: '500' },
    cardInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '600', color: theme.text, lineHeight: 20 },
    cardSubText: { fontSize: 12, color: theme.subText },
    progressBarBg: { flex: 1, height: 6, backgroundColor: theme.border, borderRadius: 3, marginRight: 16, overflow: 'hidden' },
    progressBarFill: { width: '40%', height: '100%', backgroundColor: theme.primary, borderRadius: 3 },
    qualityTag: { backgroundColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    qualityTagText: { fontSize: 10, fontWeight: '600', color: theme.subText },
});
