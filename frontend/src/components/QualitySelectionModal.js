import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, ImageBackground, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/Api';

export default function QualitySelectionModal({
    visible,
    onClose,
    video, // Should contain { id, title, channel, duration, thumbnail }
    formats, // array of { quality, label }
    isFetching,
    theme,
    onDownload
}) {
    const { t } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [selectedQuality, setSelectedQuality] = useState(null);
    const [realSizes, setRealSizes] = useState({});
    const [fetchingSizes, setFetchingSizes] = useState(false);

    useEffect(() => {
        let active = true;
        if (visible && video?.id) {
            setFetchingSizes(true);
            api.getVideoSizes(video.id)
                .then(data => {
                    if (!active) return;
                    const sizes = {};
                    let audioSizeMb = 0;

                    if (data && data.formats) {
                        data.formats.forEach(f => {
                            if (f.vcodec === 'none' && f.acodec !== 'none') {
                                if (f.filesize_mb > audioSizeMb) audioSizeMb = f.filesize_mb;
                            }
                        });
                        sizes['audio'] = audioSizeMb > 0 ? `${audioSizeMb.toFixed(1)} MB` : '-- MB';

                        const getVidSize = (height) => {
                            let maxVid = 0;
                            data.formats.forEach(f => {
                                if (f.vcodec !== 'none' && f.resolution && f.resolution.includes(height.toString())) {
                                    if (f.filesize_mb > maxVid) maxVid = f.filesize_mb;
                                }
                            });
                            return maxVid > 0 ? `${(maxVid + audioSizeMb).toFixed(1)} MB` : '-- MB';
                        };

                        sizes['1080p'] = getVidSize(1080);
                        sizes['720p'] = getVidSize(720);
                        sizes['480p'] = getVidSize(480);
                    }
                    setRealSizes(sizes);
                })
                .catch(err => console.error("Sizes Error", err))
                .finally(() => { if (active) setFetchingSizes(false); });
        }
        return () => { active = false; };
    }, [visible, video]);

    // Filter out formats if needed, or map them to the UI
    // Assuming backend returns: [{ quality: "1080p", label: "Full HD (1080p)" }, ...]

    const handleDownload = () => {
        if (selectedQuality) {
            onDownload(selectedQuality);
            onClose();
        }
    };

    const getFormatUI = (format) => {
        const sizeVal = realSizes[format.quality] || format.size || '-- MB';
        const q = format.quality.toLowerCase();
        if (q === 'audio_m4a') return { icon: 'headphones', badge: 'M4A', desc: 'M4A Audio (iTunes)', size: sizeVal };
        if (q === 'audio_webm') return { icon: 'headphones', badge: 'WEBM', desc: 'WebM Audio', size: sizeVal };
        if (q === 'audio' || q.includes('mp3')) return { icon: 'headphones', badge: 'MP3', desc: t('audioOnly'), size: sizeVal };
        if (q.includes('1080')) return { icon: 'hd', badge: 'Full HD', desc: t('bestQuality'), size: sizeVal };
        if (q.includes('720')) return { icon: 'hd', badge: 'HD', desc: t('goodForPhones'), size: sizeVal };
        if (q.includes('480')) return { icon: 'sd', badge: 'STD', desc: t('dataSaver'), size: sizeVal };
        return { icon: 'videocam', badge: 'MP4', desc: t('standard'), size: sizeVal };
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.touchableDismiss} activeOpacity={1} onPress={onClose} />

                <View style={styles.modalContent}>
                    {/* Handle */}
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    {/* Media Header */}
                    {video && (
                        <View style={styles.mediaHeader}>
                            <ImageBackground source={{ uri: video.thumbnail }} style={styles.thumbnail}>
                                <View style={styles.thumbnailOverlay}>
                                    <MaterialIcons name="play-circle-outline" size={24} color="#ffffff" style={{ opacity: 0.9 }} />
                                </View>
                            </ImageBackground>

                            <View style={styles.mediaInfo}>
                                <Text style={styles.mediaTitle} numberOfLines={2}>{video.title}</Text>
                                <View style={styles.mediaMeta}>
                                    <Text style={styles.mediaMetaText}>{video.duration || 'Video'}</Text>
                                    <View style={styles.dot} />
                                    <Text style={styles.mediaMetaText}>{video.channel}</Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <MaterialIcons name="close" size={24} color={theme.iconInactive} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>{t('selectQuality').toUpperCase()}</Text>

                    {isFetching ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.loadingText}>{t('fetchingQualities')}</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                            {formats && formats.map((format, idx) => {
                                const isSelected = selectedQuality === format.quality;
                                const ui = getFormatUI(format);

                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.optionCard,
                                            isSelected && styles.optionCardSelected,
                                            { cursor: 'pointer' }
                                        ]}
                                        onPress={() => setSelectedQuality(format.quality)}
                                        activeOpacity={0.9}
                                    >
                                        <View style={styles.optionLeft}>
                                            <View style={[styles.optionIconContainer, isSelected && styles.optionIconContainerSelected]}>
                                                <MaterialIcons
                                                    name={ui.icon}
                                                    size={24}
                                                    color={isSelected ? theme.primary : theme.iconInactive}
                                                />
                                            </View>

                                            <View style={styles.optionTextContainer}>
                                                <View style={styles.optionTitleRow}>
                                                    <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>
                                                        {format.quality === 'audio' ? t('audioOnly') : format.quality}
                                                    </Text>
                                                    <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                                                        <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                                                            {ui.badge}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={styles.optionDesc}>{ui.desc}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.optionRight}>
                                            {fetchingSizes ? (
                                                <ActivityIndicator size="small" color={theme.primary} />
                                            ) : (
                                                <Text style={styles.optionSize}>{ui.size}</Text>
                                            )}
                                            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                                                {isSelected && <View style={styles.radioInner} />}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    )
                    }

                    {/* CTA Button */}
                    <View style={styles.ctaContainer}>
                        <TouchableOpacity
                            style={[
                                styles.ctaButton,
                                (!selectedQuality || isFetching) && styles.ctaGhost,
                                { cursor: selectedQuality ? 'pointer' : 'default' }
                            ]}
                            onPress={handleDownload}
                            disabled={!selectedQuality || isFetching}
                            activeOpacity={0.8}
                        >
                            <MaterialIcons name="download" size={24} color={!selectedQuality ? theme.iconInactive : "white"} />
                            <Text style={[styles.ctaText, !selectedQuality && { color: theme.iconInactive }]}>
                                {t('startDownload')}
                            </Text>
                        </TouchableOpacity>
                        <SafeAreaView />
                    </View>

                </View >
            </View >
        </Modal >
    );
}

