import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const { theme } = useTheme();
    const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const showToast = (message, type = 'success', duration = 3000) => {
        setToast({ visible: true, message, type });

        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();

        setTimeout(() => {
            hideToast();
        }, duration);
    };

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 100,
                duration: 300,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setToast(prev => ({ ...prev, visible: false }));
        });
    };

    const getToastStyle = () => {
        switch (toast.type) {
            case 'success':
                return { backgroundColor: '#22c55e', icon: 'check-circle' };
            case 'error':
                return { backgroundColor: '#ef4444', icon: 'error' };
            default:
                return { backgroundColor: '#3b82f6', icon: 'info' };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast.visible && (
                <View style={styles.toastContainer}>
                    <Animated.View
                        style={[
                            styles.toast,
                            {
                                backgroundColor: getToastStyle().backgroundColor,
                                transform: [{ translateY }],
                                opacity
                            }
                        ]}
                    >
                        <MaterialIcons name={getToastStyle().icon} size={20} color="white" />
                        <Text style={styles.toastText}>{toast.message}</Text>
                    </Animated.View>
                </View>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        bottom: 100, // Above bottom tabs
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        pointerEvents: 'none', // Don't block interactions
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        maxWidth: '80%',
    },
    toastText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    }
});
