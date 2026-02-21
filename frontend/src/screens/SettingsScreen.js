import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StyleSheet, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../context/ThemeContext';
import { useDownloads } from '../context/DownloadContext';
import { useToast } from '../context/ToastContext';
import { useSearchHistory } from '../context/SearchContext';

export default function SettingsScreen() {
    const { theme, themePref, setAppTheme, language, setAppLanguage, setFontSize, t } = useTheme();
    const { downloadPath, updateDownloadPath, clearHistory } = useDownloads();
    const { showToast } = useToast();
    const { clearRecentSearches } = useSearchHistory();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [pathModalVisible, setPathModalVisible] = React.useState(false);
    const [tempPath, setTempPath] = React.useState('');

    const handlePickDirectory = async () => {
        if (Platform.OS === 'web' && window.showDirectoryPicker) {
            try {
                const dirHandle = await window.showDirectoryPicker();
                showToast(`Selected directory: ${dirHandle.name}. Please ensure this is an absolute path.`, 'info');
                setTempPath(`C:\\Users\\Name\\${dirHandle.name}`);
                setPathModalVisible(true);
            } catch (err) {
                console.log('Directory picker cancelled or failed', err);
                setTempPath(downloadPath);
                setPathModalVisible(true);
            }
        } else if (Platform.OS === 'android') {
            try {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const uri = permissions.directoryUri;
                    setTempPath(uri);
                    setPathModalVisible(true);
                } else {
                    setTempPath(downloadPath);
                    setPathModalVisible(true);
                }
            } catch (err) {
                console.error("Failed to pick directory", err);
                setTempPath(downloadPath);
                setPathModalVisible(true);
            }
        } else {
            setTempPath(downloadPath);
            setPathModalVisible(true);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={[styles.iconBtn, { cursor: 'pointer' }]}>
                        <MaterialIcons name="arrow-back-ios" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('settings')}</Text>
                    <View style={styles.iconBtn} />
                </View>

                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>{t('downloads')}</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.circleIcon, { backgroundColor: theme.primaryBg }]}>
                                <MaterialIcons name="folder-open" size={24} color={theme.primary} />
                            </View>
                            <View style={styles.flex1}>
                                <Text style={styles.titleText}>{t('downloadLocation')}</Text>
                                <Text style={styles.subText} numberOfLines={1}>{downloadPath || 'Varsayılan (Default)'}</Text>
                            </View>
                            <TouchableOpacity style={[styles.actionBtn, { cursor: 'pointer' }]} onPress={handlePickDirectory}>
                                <Text style={styles.actionBtnText}>{t('change')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>{t('interface')}</Text>
                    <View style={[styles.card, { paddingVertical: 0 }]}>

                        {/* Language */}
                        <View style={[styles.rowColumn, styles.borderBottom]}>
                            <View style={styles.rowHeader}>
                                <View style={[styles.circleIconSmall, { backgroundColor: theme.primaryBg }]}>
                                    <MaterialIcons name="language" size={20} color={theme.primary} />
                                </View>
                                <Text style={styles.titleText}>{t('language')}</Text>
                            </View>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, language === 'en' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setAppLanguage('en')}
                                >
                                    <Text style={language === 'en' ? styles.segmentTextActive : styles.segmentText}>English</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, language === 'tr' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setAppLanguage('tr')}
                                >
                                    <Text style={language === 'tr' ? styles.segmentTextActive : styles.segmentText}>Türkçe</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Theme Options */}
                        <View style={[styles.rowColumn, styles.borderBottom]}>
                            <View style={styles.rowHeader}>
                                <View style={[styles.circleIconSmall, { backgroundColor: theme.primaryBg }]}>
                                    <MaterialIcons name="dark-mode" size={20} color={theme.primary} />
                                </View>
                                <Text style={styles.titleText}>{t('darkMode')}</Text>
                            </View>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, themePref === 'light' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setAppTheme('light')}
                                >
                                    <Text style={themePref === 'light' ? styles.segmentTextActive : styles.segmentText}>{t('themeLight')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, themePref === 'dark' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setAppTheme('dark')}
                                >
                                    <Text style={themePref === 'dark' ? styles.segmentTextActive : styles.segmentText}>{t('themeDark')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, themePref === 'system' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setAppTheme('system')}
                                >
                                    <Text style={themePref === 'system' ? styles.segmentTextActive : styles.segmentText}>{t('themeSystem')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Font Size */}
                        <View style={styles.rowColumn}>
                            <View style={styles.rowHeader}>
                                <View style={[styles.circleIconSmall, { backgroundColor: theme.primaryBg }]}>
                                    <MaterialIcons name="format-size" size={20} color={theme.primary} />
                                </View>
                                <Text style={styles.titleText}>{t('fontSize')}</Text>
                            </View>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, theme.fontSize === 'small' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setFontSize('small')}
                                >
                                    <Text style={theme.fontSize === 'small' ? styles.segmentTextActive : styles.segmentText}>{t('fontSmall')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, theme.fontSize === 'medium' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setFontSize('medium')}
                                >
                                    <Text style={theme.fontSize === 'medium' ? styles.segmentTextActive : styles.segmentText}>{t('fontMedium')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.segmentBtn, theme.fontSize === 'large' && styles.segmentBtnActive, { cursor: 'pointer' }]}
                                    onPress={() => setFontSize('large')}
                                >
                                    <Text style={theme.fontSize === 'large' ? styles.segmentTextActive : styles.segmentText}>{t('fontLarge')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>{t('dataManagement')}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={[styles.row, { cursor: 'pointer' }]} onPress={async () => {
                            clearRecentSearches();
                            clearHistory();
                            showToast(t('historyCleared'), 'success');
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={[styles.circleIconSmall, { backgroundColor: theme.dangerBg }]}>
                                    <MaterialIcons name="auto-delete" size={20} color={theme.danger} />
                                </View>
                                <Text style={[styles.titleText, { color: theme.danger }]}>{t('clearSearchHistory')}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={theme.dangerBg} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>YouTube Downloader v1.0.0</Text>
                        <Text style={styles.footerSubText}>Built with yt-dlp core</Text>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

            {/* Download Path Modal */}
            {pathModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>{t('downloadLocation')}</Text>
                        <Text style={styles.modalSubtitle}>{t('enterPath')}</Text>
                        <TextInput
                            style={[styles.textInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                            value={tempPath}
                            onChangeText={setTempPath}
                            placeholder="C:\Users\Name\Downloads"
                            placeholderTextColor={theme.iconInactive}
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.chipInactiveBg }]} onPress={() => setPathModalVisible(false)}>
                                <Text style={[styles.modalBtnText, { color: theme.text }]}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={() => { updateDownloadPath(tempPath); setPathModalVisible(false); }}>
                                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

        </SafeAreaView>
    );
}

const createStyles = (theme) => {
    const s = (size) => size * (theme.fontScale || 1);

    return StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        contentContainer: { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: theme.contentBackground },
        header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
        headerTitle: { fontSize: s(20), fontWeight: 'bold', color: theme.text },
        iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
        scrollContent: { flex: 1, paddingHorizontal: 16 },
        sectionTitle: { fontSize: s(12), fontWeight: '700', textTransform: 'uppercase', color: theme.subText, marginBottom: 8, paddingHorizontal: 8 },
        card: { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2 },
        row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        rowColumn: { paddingVertical: 16 },
        rowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
        flex1: { flex: 1, paddingHorizontal: 16 },
        borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.border },
        circleIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
        circleIconSmall: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
        titleText: { fontSize: s(16), fontWeight: '600', color: theme.text },
        subText: { fontSize: s(12), fontWeight: '500', color: theme.subText, marginTop: 4 },
        actionBtn: { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
        actionBtnText: { color: 'white', fontSize: s(14), fontWeight: '600' },
        segmentedControl: { flexDirection: 'row', backgroundColor: theme.segmentedControlBg, borderRadius: 8, padding: 4 },
        segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
        segmentBtnActive: { backgroundColor: theme.card, borderRadius: 6, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
        segmentText: { fontSize: s(14), fontWeight: '500', color: theme.subText },
        segmentTextActive: { fontSize: s(14), fontWeight: '700', color: theme.primary },
        footer: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
        footerText: { fontSize: s(12), fontWeight: '600', color: theme.iconInactive },
        footerSubText: { fontSize: s(10), color: theme.iconInactive, marginTop: 4 },
        modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
        modalContent: { width: '90%', maxWidth: 400, padding: 24, borderRadius: 16, borderWidth: 1 },
        modalTitle: { fontSize: s(18), fontWeight: 'bold', marginBottom: 8 },
        modalSubtitle: { fontSize: s(14), color: theme.subText, marginBottom: 16 },
        textInput: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: s(14), marginBottom: 24 },
        modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
        modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, cursor: 'pointer' },
        modalBtnText: { fontSize: s(14), fontWeight: '600' }
    });
};
