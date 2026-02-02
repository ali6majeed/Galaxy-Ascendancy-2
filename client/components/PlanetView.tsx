import React, { useEffect } from "react";
import { View, StyleSheet, Image, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { LayerType, LAYER_TYPES, BuildingType, BUILDING_DEFINITIONS } from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLANET_SIZE = SCREEN_WIDTH * 0.85;

interface Building {
  id: string;
  buildingType: BuildingType;
  level: number;
  isConstructing: boolean;
}

interface PlanetViewProps {
  activeLayer: LayerType;
  buildings?: Building[];
  onBuildingPress?: (building: Building) => void;
}

const layerImages = {
  [LAYER_TYPES.ORBIT]: require("../../assets/images/planet-orbit-layer.png"),
  [LAYER_TYPES.SURFACE]: require("../../assets/images/planet-surface-layer.png"),
  [LAYER_TYPES.CORE]: require("../../assets/images/planet-core-layer.png"),
};

const buildingImages: Record<string, any> = {
  metal_mine: require("../../assets/images/building-metal-mine.png"),
  crystal_refinery: require("../../assets/images/building-crystal-refinery.png"),
  oxygen_processor: require("../../assets/images/building-oxygen-processor.png"),
  energy_plant: require("../../assets/images/building-energy-plant.png"),
  fleet_dock: require("../../assets/images/building-fleet-dock.png"),
  research_lab: require("../../assets/images/building-research-lab.png"),
};

const BUILDING_POSITIONS: Record<BuildingType, { x: number; y: number }> = {
  metal_mine: { x: 0.25, y: 0.35 },
  crystal_refinery: { x: 0.65, y: 0.30 },
  oxygen_processor: { x: 0.20, y: 0.60 },
  energy_plant: { x: 0.50, y: 0.55 },
  fleet_dock: { x: 0.50, y: 0.25 },
  research_lab: { x: 0.70, y: 0.55 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BuildingIconProps {
  building: Building;
  onPress: () => void;
  position: { x: number; y: number };
  containerSize: number;
}

function BuildingIcon({ building, onPress, position, containerSize }: BuildingIconProps) {
  const scale = useSharedValue(1);
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: interpolate(bounce.value, [0, 1], [0, -3]) },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const iconSize = containerSize * 0.18;
  const left = position.x * containerSize - iconSize / 2;
  const top = position.y * containerSize - iconSize / 2;

  return (
    <AnimatedPressable
      style={[
        styles.buildingIcon,
        animatedStyle,
        {
          width: iconSize,
          height: iconSize,
          left,
          top,
        },
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Image
        source={buildingImages[building.buildingType]}
        style={styles.buildingIconImage}
        resizeMode="cover"
      />
      <View style={styles.levelBadge}>
        <ThemedText style={styles.levelText}>{building.level}</ThemedText>
      </View>
      {building.isConstructing ? (
        <View style={styles.constructingIndicator} />
      ) : null}
    </AnimatedPressable>
  );
}

export function PlanetView({ activeLayer, buildings = [], onBuildingPress }: PlanetViewProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.02]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.9, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1.1, 1.2]) }],
  }));

  const getGlowColor = () => {
    switch (activeLayer) {
      case LAYER_TYPES.ORBIT:
        return GameColors.primary;
      case LAYER_TYPES.SURFACE:
        return GameColors.success;
      case LAYER_TYPES.CORE:
        return GameColors.energy;
      default:
        return GameColors.primary;
    }
  };

  const filteredBuildings = buildings.filter((b) => {
    const definition = BUILDING_DEFINITIONS[b.buildingType];
    return definition?.layer === activeLayer;
  });

  const planetContainerSize = PLANET_SIZE * 0.9;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowOuter, glowStyle, { backgroundColor: getGlowColor() }]} />
      <Animated.View style={[styles.planetContainer, pulseStyle]}>
        <Animated.Image
          key={activeLayer}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          source={layerImages[activeLayer]}
          style={[styles.planetImage]}
          resizeMode="contain"
        />
        
        {filteredBuildings.map((building) => (
          <BuildingIcon
            key={building.id}
            building={building}
            position={BUILDING_POSITIONS[building.buildingType]}
            containerSize={planetContainerSize}
            onPress={() => onBuildingPress?.(building)}
          />
        ))}
      </Animated.View>
      <Animated.View style={[styles.orbitRing, rotationStyle]}>
        <View style={styles.orbitDot} />
      </Animated.View>
      
      {filteredBuildings.length > 0 ? (
        <View style={styles.tapHint}>
          <ThemedText style={styles.tapHintText}>Tap buildings to upgrade</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  glowOuter: {
    position: "absolute",
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    borderRadius: PLANET_SIZE / 2,
  },
  planetContainer: {
    width: PLANET_SIZE * 0.9,
    height: PLANET_SIZE * 0.9,
    borderRadius: PLANET_SIZE * 0.45,
    overflow: "hidden",
    backgroundColor: GameColors.background,
  },
  planetImage: {
    width: "100%",
    height: "100%",
  },
  orbitRing: {
    position: "absolute",
    width: PLANET_SIZE * 1.1,
    height: PLANET_SIZE * 1.1,
    borderRadius: PLANET_SIZE * 0.55,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.3)",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  orbitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GameColors.primary,
    marginTop: -4,
  },
  buildingIcon: {
    position: "absolute",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: GameColors.primary,
    backgroundColor: GameColors.surface,
  },
  buildingIconImage: {
    width: "100%",
    height: "100%",
  },
  levelBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: GameColors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  constructingIndicator: {
    position: "absolute",
    top: -3,
    left: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: GameColors.accent,
    borderWidth: 1,
    borderColor: GameColors.surface,
  },
  tapHint: {
    position: "absolute",
    bottom: -Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tapHintText: {
    fontSize: 11,
    color: GameColors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
});
