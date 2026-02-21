import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDownloads } from '../context/DownloadContext';
import { useTheme as useAppTheme } from '../context/ThemeContext';

export default function VideoCard({ video, theme, onDownload, onMoreInfo, onPlay }) {
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { activeDownloads, completedDownloads } = useDownloads();
    const { t } = useAppTheme();

    const isAudioCompleted = completedDownloads.some(d => d.id === video.id && d.quality === 'audio');
    const isVideoCompleted = completedDownloads.some(d => d.id === video.id && d.quality !== 'audio');
    const activeData = activeDownloads[video.id];
    const GREEN_COLOR = '#4CAF50';

    return (
        <View style={styles.cardContainer}>
            <View style={styles.contentRow}>
                {/* Thumbnail */}
                <TouchableOpacity
                    style={styles.thumbnailContainer}
                    onPress={() => onPlay ? onPlay(video) : null}
                    activeOpacity={0.8}
                >
                    <ImageBackground source={{ uri: video.thumbnail }} style={styles.thumbnailImage} />
                    <View style={styles.playOverlay}>
                        <MaterialIcons name="play-arrow" size={32} color="white" />
                    </View>
                    <View style={[styles.durationBadge, video.isLive && { backgroundColor: theme.primary }]}>
                        <Text style={styles.durationText}>
                            {video.isLive ? 'LIVE' : video.duration}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Info and Actions */}
                <View style={styles.infoContainer}>
                    <View>
                        <Text style={styles.title} numberOfLines={2}>
                            {video.title}
                        </Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.metaText, video.isLive && styles.metaLive]} numberOfLines={1}>
                                {video.channel}
                            </Text>
                            <View style={styles.dot} />
                            <Text style={[styles.metaText, video.isLive && styles.metaLive]}>
                                {video.isLive ? 'Watching now' : video.views}
                            </Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[
                                styles.quickButton,
                                { cursor: 'pointer' },
                                isAudioCompleted && { backgroundColor: `${GREEN_COLOR}20` }
                            ]}
                            onPress={() => onDownload('audio')}
                            activeOpacity={0.7}
                            accessibilityLabel={isAudioCompleted ? `${t('downloaded')} MP3` : 'Download MP3'}
                            accessibilityRole="button"
                        >
                            <MaterialIcons name={isAudioCompleted ? "check-circle" : "music-note"} size={16} color={isAudioCompleted ? GREEN_COLOR : theme.text} />
                            <Text style={[styles.quickButtonText, isAudioCompleted && { color: GREEN_COLOR }]}>MP3</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.quickButton,
                                { cursor: 'pointer' },
                                isVideoCompleted && { backgroundColor: `${GREEN_COLOR}20` }
                            ]}
                            onPress={() => onDownload('1080p')}
                            activeOpacity={0.7}
                            accessibilityLabel={isVideoCompleted ? `${t('downloaded')} MP4` : 'Download MP4'}
                            accessibilityRole="button"
                        >
                            <MaterialIcons name={isVideoCompleted ? "check-circle" : "movie"} size={16} color={isVideoCompleted ? GREEN_COLOR : theme.text} />
                            <Text style={[styles.quickButtonText, isVideoCompleted && { color: GREEN_COLOR }]}>{video.isLive ? 'REC' : 'MP4'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.moreButton, { cursor: 'pointer' }]}
                            onPress={onMoreInfo}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="add" size={20} color={theme.iconInactive} />
                        </TouchableOpacity>
                    </View>

                    {/* Progress Bar */}
                    {activeData && (
                        <View style={styles.progressContainer} accessibilityLiveRegion="polite" accessibilityLabel={`${t('downloading')} ${activeData.progress} percent`}>
                            <View style={styles.progressHeaderRow}>
                                <Text style={styles.progressText}>{t('downloading')}</Text>
                                <Text style={styles.progressPercentage}>
                                    {activeData.progress}%
                                </Text>
                            </View>
                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: `${activeData.progress}%` }]} />
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                <Text style={styles.progressTimeLeft}>
                                    ~{activeData.timeLeft}s left
                                </Text>
                                <Text style={styles.progressSpeed} importantForAccessibility="no">
                                    {activeData.speed}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const createStyles = (theme) => {
    const s = (size) => size * (theme.fontScale || 1);

    return StyleSheet.create({
        cardContainer: {
            backgroundColor: theme.card,
            padding: 12,
            borderRadius: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: theme.isDark ? 0.3 : 0.05,
            shadowRadius: 4,
            elevation: 2,
            borderWidth: 1,
            borderColor: theme.border
        },
        contentRow: {
            flexDirection: 'row',
            gap: 12,
        },
        thumbnailContainer: {
            width: 160,
            aspectRatio: 16 / 9,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: theme.chipInactiveBg,
        },
        thumbnailImage: {
            width: '100%',
            height: '100%',
        },
        playOverlay: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(0,0,0,0.3)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        durationBadge: {
            position: 'absolute',
            bottom: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.7)',
            paddingHorizontal: 4,
            paddingVertical: 2,
            borderRadius: 4,
        },
        durationText: {
            fontSize: s(10),
            fontWeight: 'bold',
            color: 'white',
        },
        infoContainer: {
            flex: 1,
            justifyContent: 'space-between',
            paddingVertical: 2,
        },
        title: {
            fontSize: s(14),
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 4,
            lineHeight: s(18),
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            flexWrap: 'wrap',
        },
        metaText: {
            fontSize: s(12),
            color: theme.subText,
            fontWeight: '500',
        },
        metaLive: {
            color: theme.primary,
        },
        dot: {
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: theme.iconInactive,
        },
        actionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
        },
        quickButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.chipInactiveBg,
            paddingVertical: 6,
            borderRadius: 8,
            gap: 4,
        },
        quickButtonText: {
            fontSize: s(12),
            fontWeight: '600',
            color: theme.text,
        },
        moreButton: {
            width: 32,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.chipInactiveBg,
            borderRadius: 8,
        },
        progressContainer: {
            marginTop: 12,
            backgroundColor: theme.chipInactiveBg,
            padding: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border
        },
        progressHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
        },
        progressText: {
            fontSize: s(12),
            fontWeight: '600',
            color: theme.primary,
        },
        progressPercentage: {
            fontSize: s(12),
            fontWeight: 'bold',
            color: theme.text,
        },
        progressBarTrack: {
            height: 6,
            backgroundColor: theme.background,
            borderRadius: 3,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: theme.primary,
            borderRadius: 3,
        },
        progressTimeLeft: {
            fontSize: s(10),
            color: theme.subText,
        },
        progressSpeed: {
            fontSize: s(10),
            color: theme.subText,
            fontWeight: '600'
        }
    });
};
