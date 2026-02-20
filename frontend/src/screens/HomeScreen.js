import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ImageBackground, StatusBar, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import VoiceSearchModal from '../components/VoiceSearchModal';
import QualitySelectionSheet from '../components/QualitySelectionSheet';
import ClipboardPopup from '../components/ClipboardPopup';

const mockVideos = [
    {
        id: '1',
        title: 'Top 10 Scenery 4K - Relaxing Nature Video with Calming Music',
        channel: 'Nature Channel',
        views: '2.1M views',
        duration: '12:04',
        thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW4Vk_IOMsSOeSp6ZDAxKdgalFt-4q-WteqH60Nx1-4xl6dmNHvV944d1ICsokfHVgryW1QjZpEP9MIbH6Rgv1HWbh0kB21D1AVB7SBo5Fu1_z2GcQykzJ2D3tTHDbEv7VxaTisKicG03BzQHv1OJdLn3x0sAAg2cVr-49PKdeALhRmHoLOnpsw7_ciizfIhnH4W0KpJaDKvnMab-hP29ZP0nnUTyJLFN787xf8YiM8-7A-W65FszSdFvpLkj9Lu8o7nev_8oSWL1h',
        isLive: false
    },
    {
        id: '2',
        title: 'lofi hip hop radio - beats to relax/study to',
        channel: 'Lofi Girl',
        views: 'Watching now',
        duration: 'LIVE',
        thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCARoi3OmF_mThdXFzeugKJPkHJWQMSvldfuXMG8h-R76yKvFVXIOJeE8MlbrtayN1O59GPHLrAVtJx6d-N-cRhGL1dxAel-_7JgXYhyYWHbhmkAA4t6OJB9y3kyQwpgVEuXpUKlHJe0-DDoWSjWxyv7BNsy-up_Jkom3xRdlpAEm_4BH1HeeAQghXHk4bjcCxG3O3k6njRV8g2D5lZyxgzEYI9yK6beRdo_VFwWGNi_2RhEH5iGBZZfu-5xo8baDaRhKVxhc5kCiKA',
        isLive: true
    }
];

export default function HomeScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isVoiceModalVisible, setVoiceModalVisible] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isClipboardPopupVisible, setClipboardPopupVisible] = useState(true);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f6f6' }}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f6f6" />

            {/* Search Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#f8f6f6' }}>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    height: 56,
                    backgroundColor: '#ffffff',
                    borderRadius: 28,
                    paddingHorizontal: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2
                }}>
                    <View style={{ padding: 12 }}>
                        <MaterialIcons name="search" size={24} color="#94a3b8" />
                    </View>
                    <TextInput
                        style={{ flex: 1, fontSize: 16, color: '#1e293b' }}
                        placeholder="Search YouTube or paste link..."
                        placeholderTextColor="#94a3b8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity
                        onPress={() => setVoiceModalVisible(true)}
                        style={{
                            width: 40, height: 40,
                            borderRadius: 20,
                            backgroundColor: '#fee2e2',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <MaterialIcons name="mic" size={24} color="#ea2a33" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filter Chips */}
            <View style={{ height: 48, marginBottom: 8 }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
                >
                    <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a' }}>Recent</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#ea2a33', marginRight: 8, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#ffffff' }}>Trending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a' }}>Music</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f172a' }}>Gaming</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Main Video List */}
            <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
                {mockVideos.map((video) => (
                    <TouchableOpacity
                        key={video.id}
                        style={{ marginBottom: 24 }}
                        onPress={() => setSelectedVideo(video)}
                        activeOpacity={0.8}
                    >
                        <View style={{ width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e2e8f0', marginBottom: 12 }}>
                            <ImageBackground source={{ uri: video.thumbnail }} style={{ width: '100%', height: '100%' }} />
                            <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: 'white' }}>
                                    {video.isLive ? 'LIVE' : video.duration}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#cbd5e1', marginRight: 12 }} />
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 }} numberOfLines={2}>
                                    {video.title}
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b' }}>
                                    {video.channel} • {video.views}
                                </Text>
                            </View>
                            <TouchableOpacity style={{ padding: 4 }}>
                                <MaterialIcons name="more-vert" size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={{
                    position: 'absolute', bottom: 24, right: 16,
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: '#ea2a33',
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: '#ea2a33', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
                }}
                activeOpacity={0.9}
            >
                <MaterialIcons name="add-link" size={28} color="white" />
            </TouchableOpacity>

            {/* Modals */}
            {isVoiceModalVisible && (
                <VoiceSearchModal
                    onClose={() => setVoiceModalVisible(false)}
                    onResult={(text) => {
                        setSearchQuery(text);
                        setVoiceModalVisible(false);
                    }}
                />
            )}

            {selectedVideo && (
                <QualitySelectionSheet
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                />
            )}

            {isClipboardPopupVisible && (
                <ClipboardPopup
                    onDismiss={() => setClipboardPopupVisible(false)}
                />
            )}
        </SafeAreaView>
    );
}
