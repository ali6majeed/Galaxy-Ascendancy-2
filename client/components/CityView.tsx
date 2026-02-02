import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  ImageSourcePropType,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CITY_SIZE = Math.min(SCREEN_WIDTH * 0.95, 400);
const BUILDING_SPOT_SIZE = 58;

const cityCenterBg = require("../../assets/images/city-center-bg.png");
const buildingResearchLab = require("../../assets/images/building-research-lab.png");
const buildingFleetDock = require("../../assets/images/building-fleet-dock.png");
const buildingCommandCenter = require("../../assets/images/building-command-center.png");
const buildingShipyard = require("../../assets/images/building-shipyard.png");
const buildingDefensePlatform = require("../../assets/images/building-defense-platform.png");
const buildingTradeHub = require("../../assets/images/building-trade-hub.png");

interface Building {
  id: string;
  buildingType: BuildingType;
  slotIndex: number;
  level: number;
  isConstructing: boolean;
}

interface CityViewProps {
  buildings: Building[];
  onBuildingPress: (building: Building) => void;
  onEmptySlotPress: (buildingType: BuildingType, slotIndex: number) => void;
}

interface BuildingSpotPosition {
  x: number;
  y: number;
  buildingType: BuildingType;
}

const BUILDING_SPOT_POSITIONS: BuildingSpotPosition[] = [
  { x: CITY_SIZE * 0.5, y: CITY_SIZE * 0.22, buildingType: BUILDING_TYPES.COMMAND_CENTER },
  { x: CITY_SIZE * 0.22, y: CITY_SIZE * 0.42, buildingType: BUILDING_TYPES.RESEARCH_LAB },
  { x: CITY_SIZE * 0.78, y: CITY_SIZE * 0.42, buildingType: BUILDING_TYPES.FLEET_DOCK },
  { x: CITY_SIZE * 0.28, y: CITY_SIZE * 0.68, buildingType: BUILDING_TYPES.SHIPYARD },
  { x: CITY_SIZE * 0.72, y: CITY_SIZE * 0.68, buildingType: BUILDING_TYPES.DEFENSE_PLATFORM },
  { x: CITY_SIZE * 0.5, y: CITY_SIZE * 0.82, buildingType: BUILDING_TYPES.TRADE_HUB },
];

const BUILDING_IMAGES: Record<string, ImageSourcePropType> = {
  [BUILDING_TYPES.COMMAND_CENTER]: buildingCommandCenter,
  [BUILDING_TYPES.RESEARCH_LAB]: buildingResearchLab,
  [BUILDING_TYPES.FLEET_DOCK]: buildingFleetDock,
  [BUILDING_TYPES.SHIPYARD]: buildingShipyard,
  [BUILDING_TYPES.DEFENSE_PLATFORM]: buildingDefensePlatform,
  [BUILDING_TYPES.TRADE_HUB]: buildingTradeHub,
};

const BUILDING_COLORS: Record<string, string> = {
  [BUILDING_TYPES.COMMAND_CENTER]: "#3498DB",
  [BUILDING_TYPES.RESEARCH_LAB]: "#1ABC9C",
  [BUILDING_TYPES.FLEET_DOCK]: "#E74C3C",
  [BUILDING_TYPES.SHIPYARD]: "#F39C12",
  [BUILDING_TYPES.DEFENSE_PLATFORM]: "#9B59B6",
  [BUILDING_TYPES.TRADE_HUB]: "#F1C40F",
};

interface BuildingSpotProps {
  position: BuildingSpotPosition;
  building?: Building;
  onPress: () => void;
}