const createStyles = (theme) => {
    const s = (size) => size * (theme.fontScale || 1);

    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end',
        },
        touchableDismiss: {
            flex: 1,
            width: '100%',
        },
        modalContent: {
            backgroundColor: theme.contentBackground,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '85%',
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 20,
        },
        handleContainer: {
            width: '100%',
            alignItems: 'center',
            paddingBottom: 12,
        },
        handle: {
            width: 48,
            height: 6,
            backgroundColor: theme.border,
            borderRadius: 3,
        },
        mediaHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
            marginBottom: 16,
            gap: 16,
        },
        thumbnail: {
            width: 112,
            height: 64,
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: theme.chipInactiveBg,
        },
        thumbnailOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        mediaInfo: {
            flex: 1,
            justifyContent: 'center',
        },
        mediaTitle: {
            fontSize: s(14),
            fontWeight: '600',
            color: theme.text,
            marginBottom: 4,
            lineHeight: s(18),
        },
        mediaMeta: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        mediaMetaText: {
            fontSize: s(12),
            fontWeight: '500',
            color: theme.subText,
        },
        dot: {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.subText,
        },
        closeButton: {
            padding: 8,
        },
        sectionTitle: {
            fontSize: s(12),
            fontWeight: 'bold',
            color: theme.subText,
            letterSpacing: 1,
            marginBottom: 12,
        },
        loadingContainer: {
            paddingVertical: 40,
            alignItems: 'center',
        },
        loadingText: {
            marginTop: 16,
            fontSize: s(14),
            color: theme.subText,
        },
        optionsList: {
            flexShrink: 1,
        },
        optionCard: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderRadius: 16,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            marginBottom: 12,
        },
        optionCardSelected: {
            borderColor: theme.primary + '80', // semi-transparent
            backgroundColor: theme.isDark ? theme.primaryBg : theme.card,
        },
        optionLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            flex: 1,
        },
        optionIconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.chipInactiveBg,
            alignItems: 'center',
            justifyContent: 'center',
        },
        optionIconContainerSelected: {
            backgroundColor: theme.primaryBg,
        },
        optionTextContainer: {
            flex: 1,
        },
        optionTitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        optionTitle: {
            fontSize: s(16),
            fontWeight: '600',
            color: theme.text,
        },
        optionTitleSelected: {
            color: theme.text,
        },
        badge: {
            backgroundColor: theme.chipInactiveBg,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
        },
        badgeSelected: {
            backgroundColor: theme.primaryBg,
        },
        badgeText: {
            fontSize: s(10),
            fontWeight: 'bold',
            color: theme.subText,
            textTransform: 'uppercase',
        },
        badgeTextSelected: {
            color: theme.primary,
        },
        optionDesc: {
            fontSize: s(12),
            color: theme.subText,
            marginTop: 2,
        },
        optionRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 16,
        },
        optionSize: {
            fontSize: s(14),
            fontWeight: '500',
            color: theme.subText,
        },
        radioOuter: {
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: theme.iconInactive,
            alignItems: 'center',
            justifyContent: 'center',
        },
        radioOuterSelected: {
            borderColor: theme.primary,
        },
        radioInner: {
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: theme.primary,
        },
        ctaContainer: {
            marginTop: 16,
            paddingTop: 8,
        },
        ctaButton: {
            backgroundColor: theme.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            borderRadius: 32,
            gap: 8,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 5,
        },
        ctaGhost: {
            backgroundColor: theme.chipInactiveBg,
            shadowOpacity: 0,
            elevation: 0,
        },
        ctaText: {
            color: 'white',
            fontSize: s(16),
            fontWeight: 'bold',
        }
    });
};
