import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Switch, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function SettingsScreen() {
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Downloads</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.circleIcon, { backgroundColor: '#fee2e2' }]}>
                            <MaterialIcons name="folder-open" size={24} color="#ea2a33" />
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.titleText}>Download Location</Text>
                            <Text style={styles.subText}>/Documents/Downloads/</Text>
                        </View>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Text style={styles.actionBtnText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Interface</Text>
                <View style={[styles.card, { paddingVertical: 0 }]}>
                    {/* Language */}
                    <TouchableOpacity style={[styles.row, styles.borderBottom, { paddingVertical: 16 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.circleIconSmall, { backgroundColor: '#fee2e2' }]}>
                                <MaterialIcons name="language" size={20} color="#ea2a33" />
                            </View>
                            <Text style={styles.titleText}>Language</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.subText}>English (US)</Text>
                            <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
                        </View>
                    </TouchableOpacity>

                    {/* Dark Mode */}
                    <View style={[styles.row, styles.borderBottom, { paddingVertical: 16 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.circleIconSmall, { backgroundColor: '#fee2e2' }]}>
                                <MaterialIcons name="dark-mode" size={20} color="#ea2a33" />
                            </View>
                            <Text style={styles.titleText}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={setIsDarkMode}
                            trackColor={{ false: '#e2e8f0', true: '#ea2a33' }}
                            thumbColor={'#ffffff'}
                        />
                    </View>

                    {/* Font Size */}
                    <View style={{ padding: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={[styles.circleIconSmall, { backgroundColor: '#fee2e2' }]}>
                                <MaterialIcons name="format-size" size={20} color="#ea2a33" />
                            </View>
                            <Text style={styles.titleText}>Font Size</Text>
                        </View>
                        <View style={styles.segmentedControl}>
                            <TouchableOpacity style={styles.segmentBtn}>
                                <Text style={styles.segmentText}>Small</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive]}>
                                <Text style={styles.segmentTextActive}>Medium</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.segmentBtn}>
                                <Text style={[styles.segmentText, { fontSize: 16 }]}>Large</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Data Management</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.row}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={[styles.circleIconSmall, { backgroundColor: '#fee2e2' }]}>
                                <MaterialIcons name="auto-delete" size={20} color="#dc2626" />
                            </View>
                            <Text style={[styles.titleText, { color: '#dc2626' }]}>Clear Search & History</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color="#fca5a5" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>YouTube Downloader v1.0.0</Text>
                    <Text style={styles.footerSubText}>Built with yt-dlp core</Text>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f6f6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    contentContainer: { flex: 1, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: 8, paddingHorizontal: 8 },
    card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    flex1: { flex: 1, paddingHorizontal: 16 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    circleIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    circleIconSmall: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    titleText: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
    subText: { fontSize: 12, fontWeight: '500', color: '#64748b', marginTop: 4 },
    actionBtn: { backgroundColor: '#ea2a33', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    actionBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
    segmentedControl: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 },
    segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
    segmentBtnActive: { backgroundColor: '#ffffff', borderRadius: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    segmentText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
    segmentTextActive: { fontSize: 14, fontWeight: '700', color: '#ea2a33' },
    footer: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
    footerText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
    footerSubText: { fontSize: 10, color: '#cbd5e1', marginTop: 4 }
});
