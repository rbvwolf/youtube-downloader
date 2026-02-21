import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function VideoPreviewModal({ visible, video, onClose, onDownload, onMoreInfo, theme, completedDownloads, t }) {
    if (!video) return null;

    const isAudioCompleted = completedDownloads.some(d => d.id === video.id && d.quality === 'audio');
    const isVideoCompleted = completedDownloads.some(d => d.id === video.id && d.quality !== 'audio');
    const GREEN_COLOR = '#4CAF50';

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>

                    {/* Video Player */}
                    <View style={styles.playerContainer}>
                        {Platform.OS === 'web' ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: theme.text }}>Preview not supported on this platform</Text>
                            </View>
                        )}
                    </View>

                    {/* Actions and Info */}
                    <View style={styles.infoContainer}>
                        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                            {video.title}
                        </Text>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={[styles.quickButton, { backgroundColor: theme.chipInactiveBg }, isAudioCompleted && { backgroundColor: `${GREEN_COLOR}20` }]}
                                onPress={() => { onDownload('audio'); onClose(); }}
                            >
                                <MaterialIcons name={isAudioCompleted ? "check-circle" : "music-note"} size={20} color={isAudioCompleted ? GREEN_COLOR : theme.text} />
                                <Text style={[styles.quickButtonText, { color: theme.text }, isAudioCompleted && { color: GREEN_COLOR }]}>MP3</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.quickButton, { backgroundColor: theme.chipInactiveBg }, isVideoCompleted && { backgroundColor: `${GREEN_COLOR}20` }]}
                                onPress={() => { onDownload('1080p'); onClose(); }}
                            >
                                <MaterialIcons name={isVideoCompleted ? "check-circle" : "movie"} size={20} color={isVideoCompleted ? GREEN_COLOR : theme.text} />
                                <Text style={[styles.quickButtonText, { color: theme.text }, isVideoCompleted && { color: GREEN_COLOR }]}>{video.isLive ? 'REC' : 'MP4'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.moreButton, { backgroundColor: theme.chipInactiveBg }]}
                                onPress={() => { onMoreInfo(video); onClose(); }}
                            >
                                <MaterialIcons name="add" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)', // dark hatch background basically
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxWidth: 800,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    playerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    infoContainer: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
        cursor: 'pointer',
    },
    quickButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    moreButton: {
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        cursor: 'pointer',
    }
});