function BuildingSpot({ position, building, onPress }: BuildingSpotProps) {
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.3);

  const isEmpty = !building;
  const isConstructing = building?.isConstructing;
  const color = BUILDING_COLORS[position.buildingType];
  const definition = BUILDING_DEFINITIONS[position.buildingType];

  useEffect(() => {
    if (isEmpty) {
      pulseAnim.value = withRepeat(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (!isConstructing) {
      pulseAnim.value = withRepeat(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isEmpty, isConstructing]);

  const animatedSpotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[
        styles.buildingSpotContainer,
        {
          left: position.x - BUILDING_SPOT_SIZE / 2,
          top: position.y - BUILDING_SPOT_SIZE / 2,
        },
      ]}
    >
      <Animated.View style={[styles.buildingSpotGlow, animatedGlowStyle, { backgroundColor: color }]} />
      <Animated.View style={[styles.buildingSpot, animatedSpotStyle]}>
        {isEmpty ? (
          <View style={[styles.emptySpot, { borderColor: color }]}>
            <Feather name="plus" size={24} color={color} />
          </View>
        ) : (
          <View style={styles.buildingImageContainer}>
            <Image
              source={BUILDING_IMAGES[position.buildingType]}
              style={styles.buildingImage}
              resizeMode="cover"
            />
            <View style={[styles.levelBadge, { backgroundColor: color }]}>
              <ThemedText style={styles.levelText}>{building.level}</ThemedText>
            </View>
            {isConstructing ? (
              <View style={styles.constructingIndicator}>
                <Feather name="loader" size={14} color={GameColors.warning} />
              </View>
            ) : null}
          </View>
        )}
      </Animated.View>
      <ThemedText style={styles.spotLabel} numberOfLines={1}>
        {isEmpty ? `Build ${definition.name}` : definition.name}
      </ThemedText>
    </Pressable>
  );
}

export function CityView({
  buildings,
  onBuildingPress,
  onEmptySlotPress,
}: CityViewProps) {
  const facilityBuildings = buildings.filter(
    (b) =>
      b.buildingType === BUILDING_TYPES.COMMAND_CENTER ||
      b.buildingType === BUILDING_TYPES.RESEARCH_LAB ||
      b.buildingType === BUILDING_TYPES.FLEET_DOCK ||
      b.buildingType === BUILDING_TYPES.SHIPYARD ||
      b.buildingType === BUILDING_TYPES.DEFENSE_PLATFORM ||
      b.buildingType === BUILDING_TYPES.TRADE_HUB
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <ThemedText style={styles.viewTitle}>City Center</ThemedText>
        <ThemedText style={styles.viewSubtitle}>
          Core facilities and fleet management
        </ThemedText>
      </Animated.View>

      <View style={styles.cityContainer}>
        <Image source={cityCenterBg} style={styles.cityImage} resizeMode="cover" />

        {BUILDING_SPOT_POSITIONS.map((position, index) => {
          const building = facilityBuildings.find(
            (b) => b.buildingType === position.buildingType
          );
          return (
            <Animated.View
              key={position.buildingType}
              entering={FadeIn.delay(200 + index * 100).duration(400)}
              style={StyleSheet.absoluteFill}
            >
              <BuildingSpot
                position={position}
                building={building}
                onPress={() => {
                  if (building) {
                    onBuildingPress(building);
                  } else {
                    onEmptySlotPress(position.buildingType, 0);
                  }
                }}
              />
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.infoBox}>
        <Feather name="info" size={16} color={GameColors.textSecondary} />
        <ThemedText style={styles.infoText}>
          Tap a building spot to construct or upgrade facilities. Resource fields are on the planet surface.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
    textAlign: "center",
  },
  viewSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  cityContainer: {
    width: CITY_SIZE,
    height: CITY_SIZE,
    borderRadius: CITY_SIZE / 2,
    overflow: "hidden",
    position: "relative",
  },
  cityImage: {
    width: "100%",
    height: "100%",
    borderRadius: CITY_SIZE / 2,
  },
  buildingSpotContainer: {
    position: "absolute",
    width: BUILDING_SPOT_SIZE,
    alignItems: "center",
  },
  buildingSpotGlow: {
    position: "absolute",
    width: BUILDING_SPOT_SIZE + 10,
    height: BUILDING_SPOT_SIZE + 10,
    borderRadius: (BUILDING_SPOT_SIZE + 10) / 2,
    top: -5,
    left: -5,
  },
  buildingSpot: {
    width: BUILDING_SPOT_SIZE,
    height: BUILDING_SPOT_SIZE,
    borderRadius: BUILDING_SPOT_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  emptySpot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BUILDING_SPOT_SIZE / 2,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  buildingImageContainer: {
    flex: 1,
    position: "relative",
  },
  buildingImage: {
    width: "100%",
    height: "100%",
    borderRadius: BUILDING_SPOT_SIZE / 2,
  },
  levelBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: GameColors.background,
  },
  levelText: {
    fontSize: 10,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  spotLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: GameColors.textPrimary,
    textAlign: "center",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: BUILDING_SPOT_SIZE + 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: "rgba(10, 132, 255, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.2)",
    marginHorizontal: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    lineHeight: 18,
  },
});
