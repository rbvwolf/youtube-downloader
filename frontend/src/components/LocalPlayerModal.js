import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import api from '../services/Api';

export default function LocalPlayerModal({ visible, item, onClose, theme, t }) {
    const { showToast } = useToast();

    if (!item || !item.filename) return null;

    // Use absolute path with /play endpoint to support custom download directories
    const basename = item.filename.split(/[/\\]/).pop();
    const fileUrl = `${api.getBaseURL()}/play?filepath=${encodeURIComponent(item.filename)}`;

    // Detect audio: quality='audio' OR .mp3 extension
    const isAudio = item.quality === 'audio' || (basename || '').toLowerCase().endsWith('.mp3');

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity activeOpacity={1} style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Local Player */}
                    <View style={[styles.playerContainer, isAudio && { aspectRatio: 'auto', padding: 20 }]}>
                        {Platform.OS === 'web' ? (
                            isAudio ? (
                                <audio controls src={fileUrl} style={{ width: '100%', outline: 'none' }} autoPlay onError={() => { showToast(t('fileNotFound'), 'error'); onClose(); }} />
                            ) : (
                                <video controls src={fileUrl} style={{ width: '100%', height: '100%', outline: 'none' }} autoPlay onError={() => { showToast(t('fileNotFound'), 'error'); onClose(); }} />
                            )
                        ) : (
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: theme.text }}>Local playback requires Web platform.</Text>
                            </View>
                        )}
                    </View>

                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 16
    },
    closeBtn: {
        cursor: 'pointer',
        padding: 4
    },
    playerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center'
    }
});
