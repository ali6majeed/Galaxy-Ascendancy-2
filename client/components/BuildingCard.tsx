import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  calculateProductionRate,
  formatNumber,
} from "@/constants/gameData";

const buildingImages: Record<string, any> = {
  metal_mine: require("../../assets/images/building-metal-mine.png"),
  crystal_refinery: require("../../assets/images/building-crystal-refinery.png"),
  oxygen_processor: require("../../assets/images/building-oxygen-processor.png"),
  energy_plant: require("../../assets/images/building-energy-plant.png"),
  fleet_dock: require("../../assets/images/building-fleet-dock.png"),
  research_lab: require("../../assets/images/building-research-lab.png"),
};

interface BuildingCardProps {
  buildingType: BuildingType;
  level: number;
  onPress: () => void;
  isConstructing?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BuildingCard({
  buildingType,
  level,
  onPress,
  isConstructing = false,
}: BuildingCardProps) {
  const scale = useSharedValue(1);
  const building = BUILDING_DEFINITIONS[buildingType];
  const productionRate = calculateProductionRate(building, level);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getResourceColor = () => {
    switch (building.resourceType) {
      case "metal":
        return GameColors.metal;
      case "crystal":
        return GameColors.crystal;
      case "oxygen":
        return GameColors.oxygen;
      case "energy":
        return GameColors.energy;
      default:
        return GameColors.primary;
    }
  };

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.imageContainer}>
        <Image
          source={buildingImages[buildingType]}
          style={styles.buildingImage}
          resizeMode="cover"
        />
        {isConstructing ? (
          <View style={styles.constructingOverlay}>
            <Feather name="clock" size={20} color={GameColors.accent} />
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {building.name}
        </ThemedText>
        <View style={styles.levelRow}>
          <ThemedText style={styles.level}>Lv.{level}</ThemedText>
          {productionRate > 0 ? (
            <ThemedText style={[styles.production, { color: getResourceColor() }]}>
              +{formatNumber(productionRate)}/h
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.upgradeIndicator}>
        <Feather name="chevron-right" size={16} color={GameColors.textSecondary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    backgroundColor: GameColors.background,
  },
  buildingImage: {
    width: "100%",
    height: "100%",
  },
  constructingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  level: {
    fontSize: 12,
    color: GameColors.textSecondary,
    fontFamily: "Orbitron_500Medium",
  },
  production: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  upgradeIndicator: {
    padding: Spacing.xs,
  },
});
