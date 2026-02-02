import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

export type PlanetPageType = "resources" | "buildings";

interface PageSwitcherProps {
  activePage: PlanetPageType;
  onPageChange: (page: PlanetPageType) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PageSwitcher({ activePage, onPageChange }: PageSwitcherProps) {
  const handlePageChange = (page: PlanetPageType) => {
    if (page !== activePage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPageChange(page);
    }
  };

  const resourcesStyle = useAnimatedStyle(() => ({
    backgroundColor: activePage === "resources" 
      ? withSpring(GameColors.primary, { damping: 20 }) 
      : withSpring("transparent", { damping: 20 }),
    transform: [{ scale: withSpring(activePage === "resources" ? 1 : 0.95) }],
  }));

  const buildingsStyle = useAnimatedStyle(() => ({
    backgroundColor: activePage === "buildings" 
      ? withSpring(GameColors.primary, { damping: 20 }) 
      : withSpring("transparent", { damping: 20 }),
    transform: [{ scale: withSpring(activePage === "buildings" ? 1 : 0.95) }],
  }));

  return (
    <View style={styles.container}>
      <AnimatedPressable
        style={[styles.tab, resourcesStyle]}
        onPress={() => handlePageChange("resources")}
        testID="page-tab-resources"
      >
        <ThemedText style={[
          styles.tabText,
          activePage === "resources" ? styles.activeTabText : null,
        ]}>
          Resources
        </ThemedText>
        <ThemedText style={[
          styles.pageIndicator,
          activePage === "resources" ? styles.activePageIndicator : null,
        ]}>
          1/2
        </ThemedText>
      </AnimatedPressable>

      <AnimatedPressable
        style={[styles.tab, buildingsStyle]}
        onPress={() => handlePageChange("buildings")}
        testID="page-tab-buildings"
      >
        <ThemedText style={[
          styles.tabText,
          activePage === "buildings" ? styles.activeTabText : null,
        ]}>
          Buildings & Fleet
        </ThemedText>
        <ThemedText style={[
          styles.pageIndicator,
          activePage === "buildings" ? styles.activePageIndicator : null,
        ]}>
          2/2
        </ThemedText>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textSecondary,
  },
  activeTabText: {
    color: GameColors.textPrimary,
  },
  pageIndicator: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    color: GameColors.textTertiary,
    backgroundColor: GameColors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  activePageIndicator: {
    backgroundColor: "rgba(255,255,255,0.2)",
    color: GameColors.textPrimary,
  },
});
