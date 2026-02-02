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
const PLANET_INNER_SIZE = PLANET_SIZE * 0.9;

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
  metal_mine: { x: 0.22, y: 0.30 },
  crystal_refinery: { x: 0.68, y: 0.25 },
  oxygen_processor: { x: 0.18, y: 0.58 },
  energy_plant: { x: 0.50, y: 0.50 },
  fleet_dock: { x: 0.50, y: 0.22 },
  research_lab: { x: 0.72, y: 0.55 },
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
      { translateY: interpolate(bounce.value, [0, 1], [0, -4]) },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const iconSize = 60;
  const hitSlop = 15;
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
      hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
      testID={`building-icon-${building.buildingType}`}
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

  const offset = (PLANET_SIZE - PLANET_INNER_SIZE) / 2;

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
      </Animated.View>
      
      <Animated.View style={[styles.orbitRing, rotationStyle]}>
        <View style={styles.orbitDot} />
      </Animated.View>
      
      <View style={[styles.buildingsLayer, { left: offset, top: offset }]}>
        {filteredBuildings.map((building) => (
          <BuildingIcon
            key={building.id}
            building={building}
            position={BUILDING_POSITIONS[building.buildingType]}
            containerSize={PLANET_INNER_SIZE}
            onPress={() => onBuildingPress?.(building)}
          />
        ))}
      </View>
      
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
    width: PLANET_INNER_SIZE,
    height: PLANET_INNER_SIZE,
    borderRadius: PLANET_INNER_SIZE / 2,
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
  buildingsLayer: {
    position: "absolute",
    width: PLANET_INNER_SIZE,
    height: PLANET_INNER_SIZE,
  },
  buildingIcon: {
    position: "absolute",
    borderRadius: BorderRadius.md,
    overflow: "visible",
    borderWidth: 3,
    borderColor: GameColors.primary,
    backgroundColor: GameColors.surface,
    shadowColor: GameColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  buildingIconImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.sm,
  },
  levelBadge: {
    position: "absolute",
    bottom: -6,
    right: -6,
    backgroundColor: GameColors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: GameColors.surface,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  constructingIndicator: {
    position: "absolute",
    top: -5,
    left: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GameColors.accent,
    borderWidth: 2,
    borderColor: GameColors.surface,
  },
  tapHint: {
    position: "absolute",
    bottom: -Spacing.xl,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tapHintText: {
    fontSize: 12,
    color: GameColors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
});
