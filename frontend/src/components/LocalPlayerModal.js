import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function LocalPlayerModal({ visible, item, onClose, theme, t }) {
    if (!item || !item.filename) return null;

    const fileUrl = `http://127.0.0.1:8000/downloads/${encodeURIComponent(item.filename)}`;
    const isAudio = item.quality === 'audio';

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
                                <audio controls src={fileUrl} style={{ width: '100%', outline: 'none' }} autoPlay />
                            ) : (
                                <video controls src={fileUrl} style={{ width: '100%', height: '100%', outline: 'none' }} autoPlay />
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
