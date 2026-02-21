import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Switch, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function SettingsScreen() {
    const { theme, isDarkMode, toggleTheme } = useTheme();

    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={[styles.iconBtn, { cursor: 'pointer' }]}>
                        <MaterialIcons name="arrow-back-ios" size={20} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={styles.iconBtn} />
                </View>

                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>Downloads</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.circleIcon, { backgroundColor: theme.primaryBg }]}>
                                <MaterialIcons name="folder-open" size={24} color={theme.primary} />
                            </View>
                            <View style={styles.flex1}>
                                <Text style={styles.titleText}>Download Location</Text>
                                <Text style={styles.subText}>/Documents/Downloads/</Text>
                            </View>
                            <TouchableOpacity style={[styles.actionBtn, { cursor: 'pointer' }]}>
                                <Text style={styles.actionBtnText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Interface</Text>
                    <View style={[styles.card, { paddingVertical: 0 }]}>
                        {/* Language */}
                        <TouchableOpacity style={[styles.row, styles.borderBottom, { paddingVertical: 16, cursor: 'pointer' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.circleIconSmall, { backgroundColor: theme.primaryBg }]}>
                                    <MaterialIcons name="language" size={20} color={theme.primary} />
                                </View>
                                <Text style={styles.titleText}>Language</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.subText, { marginTop: 0, marginRight: 8 }]}>English (US)</Text>
                                <MaterialIcons name="chevron-right" size={20} color={theme.iconInactive} />
                            </View>
                        </TouchableOpacity>

                        {/* Dark Mode */}
                        <View style={[styles.row, styles.borderBottom, { paddingVertical: 16 }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.circleIconSmall, { backgroundColor: theme.primaryBg }]}>
                                    <MaterialIcons name="dark-mode" size={20} color={theme.primary} />
                                </View>
                                <Text style={styles.titleText}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDarkMode}
                                onValueChange={toggleTheme}
                                trackColor={{ false: theme.border, true: theme.primary }}
                                thumbColor={'#ffffff'}
                                style={{ cursor: 'pointer' }}
                            />
                        </View>

                        {/* Font Size */}
                        <View style={{ padding: 16 }}>
                            <View style={[styles.row, { paddingVertical: 0, marginBottom: 12 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.circleIconSmall, { backgroundColor: theme.primaryBg }]}>
                                        <MaterialIcons name="format-size" size={20} color={theme.primary} />
                                    </View>
                                    <Text style={styles.titleText}>Font Size</Text>
                                </View>
                            </View>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity style={[styles.segmentBtn, { cursor: 'pointer' }]}>
                                    <Text style={styles.segmentText}>Small</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.segmentBtn, styles.segmentBtnActive, { cursor: 'pointer' }]}>
                                    <Text style={styles.segmentTextActive}>Medium</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.segmentBtn, { cursor: 'pointer' }]}>
                                    <Text style={[styles.segmentText, { fontSize: 16 }]}>Large</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Data Management</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={[styles.row, { cursor: 'pointer' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.circleIconSmall, { backgroundColor: theme.dangerBg }]}>
                                    <MaterialIcons name="auto-delete" size={20} color={theme.danger} />
                                </View>
                                <Text style={[styles.titleText, { color: theme.danger }]}>Clear Search & History</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={20} color={theme.dangerBg} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>YouTube Downloader v1.0.0</Text>
                        <Text style={styles.footerSubText}>Built with yt-dlp core</Text>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    contentContainer: { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: theme.contentBackground },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { flex: 1, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', color: theme.subText, marginBottom: 8, paddingHorizontal: 8 },
    card: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    flex1: { flex: 1, paddingHorizontal: 16 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.border },
    circleIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    circleIconSmall: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    titleText: { fontSize: 16, fontWeight: '600', color: theme.text },
    subText: { fontSize: 12, fontWeight: '500', color: theme.subText, marginTop: 4 },
    actionBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    actionBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },
    segmentedControl: { flexDirection: 'row', backgroundColor: theme.segmentedControlBg, borderRadius: 8, padding: 4 },
    segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
    segmentBtnActive: { backgroundColor: theme.card, borderRadius: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    segmentText: { fontSize: 14, fontWeight: '500', color: theme.subText },
    segmentTextActive: { fontSize: 14, fontWeight: '700', color: theme.primary },
    footer: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
    footerText: { fontSize: 12, fontWeight: '600', color: theme.iconInactive },
    footerSubText: { fontSize: 10, color: theme.iconInactive, marginTop: 4 }
});
