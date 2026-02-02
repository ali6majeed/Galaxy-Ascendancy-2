import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { formatTime } from "@/constants/gameData";

interface QueueItem {
  id: string;
  buildingType: string;
  buildingName: string;
  targetLevel: number;
  completesAt: number;
}

interface ConstructionQueueProps {
  items: QueueItem[];
  onPress?: () => void;
}

export function ConstructionQueue({ items, onPress }: ConstructionQueueProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const progress = useSharedValue(0);

  const activeItem = items.length > 0 ? items[0] : null;

  useEffect(() => {
    if (!activeItem) return;

    const updateTime = () => {
      const remaining = Math.max(0, activeItem.completesAt - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeItem?.completesAt]);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + progress.value * 0.4,
  }));

  if (!activeItem) {
    return null;
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Animated.View style={[styles.iconBackground, shimmerStyle]}>
          <Feather name="tool" size={16} color={GameColors.accent} />
        </Animated.View>
      </View>
      <View style={styles.info}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {activeItem.buildingName} Lv.{activeItem.targetLevel}
        </ThemedText>
        <ThemedText style={styles.time}>{formatTime(timeRemaining)}</ThemedText>
      </View>
      {items.length > 1 ? (
        <View style={styles.badge}>
          <ThemedText style={styles.badgeText}>+{items.length - 1}</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 159, 10, 0.3)",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255, 159, 10, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(255, 159, 10, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    color: GameColors.textPrimary,
  },
  time: {
    fontSize: 12,
    fontFamily: "Orbitron_500Medium",
    color: GameColors.accent,
  },
  badge: {
    backgroundColor: GameColors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: GameColors.textSecondary,
  },
});
