// components/ToggleTema.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ContextTheme';

export default function ToggleTema() {
    const { isDark, setModo } = useTheme();
    const offset = useSharedValue(isDark ? 30 : 2);

    useEffect(() => {
        offset.value = withSpring(isDark ? 30 : 2, {
            damping: 15,
            stiffness: 120,
        });
    }, [isDark]);

    const estiloCirculo = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: offset.value }],
        };
    });

    const toggleTheme = () => setModo(isDark ? 'claro' : 'oscuro');

    return (
        <Pressable
            onPress={toggleTheme}
            style={[estilos.contenedor, { backgroundColor: isDark ? '#333333' : '#E0E0E0' }]}
        >
            <Animated.View style={[estilos.circulo, estiloCirculo]}>
                <FontAwesome5
                    name={isDark ? 'moon' : 'sun'}
                    size={14}
                    color={isDark ? '#333333' : '#F6C110'}
                    solid
                />
            </Animated.View>
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        width: 60,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
    },
    circulo: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});