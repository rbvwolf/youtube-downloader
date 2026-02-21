import '@expo/metro-runtime';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import ErrorBoundary from './src/components/ErrorBoundary';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';

const Tab = createBottomTabNavigator();

function MainApp() {
    const { theme } = useTheme();
    return (
        <ErrorBoundary>
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => {
                            let iconName;
                            if (route.name === 'Home') iconName = 'home';
                            else if (route.name === 'Downloads') iconName = 'download';
                            else if (route.name === 'Settings') iconName = 'settings';

                            return <MaterialIcons name={iconName} size={size} color={color} />;
                        },
                        tabBarActiveTintColor: theme.primary,
                        tabBarInactiveTintColor: theme.iconInactive,
                        tabBarStyle: {
                            backgroundColor: theme.card,
                            borderTopWidth: 1,
                            borderTopColor: theme.border,
                            height: 60,
                            paddingBottom: 8,
                            paddingTop: 8,
                            maxWidth: 800,
                            width: '100%',
                            alignSelf: 'center'
                        },
                    })}
                >
                    <Tab.Screen name="Home" component={HomeScreen} />
                    <Tab.Screen name="Downloads" component={DownloadsScreen} />
                    <Tab.Screen name="Settings" component={SettingsScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        </ErrorBoundary>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <ToastProvider>
                <MainApp />
            </ToastProvider>
        </ThemeProvider>
    );
}
