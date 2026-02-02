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
  interpolateColor,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Ellipse, Line, Defs, RadialGradient, Stop } from "react-native-svg";
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
const CENTER_X = CITY_SIZE / 2;
const CENTER_Y = CITY_SIZE / 2;
const BUILDING_SPOT_SIZE = 56;
const NEXUS_SIZE = 50;

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
  ring: number;
}

const INNER_RING_RADIUS = CITY_SIZE * 0.22;
const OUTER_RING_RADIUS = CITY_SIZE * 0.38;

const BUILDING_SPOT_POSITIONS: BuildingSpotPosition[] = [
  { x: CENTER_X, y: CENTER_Y - INNER_RING_RADIUS, buildingType: BUILDING_TYPES.COMMAND_CENTER, ring: 1 },
  { x: CENTER_X - INNER_RING_RADIUS * 0.87, y: CENTER_Y + INNER_RING_RADIUS * 0.5, buildingType: BUILDING_TYPES.RESEARCH_LAB, ring: 1 },
  { x: CENTER_X + INNER_RING_RADIUS * 0.87, y: CENTER_Y + INNER_RING_RADIUS * 0.5, buildingType: BUILDING_TYPES.FLEET_DOCK, ring: 1 },
  { x: CENTER_X - OUTER_RING_RADIUS * 0.87, y: CENTER_Y - OUTER_RING_RADIUS * 0.5, buildingType: BUILDING_TYPES.SHIPYARD, ring: 2 },
  { x: CENTER_X + OUTER_RING_RADIUS * 0.87, y: CENTER_Y - OUTER_RING_RADIUS * 0.5, buildingType: BUILDING_TYPES.DEFENSE_PLATFORM, ring: 2 },
  { x: CENTER_X, y: CENTER_Y + OUTER_RING_RADIUS, buildingType: BUILDING_TYPES.TRADE_HUB, ring: 2 },
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

function CoreNexus() {
  const pulseAnim = useSharedValue(0);
  const glowAnim = useSharedValue(1);

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glowAnim.value = withRepeat(
      withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowAnim.value }],
    opacity: 0.6 + pulseAnim.value * 0.4,
  }));

  const animatedCoreStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      pulseAnim.value,
      [0, 0.5, 1],
      ["#00D4FF", "#00FFFF", "#00D4FF"]
    );
    return {
      shadowColor: color,
    };
  });

  return (
    <View style={styles.nexusContainer}>
      <Animated.View style={[styles.nexusGlow, animatedGlowStyle]} />
      <Animated.View style={[styles.nexusCore, animatedCoreStyle]}>
        <LinearGradient
          colors={["#00FFFF", "#00D4FF", "#0088FF"]}
          style={styles.nexusGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={styles.nexusInner}>
            <Feather name="zap" size={20} color="#FFFFFF" />
          </View>
        </LinearGradient>
      </Animated.View>
      <ThemedText style={styles.nexusLabel}>CORE NEXUS</ThemedText>
    </View>
  );
}

