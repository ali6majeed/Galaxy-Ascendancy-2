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
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Line, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CITY_SIZE = Math.min(SCREEN_WIDTH * 0.95, 380);
const BUILDING_SPOT_SIZE = 64;

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
  { x: CITY_SIZE * 0.5, y: CITY_SIZE * 0.18, buildingType: BUILDING_TYPES.COMMAND_CENTER },
  { x: CITY_SIZE * 0.2, y: CITY_SIZE * 0.38, buildingType: BUILDING_TYPES.RESEARCH_LAB },
  { x: CITY_SIZE * 0.8, y: CITY_SIZE * 0.38, buildingType: BUILDING_TYPES.FLEET_DOCK },
  { x: CITY_SIZE * 0.2, y: CITY_SIZE * 0.62, buildingType: BUILDING_TYPES.SHIPYARD },
  { x: CITY_SIZE * 0.8, y: CITY_SIZE * 0.62, buildingType: BUILDING_TYPES.DEFENSE_PLATFORM },
  { x: CITY_SIZE * 0.5, y: CITY_SIZE * 0.82, buildingType: BUILDING_TYPES.TRADE_HUB },
];

const CONNECTION_LINES: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [2, 4],
  [1, 2],
  [3, 5], [4, 5],
  [3, 4],
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
  [BUILDING_TYPES.COMMAND_CENTER]: "#00D4FF",
  [BUILDING_TYPES.RESEARCH_LAB]: "#00FF88",
  [BUILDING_TYPES.FLEET_DOCK]: "#FF6B35",
  [BUILDING_TYPES.SHIPYARD]: "#FFB800",
  [BUILDING_TYPES.DEFENSE_PLATFORM]: "#FF3366",
  [BUILDING_TYPES.TRADE_HUB]: "#AA66FF",
};

interface BuildingSpotProps {
  position: BuildingSpotPosition;
  building?: Building;
  onPress: () => void;
}

function BuildingSpot({ position, building, onPress }: BuildingSpotProps) {
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.4);
  const ringAnim = useSharedValue(1);

  const isEmpty = !building;
  const isConstructing = building?.isConstructing;
  const color = BUILDING_COLORS[position.buildingType];
  const definition = BUILDING_DEFINITIONS[position.buildingType];

  useEffect(() => {
    if (isEmpty) {
      pulseAnim.value = withRepeat(
        withTiming(1.08, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      ringAnim.value = withRepeat(
        withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.6, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
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
    transform: [{ scale: ringAnim.value }],
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
      <Animated.View 
        style={[
          styles.buildingSpotRing, 
          animatedGlowStyle, 
          { borderColor: color, shadowColor: color }
        ]} 
      />
      <Animated.View style={[styles.buildingSpot, animatedSpotStyle]}>
        <LinearGradient
          colors={["rgba(20,30,50,0.9)", "rgba(10,15,25,0.95)"]}
          style={styles.spotGradient}
        >
          {isEmpty ? (
            <View style={[styles.emptySpot, { borderColor: color }]}>
              <Feather name="plus" size={22} color={color} />
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
                  <Feather name="loader" size={12} color={GameColors.warning} />
                </View>
              ) : null}
            </View>
          )}
        </LinearGradient>
      </Animated.View>
      <ThemedText style={styles.spotLabel} numberOfLines={1}>
        {isEmpty ? definition.name : definition.name}
      </ThemedText>
    </Pressable>
  );
}

function ConnectionLines() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {CONNECTION_LINES.map(([fromIdx, toIdx], i) => {
        const from = BUILDING_SPOT_POSITIONS[fromIdx];
        const to = BUILDING_SPOT_POSITIONS[toIdx];
        return (
          <Line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="rgba(0, 212, 255, 0.25)"
            strokeWidth={2}
            strokeDasharray="6,4"
          />
        );
      })}
      {BUILDING_SPOT_POSITIONS.map((pos, i) => (
        <Circle
          key={`node-${i}`}
          cx={pos.x}
          cy={pos.y}
          r={4}
          fill="rgba(0, 212, 255, 0.4)"
        />
      ))}
    </Svg>
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
        <ThemedText style={styles.viewTitle}>Colony Base</ThemedText>
        <ThemedText style={styles.viewSubtitle}>
          Command center and core facilities
        </ThemedText>
      </Animated.View>

      <View style={styles.cityWrapper}>
        <View style={styles.cityContainer}>
          <Image source={cityCenterBg} style={styles.cityImage} resizeMode="cover" />
          
          <ConnectionLines />

          {BUILDING_SPOT_POSITIONS.map((position) => {
            const building = facilityBuildings.find(
              (b) => b.buildingType === position.buildingType
            );
            return (
              <BuildingSpot
                key={position.buildingType}
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
            );
          })}
        </View>
        
        <View style={styles.cityBorder} pointerEvents="none" />
      </View>

      <View style={styles.infoBox}>
        <Feather name="zap" size={14} color="#00D4FF" />
        <ThemedText style={styles.infoText}>
          Build and upgrade facilities to unlock new capabilities
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
    marginBottom: Spacing.md,
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: "#00D4FF",
    textAlign: "center",
    textShadowColor: "rgba(0, 212, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  viewSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  cityWrapper: {
    position: "relative",
  },
  cityContainer: {
    width: CITY_SIZE,
    height: CITY_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  cityBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  cityImage: {
    width: "100%",
    height: "100%",
  },
  buildingSpotContainer: {
    position: "absolute",
    width: BUILDING_SPOT_SIZE,
    alignItems: "center",
  },
  buildingSpotRing: {
    position: "absolute",
    width: BUILDING_SPOT_SIZE + 12,
    height: BUILDING_SPOT_SIZE + 12,
    borderRadius: (BUILDING_SPOT_SIZE + 12) / 2,
    top: -6,
    left: -6,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  buildingSpot: {
    width: BUILDING_SPOT_SIZE,
    height: BUILDING_SPOT_SIZE,
    borderRadius: BUILDING_SPOT_SIZE / 2,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  spotGradient: {
    flex: 1,
    borderRadius: BUILDING_SPOT_SIZE / 2,
  },
  emptySpot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BUILDING_SPOT_SIZE / 2,
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
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0A0F14",
  },
  levelText: {
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingIndicator: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GameColors.warning,
  },
  spotLabel: {
    fontSize: 8,
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textPrimary,
    textAlign: "center",
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: BUILDING_SPOT_SIZE + 30,
    letterSpacing: 0.5,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.15)",
  },
  infoText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
});
