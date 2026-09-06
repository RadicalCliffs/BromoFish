import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';
import { palette, type } from '../theme/tokens';

/**
 * The save control, and the app's signature gesture: tapping folds the corner of the page down.
 *
 * The fold is a real transform rather than a cross-fade between two icons, because the whole
 * point of the brand is that saving something feels like a physical act. Users who have asked
 * their OS to reduce motion get the same state change without the spring.
 */
export function DogearButton({
  saved,
  onToggle,
  size = 30,
  showLabel = false,
}: {
  saved: boolean;
  onToggle: () => void;
  size?: number;
  showLabel?: boolean;
}) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const fold = useSharedValue(saved ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    fold.value = reduceMotion
      ? withTiming(saved ? 1 : 0, { duration: 120 })
      : withSpring(saved ? 1 : 0, { damping: 12, stiffness: 220, mass: 0.6 });
  }, [saved, fold, reduceMotion]);

  const foldStyle = useAnimatedStyle(() => ({
    opacity: fold.value,
    transform: [
      // Origin is the corner itself, so the triangle appears to hinge rather than grow.
      { translateX: size * 0.16 },
      { translateY: -size * 0.16 },
      { scale: 0.6 + fold.value * 0.4 },
      { rotate: `${(1 - fold.value) * -55}deg` },
      { translateX: -size * 0.16 },
      { translateY: size * 0.16 },
    ],
  }));

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  const handle = () => {
    Haptics.impactAsync(saved ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!reduceMotion) {
      pop.value = withSequence(withTiming(0.86, { duration: 90 }), withSpring(1, { damping: 9, stiffness: 260 }));
    }
    onToggle();
  };

  return (
    <Pressable
      onPress={handle}
      accessibilityRole="switch"
      accessibilityState={{ checked: saved }}
      accessibilityLabel={saved ? 'Saved. Tap to remove from your saves.' : 'Save this. Tap to save it.'}
      hitSlop={12}
      style={styles.press}
    >
      <Animated.View style={popStyle}>
        <View style={{ width: size, height: size }}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
              d="M5 2.6h8.6L19.4 8.4V20.4a1.4 1.4 0 0 1-1.4 1.4H5a1.4 1.4 0 0 1-1.4-1.4V4a1.4 1.4 0 0 1 1.4-1.4Z"
              fill={saved ? theme.saved : 'transparent'}
              stroke={saved ? theme.saved : theme.text}
              strokeWidth={1.9}
              strokeLinejoin="round"
            />
          </Svg>
          <Animated.View style={[styles.fold, { width: size, height: size }, foldStyle]} pointerEvents="none">
            <Svg width={size} height={size} viewBox="0 0 24 24">
              <Path d="M13.6 2.6 19.4 8.4h-4.4a1.4 1.4 0 0 1-1.4-1.4V2.6Z" fill={theme.saved} />
              <Path d="M13.6 2.6 19.4 8.4h-4.4a1.4 1.4 0 0 1-1.4-1.4V2.6Z" fill={palette.black} opacity={0.4} />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
      {showLabel && (
        <Text style={[type.overline, { color: saved ? theme.savedText : theme.textMuted, marginTop: 4 }]}>
          {saved ? 'SAVED' : 'SAVE'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 },
  fold: { position: 'absolute', top: 0, left: 0 },
});
