import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { LayerType, LAYER_TYPES } from "@/constants/gameData";

interface LayerSwitcherProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
}

const LAYERS = [
  { id: LAYER_TYPES.ORBIT, label: "Orbit", icon: "globe" as const },
  { id: LAYER_TYPES.SURFACE, label: "Surface", icon: "grid" as const },
  { id: LAYER_TYPES.CORE, label: "Core", icon: "zap" as const },
];

export function LayerSwitcher({ activeLayer, onLayerChange }: LayerSwitcherProps) {
  const handlePress = (layer: LayerType) => {
    if (layer !== activeLayer) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onLayerChange(layer);
    }
  };

  return (
    <View style={styles.container}>
      {LAYERS.map((layer) => {
        const isActive = activeLayer === layer.id;
        return (
          <Pressable
            key={layer.id}
            style={[
              styles.tab,
              isActive && styles.activeTab,
            ]}
            onPress={() => handlePress(layer.id)}
          >
            <Feather
              name={layer.icon}
              size={18}
              color={isActive ? GameColors.primary : GameColors.textSecondary}
            />
            <ThemedText
              style={[
                styles.tabLabel,
                isActive && styles.activeLabel,
              ]}
            >
              {layer.label}
            </ThemedText>
          </Pressable>
        );
      })}
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: GameColors.surfaceElevated,
  },
  tabLabel: {
    fontSize: 13,
    color: GameColors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  activeLabel: {
    color: GameColors.primary,
    fontWeight: "600",
  },
});
