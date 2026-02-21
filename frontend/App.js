import '@expo/metro-runtime';
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import ErrorBoundary from './src/components/ErrorBoundary';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { ToastProvider } from './src/context/ToastContext';
import { DownloadProvider } from './src/context/DownloadContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        </Stack.Navigator>
    );
}

function MainApp() {
    const { theme, isDarkMode } = useTheme();
    return (
        <ErrorBoundary>
            <View style={{ flex: 1, backgroundColor: theme.background, minHeight: Platform.OS === 'web' ? '100vh' : '100%' }}>
                <NavigationContainer
                    theme={{
                        colors: {
                            background: theme.background,
                            card: theme.card,
                            text: theme.text,
                            border: theme.border,
                            primary: theme.primary,
                        },
                        dark: isDarkMode,
                    }}
                >
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
                        <Tab.Screen name="Home" component={HomeStack} />
                        <Tab.Screen name="Downloads" component={DownloadsScreen} />
                        <Tab.Screen name="Settings" component={SettingsScreen} />
                    </Tab.Navigator>
                </NavigationContainer>
            </View>
        </ErrorBoundary>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <DownloadProvider>
                <ToastProvider>
                    <MainApp />
                </ToastProvider>
            </DownloadProvider>
        </ThemeProvider>
    );
}
