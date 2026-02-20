import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Voice from '@react-native-voice/voice';

export default function VoiceSearchModal({ onClose, onResult }) {
    const [isListening, setIsListening] = useState(false);
    const [partialResult, setPartialResult] = useState('');
    const pulseAnim = new Animated.Value(1);

    useEffect(() => {
        // Setup Voice
        Voice.onSpeechStart = () => setIsListening(true);
        Voice.onSpeechEnd = () => setIsListening(false);
        Voice.onSpeechResults = (e) => {
            const text = e.value[0];
            setPartialResult(text);
            setTimeout(() => {
                onResult(text);
            }, 1000);
        };
        Voice.onSpeechPartialResults = (e) => {
            setPartialResult(e.value[0]);
        };

        startListening();

        return () => {
            Voice.destroy().then(Voice.removeAllListeners);
        };
    }, []);

    const startListening = async () => {
        try {
            setPartialResult('');
            await Voice.start('tr-TR');
            startPulse();
        } catch (e) {
            console.error(e);
        }
    };

    const startPulse = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
            ])
        ).start();
    };

    return (
        <Modal animationType="fade" transparent visible>
            <View style={styles.overlay}>

                {/* Top Section */}
                <View style={styles.topSection}>
                    <Text style={styles.title}>Dinleniyor...</Text>
                    <Text style={styles.subtitle}>Örn: "Hareketli şarkılar aç"</Text>
                </View>

                {/* Middle Section: Visualizer & Text */}
                <View style={styles.middleSection}>
                    <View style={styles.visualizerContainer}>
                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((i, index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.bar,
                                    index % 2 === 0 ? { backgroundColor: '#ff8a90' } : { backgroundColor: '#ea2a33' },
                                    { height: 20 * i },
                                    { transform: [{ scaleY: pulseAnim }] }
                                ]}
                            />
                        ))}
                    </View>

                    <View style={styles.resultContainer}>
                        <View style={styles.resultBox}>
                            <Text style={styles.resultText}>
                                {partialResult ? `"${partialResult}"` : "..."}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bottom Section: Actions */}
                <View style={styles.bottomSection}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <View style={styles.micButton}>
                            <MaterialIcons name="mic" size={32} color="white" />
                        </View>
                    </Animated.View>

                    <TouchableOpacity onPress={() => { Voice.stop(); onClose(); }} style={styles.cancelButton}>
                        <MaterialIcons name="close" size={24} color="#ea2a33" />
                        <Text style={styles.cancelText}>İptal</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
    topSection: { width: '100%', alignItems: 'center', paddingTop: 40 },
    title: { fontSize: 30, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
    subtitle: { fontSize: 14, fontWeight: '500', color: '#64748b' },
    middleSection: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
    visualizerContainer: { height: 128, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
    bar: { width: 6, borderRadius: 3, marginHorizontal: 4 },
    resultContainer: { width: '100%', maxWidth: 384 },
    resultBox: { backgroundColor: 'rgba(255, 224, 226, 0.5)', borderRadius: 12, padding: 24, alignItems: 'center', borderColor: '#ffe0e2', borderWidth: 1 },
    resultText: { fontSize: 20, fontWeight: '600', color: '#1e293b', textAlign: 'center' },
    bottomSection: { width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 32 },
    micButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ea2a33', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 24 },
    cancelButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 16, backgroundColor: 'white', borderRadius: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
    cancelText: { fontSize: 16, fontWeight: 'bold', color: '#334155', marginLeft: 8 }
});
