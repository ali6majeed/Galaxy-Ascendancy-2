import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, BorderRadius, Spacing } from "@/constants/theme";

interface GameButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "accent" | "danger";
  size?: "small" | "medium" | "large";
  icon?: ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GameButton({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "medium",
  icon,
}: GameButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }
  };

  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress?.();
    }
  };

  const getColors = (): [string, string] => {
    if (disabled) return [GameColors.surfaceElevated, GameColors.surface];
    switch (variant) {
      case "primary":
        return [GameColors.primary, GameColors.primaryDark];
      case "secondary":
        return [GameColors.surfaceElevated, GameColors.surface];
      case "accent":
        return ["#FF9F0A", "#E68A00"];
      case "danger":
        return [GameColors.danger, "#CC2F26"];
      default:
        return [GameColors.primary, GameColors.primaryDark];
    }
  };

  const getHeight = () => {
    switch (size) {
      case "small":
        return 36;
      case "medium":
        return 48;
      case "large":
        return 56;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 13;
      case "medium":
        return 15;
      case "large":
        return 17;
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
    >
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.button,
          { height: getHeight() },
          disabled && styles.disabled,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <ThemedText
          style={[
            styles.buttonText,
            { fontSize: getFontSize() },
            variant === "secondary" && !disabled && styles.secondaryText,
          ]}
        >
          {children}
        </ThemedText>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
  },
  buttonText: {
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  secondaryText: {
    color: GameColors.textSecondary,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: Spacing.sm,
  },
});
