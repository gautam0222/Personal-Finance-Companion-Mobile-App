import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { FontSize } from '../../constants/typography';

interface Props {
    uri?: string | null;
    name?: string;
    size?: number;
    style?: ViewStyle;
    // When true, renders a subtle ring border around the avatar
    ring?: boolean;
}

// Deterministic colour from name string — same name always gets same colour
function nameToColor(name: string): { bg: string; text: string } {
    const PALETTES = [
        { bg: 'rgba(99,102,241,0.18)', text: '#818CF8' }, // indigo
        { bg: 'rgba(16,185,129,0.18)', text: '#34D399' }, // emerald
        { bg: 'rgba(244,63,94,0.18)', text: '#FB7185' }, // rose
        { bg: 'rgba(245,158,11,0.18)', text: '#FCD34D' }, // amber
        { bg: 'rgba(14,165,233,0.18)', text: '#38BDF8' }, // sky
        { bg: 'rgba(139,92,246,0.18)', text: '#A78BFA' }, // violet
        { bg: 'rgba(236,72,153,0.18)', text: '#F472B6' }, // pink
        { bg: 'rgba(20,184,166,0.18)', text: '#2DD4BF' }, // teal
    ];
    if (!name) return PALETTES[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return PALETTES[Math.abs(hash) % PALETTES.length];
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return '?';
}

export const Avatar: React.FC<Props> = ({
    uri, name = '', size = 52, style, ring = false,
}) => {
    const { colors } = useTheme();
    const { bg, text } = nameToColor(name);
    const radius = size / 2;
    const fontSize = size > 60 ? FontSize['2xl'] : size > 40 ? FontSize.lg : FontSize.md;

    const container: ViewStyle = {
        width: size,
        height: size,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...(ring && {
            borderWidth: 2,
            borderColor: colors.primaryMutedBorder,
            padding: 2,
        }),
    };

    if (uri) {
        return (
            <View style={[container, ring && { backgroundColor: colors.primaryMuted }, style]}>
                <Image
                    source={{ uri }}
                    style={{
                        width: ring ? size - 8 : size,
                        height: ring ? size - 8 : size,
                        borderRadius: ring ? radius - 4 : radius,
                    }}
                    resizeMode="cover"
                />
            </View>
        );
    }

    return (
        <View style={[container, { backgroundColor: bg }, style]}>
            <Text style={{ fontSize, fontWeight: '700', color: text, letterSpacing: -0.5 }}>
                {getInitials(name) || '?'}
            </Text>
        </View>
    );
};