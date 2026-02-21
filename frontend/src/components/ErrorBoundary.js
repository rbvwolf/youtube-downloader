import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.title}>Uygulama Hatası (Çöktü)</Text>
                    <ScrollView style={styles.errorContainer}>
                        <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#991b1b',
        marginBottom: 12,
        textAlign: 'center'
    },
    errorContainer: {
        maxHeight: 200,
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#7f1d1d',
    },
});

export default ErrorBoundary;
