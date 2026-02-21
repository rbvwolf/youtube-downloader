import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DownloadsScreen() {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.headerTitle}>Downloads</Text>
                        <TouchableOpacity style={[styles.iconBtn, { cursor: 'pointer' }]}>
                            <MaterialIcons name="more-vert" size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40, marginTop: 16 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                            <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.text, cursor: 'pointer' }]}>
                                <Text style={[styles.filterBtnText, { color: theme.background }]}>All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterBtn, { cursor: 'pointer' }]}>
                                <Text style={styles.filterBtnText}>Active</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterBtn, { cursor: 'pointer' }]}>
                                <Text style={styles.filterBtnText}>Completed</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>

                <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                    {/* Active Item */}
                    <TouchableOpacity style={[styles.card, { cursor: 'pointer' }]} activeOpacity={0.9}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={styles.thumbnailCont}>
                                <ImageBackground
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP8e1aW8zg5OhX7ifWp0NcAUHGY8Rm5k8HkQzJdYYHxG2Lr6VIFsZqdwfauXPgyRZve4bVxUb79JSKVRu5z7wjfa1hF6mZwFR0zbeaJ6CxUnxFDjOwFMdNfBy3_PhzzNC6oQA8Xo_-0EBX_cJMpgvEwiUTzqFhCce-JezWy-FE5ac_Yf9NGldKRvYZCDLeLP4IsyGA4qdbr5tHo5MlLIqZogg54U80pEmO2X9Wnx2EAkAJ3jqQR2Lc1Jk9LUbLWdFFKqdk4DI6-tNn' }}
                                    style={[styles.fullImage, { opacity: 0.8 }]}
                                />
                                <View style={[styles.overlayCenter, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                                    <MaterialIcons name="downloading" size={28} color="white" />
                                </View>
                            </View>
                            <View style={styles.cardInfo}>
                                <View>
                                    <Text style={styles.cardTitle} numberOfLines={2}>lofi hip hop radio - beats to relax/study to</Text>
                                    <Text style={styles.cardSubText}>12 MB / 45 MB • 1.2 MB/s</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                                    <View style={styles.progressBarBg}>
                                        <View style={styles.progressBarFill} />
                                    </View>
                                    <MaterialIcons name="pause" size={20} color={theme.iconInactive} />
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Completed Video Item */}
                    <TouchableOpacity style={[styles.card, { cursor: 'pointer' }]} activeOpacity={0.9}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={styles.thumbnailCont}>
                                <ImageBackground
                                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBD6TsukLg_B4KuxkTWkPTdL-YHo-KTjfJz_tfxPH7zikgtv0wyHr9rrp9WyvpIWqxxH1Uc1kUqlemwskTGfaM5xcB2Ef6REB4bkrBSJfYvdrp0d794F0ueUSEI8zU9_6NFtEoP5ipGQsc5lPdPQqIggbJtoBPRU7DcoGN8f6Ksh-7EeEpQ9mZnF7L5IOkqlu4h8X5Unv8jWt9333Kk9trtRK503iF_KdK6Byj6Eh1HLvudbWNJlR-HPTNjjAIIRb1lfRnklBIi-4ee' }}
                                    style={styles.fullImage}
                                />
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>12:45</Text>
                                </View>
                            </View>
                            <View style={styles.cardInfo}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Text style={[styles.cardTitle, { flex: 1, marginRight: 8 }]} numberOfLines={2}>MKBHD - iPhone 15 Review: The Truth</Text>
                                    <MaterialIcons name="more-vert" size={20} color={theme.iconInactive} />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <View style={styles.qualityTag}>
                                        <Text style={styles.qualityTagText}>1080p</Text>
                                    </View>
                                    <Text style={styles.cardSubText}>Oct 24 • 245 MB</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Completed Audio Item */}
                    <TouchableOpacity style={[styles.card, { cursor: 'pointer' }]} activeOpacity={0.9}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={[styles.thumbnailCont, { backgroundColor: theme.primaryBg, alignItems: 'center', justifyContent: 'center' }]}>
                                <MaterialIcons name="headphones" size={32} color={theme.primary} />
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationText}>45:12</Text>
                                </View>
                            </View>
                            <View style={styles.cardInfo}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Text style={[styles.cardTitle, { flex: 1, marginRight: 8 }]} numberOfLines={2}>TED Talk: The Future of AI in Design</Text>
                                    <MaterialIcons name="more-vert" size={20} color={theme.iconInactive} />
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                    <View style={[styles.qualityTag, { backgroundColor: theme.primaryBg }]}>
                                        <Text style={[styles.qualityTagText, { color: theme.primary }]}>Audio</Text>
                                    </View>
                                    <Text style={styles.cardSubText}>Oct 20 • 32 MB</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 80 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    contentContainer: { flex: 1, maxWidth: 800, width: '100%', alignSelf: 'center', backgroundColor: theme.contentBackground },
    header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: theme.headerBackground, borderBottomWidth: 1, borderBottomColor: theme.border },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    filterBtn: { height: 36, paddingHorizontal: 20, borderRadius: 18, backgroundColor: theme.chipInactiveBg, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    filterBtnText: { fontSize: 14, fontWeight: '600', color: theme.subText },
    listContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
    card: { backgroundColor: theme.card, borderRadius: 24, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: theme.isDark ? 0.2 : 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: theme.border },
    thumbnailCont: { width: 120, height: 76, borderRadius: 12, backgroundColor: theme.chipInactiveBg, overflow: 'hidden' }, // Using chipInactiveBg for placeholder background
    fullImage: { width: '100%', height: '100%' },
    overlayCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    durationBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    durationText: { color: 'white', fontSize: 10, fontWeight: '500' },
    cardInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
    cardTitle: { fontSize: 14, fontWeight: '600', color: theme.text, lineHeight: 20 },
    cardSubText: { fontSize: 12, color: theme.subText },
    progressBarBg: { flex: 1, height: 6, backgroundColor: theme.border, borderRadius: 3, marginRight: 16, overflow: 'hidden' },
    progressBarFill: { width: '40%', height: '100%', backgroundColor: theme.primary, borderRadius: 3 },
    qualityTag: { backgroundColor: theme.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
    qualityTagText: { fontSize: 10, fontWeight: '600', color: theme.subText },
});
