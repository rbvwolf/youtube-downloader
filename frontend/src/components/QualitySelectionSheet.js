import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ImageBackground, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../services/Api';

export default function QualitySelectionSheet({ video, onClose }) {
    const [qualities, setQualities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuality, setSelectedQuality] = useState('1080p');

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const data = await api.getVideoInfo(video.id);
                if (data && data.qualities) {
                    setQualities(data.qualities);
                    if (data.qualities.length > 0) {
                        setSelectedQuality(data.qualities[0].quality);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (video) fetchInfo();
    }, [video]);

    const handleDownload = async () => {
        try {
            const response = await api.downloadVideo(video.id, selectedQuality);
            Alert.alert("Başarılı", `İndirme başlatıldı: ${response.message}`);
            onClose();
        } catch (err) {
            Alert.alert("Hata", "İndirme başlatılamadı. İnternet bağlantınızı kontrol edin.");
        }
    };

    return (
        <Modal animationType="slide" transparent visible>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backgroundTap} activeOpacity={1} onPress={onClose} />

                <View style={styles.sheetContainer}>
                    <View style={styles.handleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.header}>
                        <View style={styles.thumbnailContainer}>
                            <ImageBackground source={{ uri: video.thumbnail }} style={styles.fullImage} />
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
                            <View style={styles.metaRow}>
                                <Text style={styles.metaText}>{video.duration || 'LIVE'}</Text>
                                <View style={styles.dot} />
                                <Text style={styles.metaText}>MP4 / MP3</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <MaterialIcons name="close" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Kalite Seçimi</Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#ea2a33" />
                            <Text style={styles.loadingText}>Seçenekler Yükleniyor...</Text>
                        </View>
                    ) : (
                        <ScrollView style={{ flex: 1, marginBottom: 24 }} showsVerticalScrollIndicator={false}>
                            {qualities.map((q) => {
                                const isSelected = selectedQuality === q.quality;
                                return (
                                    <TouchableOpacity
                                        key={q.quality}
                                        onPress={() => setSelectedQuality(q.quality)}
                                        style={[styles.qualityOption, isSelected && styles.qualityOptionSelected]}
                                    >
                                        <View style={styles.qualityLeft}>
                                            <View style={[styles.iconBox, isSelected ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#f1f5f9' }]}>
                                                <MaterialIcons
                                                    name={q.quality === 'audio' ? 'headphones' : 'hd'}
                                                    size={20}
                                                    color={isSelected ? '#ea2a33' : '#94a3b8'}
                                                />
                                            </View>
                                            <View>
                                                <Text style={styles.qualityTitle}>{q.quality.toUpperCase()}</Text>
                                                <Text style={styles.qualityDesc}>{q.label}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.radioBtn, isSelected && styles.radioBtnSelected]}>
                                            {isSelected && <View style={styles.radioBtnInner} />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    <TouchableOpacity
                        onPress={handleDownload}
                        disabled={loading}
                        style={[styles.downloadBtn, loading && { backgroundColor: '#cbd5e1' }]}
                    >
                        <MaterialIcons name="download" size={24} color="white" />
                        <Text style={styles.downloadBtnText}>İNDİRMEYİ BAŞLAT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backgroundTap: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheetContainer: { backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, maxHeight: '85%', paddingBottom: 32, paddingHorizontal: 20 },
    handleContainer: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    handle: { width: 48, height: 6, backgroundColor: '#cbd5e1', borderRadius: 3 },
    header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 8 },
    thumbnailContainer: { width: 112, height: 64, borderRadius: 8, backgroundColor: '#e2e8f0', overflow: 'hidden', marginRight: 16 },
    fullImage: { width: '100%', height: '100%' },
    headerInfo: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 4, lineHeight: 20 },
    metaRow: { flexDirection: 'row', alignItems: 'center' },
    metaText: { fontSize: 12, fontWeight: '500', color: '#64748b' },
    dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94a3b8', marginHorizontal: 8 },
    closeBtn: { padding: 8 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, color: '#64748b', textTransform: 'uppercase', marginTop: 16, marginBottom: 12 },
    loadingContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 8, color: '#64748b', fontSize: 14 },
    qualityOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: 'white' },
    qualityOptionSelected: { borderColor: 'rgba(234,42,51,0.4)' },
    qualityLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    qualityTitle: { fontWeight: '600', fontSize: 16, color: '#0f172a' },
    qualityDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
    radioBtn: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
    radioBtnSelected: { borderColor: '#ea2a33', backgroundColor: '#ea2a33' },
    radioBtnInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
    downloadBtn: { width: '100%', paddingVertical: 16, borderRadius: 32, backgroundColor: '#ea2a33', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#ea2a33', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    downloadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }
});
