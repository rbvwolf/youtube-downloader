import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ClipboardPopup({ onDismiss }) {
    return (
        <Modal animationType="fade" transparent visible>
            <View style={styles.overlay}>
                <View style={styles.modalCard}>

                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="content-paste" size={24} color="#ea2a33" />
                        </View>
                        <Text style={styles.title}>Link Algılandı!</Text>
                        <Text style={styles.subtitle}>
                            Kopyaladığın videoyu indirmek ister misin?
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.downloadBtn}>
                            <MaterialIcons name="download" size={24} color="white" />
                            <Text style={styles.downloadBtnText}>Hemen İndir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
                            <Text style={styles.dismissBtnText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
    modalCard: { width: '100%', maxWidth: 384, backgroundColor: 'white', borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, borderWidth: 1, borderColor: '#f1f5f9' },
    header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, alignItems: 'center' },
    iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
    subtitle: { fontSize: 14, fontWeight: '500', color: '#64748b', marginTop: 4, textAlign: 'center' },
    actions: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 },
    downloadBtn: { width: '100%', height: 56, backgroundColor: '#ea2a33', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#ea2a33', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2, marginBottom: 12 },
    downloadBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    dismissBtn: { width: '100%', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    dismissBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 }
});
