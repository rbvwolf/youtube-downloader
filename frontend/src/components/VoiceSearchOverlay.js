import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function VoiceSearchOverlay({ visible, onCancel, transcript, theme }) {
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Waveform Animation logic
    const animations = useRef(Array(10).fill(0).map(() => new Animated.Value(0))).current;

    useEffect(() => {
        if (visible) {
            const animateBar = (anim, delay) => {
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 600,
                            delay: delay,
                            useNativeDriver: true,
                        }),
                        Animated.timing(anim, {
                            toValue: 0,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ])
                ).start();
            };

            // Staggered delays
            const delays = [0, 100, 200, 150, 300, 250, 100, 200, 50, 350];
            animations.forEach((anim, i) => animateBar(anim, delays[i]));
        } else {
            animations.forEach(anim => anim.stopAnimation());
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            {/* Blurred background map */}
            <View style={styles.overlay}>
                {/* Top Section */}
                <View style={styles.topSection}>
                    <Text style={styles.statusText}>Listening...</Text>
                    <Text style={styles.hintText}>Try saying "Play lo-fi music"</Text>
                </View>

                {/* Middle Section (Visualizer & Transcription) */}
                <View style={styles.middleSection}>
                    <View style={styles.visualizerContainer}>
                        {animations.map((anim, index) => {
                            const scaleY = anim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.5, 1.5]
                            });

                            // Highlight the middle bar
                            const isCenter = index === 4;

                            return (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.bar,
                                        isCenter && styles.centerBar,
                                        index % 2 !== 0 && !isCenter && styles.altBar,
                                        {
                                            transform: [{ scaleY }],
                                            height: [32, 48, 64, 80, 96, 64, 48, 80, 56, 32][index]
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>

                    {transcript ? (
                        <View style={styles.transcriptionBox}>
                            <Text style={styles.transcriptionText}>
                                "{transcript}<Text style={{ opacity: 0.4 }}>...</Text>"
                            </Text>
                        </View>
                    ) : (
                        <View style={{ height: 80 }} /> // Spacer to prevent jumps
                    )}
                </View>

                {/* Bottom Section */}
                <View style={styles.bottomSection}>
                    {/* Glowing Mic */}
                    <View style={styles.micCircle}>
                        <View style={styles.micGlow} />
                        <View style={styles.micButton}>
                            <MaterialIcons name="mic" size={32} color="white" />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.cancelBtn, { cursor: 'pointer' }]}
                        onPress={onCancel}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="close" size={24} color={theme.primary} />
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (theme) => {
    const s = (size) => size * (theme.fontScale || 1);

    return StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 48,
            paddingHorizontal: 24,
            ...StyleSheet.absoluteFillObject,
        },
        topSection: {
            flex: 0.5,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 40,
        },
        statusText: {
            fontSize: s(28),
            fontWeight: 'bold',
            color: theme.isDark ? '#fff' : '#0f172a',
            marginBottom: 8,
        },
        hintText: {
            fontSize: s(14),
            fontWeight: '500',
            color: theme.subText,
        },
        middleSection: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            gap: 32,
        },
        visualizerContainer: {
            height: 120,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
        },
        bar: {
            width: 6,
            backgroundColor: theme.primary,
            borderRadius: 3,
        },
        altBar: {
            backgroundColor: theme.isDark ? '#ff8a90' : '#fca5a5',
        },
        centerBar: {
            width: 8,
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 5,
        },
        transcriptionBox: {
            backgroundColor: theme.isDark ? 'rgba(42,26,26,0.8)' : 'rgba(255,224,226,0.5)',
            paddingVertical: 24,
            paddingHorizontal: 24,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#ffe0e2',
            maxWidth: 320,
            width: '100%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 10,
        },
        transcriptionText: {
            fontSize: s(20),
            fontWeight: '600',
            color: theme.text,
            textAlign: 'center',
            lineHeight: s(28),
        },
        bottomSection: {
            flex: 0.5,
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 24,
            width: '100%',
            paddingBottom: 32,
        },
        micCircle: {
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        micGlow: {
            position: 'absolute',
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: theme.primary,
            opacity: 0.2,
        },
        micButton: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
        },
        cancelBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.card,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 32,
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: theme.isDark ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: theme.border,
        },
        cancelText: {
            fontSize: s(16),
            fontWeight: 'bold',
            color: theme.text,
        }
    });
};