function OrbitalRings() {
  const rotation1 = useSharedValue(0);
  const rotation2 = useSharedValue(0);

  useEffect(() => {
    rotation1.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
    rotation2.value = withRepeat(
      withTiming(-360, { duration: 45000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="nexusGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#00FFFF" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      <Circle
        cx={CENTER_X}
        cy={CENTER_Y}
        r={NEXUS_SIZE}
        fill="url(#nexusGlow)"
      />

      <Ellipse
        cx={CENTER_X}
        cy={CENTER_Y}
        rx={INNER_RING_RADIUS}
        ry={INNER_RING_RADIUS * 0.4}
        stroke="rgba(0, 212, 255, 0.3)"
        strokeWidth={2}
        strokeDasharray="8,6"
        fill="none"
      />

      <Ellipse
        cx={CENTER_X}
        cy={CENTER_Y}
        rx={OUTER_RING_RADIUS}
        ry={OUTER_RING_RADIUS * 0.4}
        stroke="rgba(170, 102, 255, 0.25)"
        strokeWidth={2}
        strokeDasharray="10,8"
        fill="none"
      />

      {BUILDING_SPOT_POSITIONS.map((pos, i) => (
        <Line
          key={`link-${i}`}
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={pos.x}
          y2={pos.y}
          stroke={`${BUILDING_COLORS[pos.buildingType]}33`}
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}

      {BUILDING_SPOT_POSITIONS.map((pos, i) => (
        <Circle
          key={`node-${i}`}
          cx={pos.x}
          cy={pos.y}
          r={3}
          fill={BUILDING_COLORS[pos.buildingType]}
          opacity={0.6}
        />
      ))}
    </Svg>
  );
}

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
        withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      glowAnim.value = withRepeat(
        withTiming(0.7, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
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
      <Animated.View 
        style={[
          styles.buildingSpotGlow, 
          animatedGlowStyle, 
          { backgroundColor: color, shadowColor: color }
        ]} 
      />
      <Animated.View style={[styles.buildingSpot, animatedSpotStyle, { borderColor: `${color}66` }]}>
        {isEmpty ? (
          <View style={[styles.emptySpot, { borderColor: color }]}>
            <Feather name="plus" size={20} color={color} />
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
                <Feather name="loader" size={11} color={GameColors.warning} />
              </View>
            ) : null}
          </View>
        )}
      </Animated.View>
      <ThemedText style={styles.spotLabel} numberOfLines={1}>
        {definition.name}
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
        <ThemedText style={styles.viewTitle}>Orbital Colony</ThemedText>
        <ThemedText style={styles.viewSubtitle}>
          Floating platforms connected by gravity rings
        </ThemedText>
      </Animated.View>

      <View style={styles.cityWrapper}>
        <View style={styles.cityContainer}>
          <Image source={cityCenterBg} style={styles.cityImage} resizeMode="cover" />
          
          <OrbitalRings />

          <View style={styles.nexusWrapper}>
            <CoreNexus />
          </View>

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
      </View>

      <View style={styles.ringLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#00D4FF" }]} />
          <ThemedText style={styles.legendText}>Inner Ring - Core Systems</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#AA66FF" }]} />
          <ThemedText style={styles.legendText}>Outer Ring - Production</ThemedText>
        </View>
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
    color: "#00FFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  viewSubtitle: {
    fontSize: 11,
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
    borderRadius: CITY_SIZE / 2,
    overflow: "hidden",
    position: "relative",
  },
  cityImage: {
    width: "100%",
    height: "100%",
    borderRadius: CITY_SIZE / 2,
  },
  nexusWrapper: {
    position: "absolute",
    left: CENTER_X - NEXUS_SIZE / 2,
    top: CENTER_Y - NEXUS_SIZE / 2,
  },
  nexusContainer: {
    width: NEXUS_SIZE,
    height: NEXUS_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  nexusGlow: {
    position: "absolute",
    width: NEXUS_SIZE * 1.8,
    height: NEXUS_SIZE * 1.8,
    borderRadius: NEXUS_SIZE,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    left: -NEXUS_SIZE * 0.4,
    top: -NEXUS_SIZE * 0.4,
  },
  nexusCore: {
    width: NEXUS_SIZE,
    height: NEXUS_SIZE,
    borderRadius: NEXUS_SIZE / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
  },
  nexusGradient: {
    flex: 1,
    borderRadius: NEXUS_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nexusInner: {
    width: NEXUS_SIZE - 10,
    height: NEXUS_SIZE - 10,
    borderRadius: (NEXUS_SIZE - 10) / 2,
    backgroundColor: "rgba(0, 50, 80, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  nexusLabel: {
    position: "absolute",
    bottom: -18,
    fontSize: 7,
    fontFamily: "Orbitron_700Bold",
    color: "#00FFFF",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buildingSpotContainer: {
    position: "absolute",
    width: BUILDING_SPOT_SIZE,
    alignItems: "center",
  },
  buildingSpotGlow: {
    position: "absolute",
    width: BUILDING_SPOT_SIZE + 16,
    height: BUILDING_SPOT_SIZE + 16,
    borderRadius: (BUILDING_SPOT_SIZE + 16) / 2,
    top: -8,
    left: -8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  buildingSpot: {
    width: BUILDING_SPOT_SIZE,
    height: BUILDING_SPOT_SIZE,
    borderRadius: BUILDING_SPOT_SIZE / 2,
    overflow: "hidden",
    backgroundColor: "rgba(10, 20, 35, 0.85)",
    borderWidth: 2,
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
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0A0F14",
  },
  levelText: {
    fontSize: 8,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GameColors.warning,
  },
  spotLabel: {
    fontSize: 7,
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textPrimary,
    textAlign: "center",
    marginTop: 5,
    textShadowColor: "rgba(0,0,0,0.95)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    maxWidth: BUILDING_SPOT_SIZE + 24,
    letterSpacing: 0.3,
  },
  ringLegend: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
});
