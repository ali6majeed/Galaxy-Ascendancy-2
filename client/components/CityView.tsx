import React, { useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  ImageSourcePropType,
  ScrollView,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLS = 3;
const GRID_GAP = 12;
const GRID_PADDING = 16;
const BUILDING_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS);

const cityCenterBg = require("../../assets/images/city-center-bg.png");
const emptyPlatform = require("../../assets/images/empty-platform.png");
const buildingResearchLab = require("../../assets/images/building-research-lab.png");
const buildingFleetDock = require("../../assets/images/building-fleet-dock.png");
const buildingCommandCenter = require("../../assets/images/building-command-center.png");
const buildingShipyard = require("../../assets/images/building-shipyard.png");
const buildingDefensePlatform = require("../../assets/images/building-defense-platform.png");
const buildingTradeHub = require("../../assets/images/building-trade-hub.png");
const buildingMetalMine = require("../../assets/images/building-metal-mine.png");
const buildingCrystalRefinery = require("../../assets/images/building-crystal-refinery.png");
const buildingOxygenProcessor = require("../../assets/images/building-oxygen-processor.png");
const buildingEnergyPlant = require("../../assets/images/building-energy-plant.png");

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

interface CitySlot {
  buildingType: BuildingType;
  slotIndex: number;
}

const CITY_LAYOUT: CitySlot[] = [
  { buildingType: BUILDING_TYPES.COMMAND_CENTER, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.RESEARCH_LAB, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.FLEET_DOCK, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.SHIPYARD, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.DEFENSE_PLATFORM, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.TRADE_HUB, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.METAL_MINE, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.CRYSTAL_REFINERY, slotIndex: 0 },
  { buildingType: BUILDING_TYPES.ENERGY_PLANT, slotIndex: 0 },
];

const BUILDING_IMAGES: Record<string, ImageSourcePropType> = {
  [BUILDING_TYPES.COMMAND_CENTER]: buildingCommandCenter,
  [BUILDING_TYPES.RESEARCH_LAB]: buildingResearchLab,
  [BUILDING_TYPES.FLEET_DOCK]: buildingFleetDock,
  [BUILDING_TYPES.SHIPYARD]: buildingShipyard,
  [BUILDING_TYPES.DEFENSE_PLATFORM]: buildingDefensePlatform,
  [BUILDING_TYPES.TRADE_HUB]: buildingTradeHub,
  [BUILDING_TYPES.METAL_MINE]: buildingMetalMine,
  [BUILDING_TYPES.CRYSTAL_REFINERY]: buildingCrystalRefinery,
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: buildingOxygenProcessor,
  [BUILDING_TYPES.ENERGY_PLANT]: buildingEnergyPlant,
};

const BUILDING_COLORS: Record<string, string> = {
  [BUILDING_TYPES.COMMAND_CENTER]: "#00D4FF",
  [BUILDING_TYPES.RESEARCH_LAB]: "#00FF88",
  [BUILDING_TYPES.FLEET_DOCK]: "#FF6B35",
  [BUILDING_TYPES.SHIPYARD]: "#FFB800",
  [BUILDING_TYPES.DEFENSE_PLATFORM]: "#FF3366",
  [BUILDING_TYPES.TRADE_HUB]: "#AA66FF",
  [BUILDING_TYPES.METAL_MINE]: "#E74C3C",
  [BUILDING_TYPES.CRYSTAL_REFINERY]: "#9B59B6",
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: "#2ECC71",
  [BUILDING_TYPES.ENERGY_PLANT]: "#F1C40F",
};

interface BuildingSlotProps {
  slot: CitySlot;
  building?: Building;
  index: number;
  onPress: () => void;
}

function BuildingSlot({ slot, building, index, onPress }: BuildingSlotProps) {
  const activityGlow = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);

  const isEmpty = !building;
  const isConstructing = building?.isConstructing;
  const color = BUILDING_COLORS[slot.buildingType];
  const definition = BUILDING_DEFINITIONS[slot.buildingType];

  useEffect(() => {
    if (!isEmpty && !isConstructing) {
      activityGlow.value = withRepeat(
        withTiming(0.8, { duration: 2000 + index * 200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
    if (isConstructing) {
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [isEmpty, isConstructing, index]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: activityGlow.value,
  }));

  const animatedScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(300)}
      style={styles.slotWrapper}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={styles.slotPressable}
      >
        <View style={styles.slotContainer}>
          {isEmpty ? (
            <View style={styles.emptySlotContent}>
              <Image
                source={emptyPlatform}
                style={styles.platformImage}
                resizeMode="cover"
              />
              <View style={styles.emptyOverlay}>
                <View style={[styles.addButton, { borderColor: color }]}>
                  <Feather name="plus" size={24} color={color} />
                </View>
                <ThemedText style={[styles.buildText, { color }]}>
                  Build
                </ThemedText>
              </View>
            </View>
          ) : (
            <Animated.View style={[styles.builtSlotContent, animatedScaleStyle]}>
              <Animated.View
                style={[
                  styles.activityGlow,
                  animatedGlowStyle,
                  { backgroundColor: color, shadowColor: color },
                ]}
              />
              <Image
                source={BUILDING_IMAGES[slot.buildingType]}
                style={styles.buildingImage}
                resizeMode="cover"
              />
              <View style={[styles.levelBadge, { backgroundColor: color }]}>
                <ThemedText style={styles.levelText}>
                  Lv.{building.level}
                </ThemedText>
              </View>
              {isConstructing ? (
                <View style={styles.constructingBadge}>
                  <Feather name="loader" size={14} color={GameColors.warning} />
                  <ThemedText style={styles.constructingText}>Building...</ThemedText>
                </View>
              ) : (
                <View style={styles.activeLights}>
                  <View style={[styles.activityDot, { backgroundColor: color }]} />
                  <View style={[styles.activityDot, { backgroundColor: color, opacity: 0.6 }]} />
                  <View style={[styles.activityDot, { backgroundColor: color, opacity: 0.3 }]} />
                </View>
              )}
            </Animated.View>
          )}
        </View>
        <ThemedText style={styles.slotLabel} numberOfLines={2}>
          {definition.name}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

function CityStats({ buildings }: { buildings: Building[] }) {
  const stats = useMemo(() => {
    const builtCount = buildings.length;
    const totalSlots = CITY_LAYOUT.length;
    const constructingCount = buildings.filter((b) => b.isConstructing).length;
    return { builtCount, totalSlots, constructingCount };
  }, [buildings]);

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <ThemedText style={styles.statValue}>{stats.builtCount}/{stats.totalSlots}</ThemedText>
        <ThemedText style={styles.statLabel}>Buildings</ThemedText>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <ThemedText style={[styles.statValue, { color: GameColors.warning }]}>
          {stats.constructingCount}
        </ThemedText>
        <ThemedText style={styles.statLabel}>In Progress</ThemedText>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <ThemedText style={[styles.statValue, { color: "#00FF88" }]}>
          {stats.builtCount > 0 ? "Active" : "Empty"}
        </ThemedText>
        <ThemedText style={styles.statLabel}>Colony Status</ThemedText>
      </View>
    </View>
  );
}

export function CityView({
  buildings,
  onBuildingPress,
  onEmptySlotPress,
}: CityViewProps) {
  const findBuilding = (slot: CitySlot) => {
    return buildings.find(
      (b) => b.buildingType === slot.buildingType && b.slotIndex === slot.slotIndex
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <ThemedText style={styles.viewTitle}>Colony District</ThemedText>
        <ThemedText style={styles.viewSubtitle}>
          Build structures to expand your colony
        </ThemedText>
      </Animated.View>

      <CityStats buildings={buildings} />

      <View style={styles.gridContainer}>
        <Image source={cityCenterBg} style={styles.backgroundImage} resizeMode="cover" />
        <View style={styles.gridOverlay}>
          <View style={styles.grid}>
            {CITY_LAYOUT.map((slot, index) => {
              const building = findBuilding(slot);
              return (
                <BuildingSlot
                  key={`${slot.buildingType}-${slot.slotIndex}`}
                  slot={slot}
                  building={building}
                  index={index}
                  onPress={() => {
                    if (building) {
                      onBuildingPress(building);
                    } else {
                      onEmptySlotPress(slot.buildingType, slot.slotIndex);
                    }
                  }}
                />
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Feather name="info" size={14} color="#00D4FF" />
        <ThemedText style={styles.infoText}>
          Tap empty platforms to construct buildings. More buildings = more activity!
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: "#00FFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
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
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 20, 40, 0.8)",
    marginHorizontal: GRID_PADDING,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.2)",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: "#00D4FF",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  gridContainer: {
    flex: 1,
    marginHorizontal: GRID_PADDING / 2,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  gridOverlay: {
    flex: 1,
    backgroundColor: "rgba(5, 15, 25, 0.7)",
    padding: GRID_PADDING / 2,
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    justifyContent: "center",
    alignContent: "flex-start",
  },
  slotWrapper: {
    width: BUILDING_SIZE,
    alignItems: "center",
  },
  slotPressable: {
    width: "100%",
    alignItems: "center",
  },
  slotContainer: {
    width: BUILDING_SIZE,
    height: BUILDING_SIZE,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: "rgba(10, 25, 40, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptySlotContent: {
    flex: 1,
    position: "relative",
  },
  platformImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  buildText: {
    fontSize: 11,
    fontFamily: "Orbitron_600SemiBold",
    marginTop: 6,
    letterSpacing: 1,
  },
  builtSlotContent: {
    flex: 1,
    position: "relative",
  },
  activityGlow: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: BorderRadius.md + 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  buildingImage: {
    width: "100%",
    height: "100%",
  },
  levelBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.3)",
  },
  levelText: {
    fontSize: 9,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  constructingText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: GameColors.warning,
  },
  activeLights: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  slotLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: GameColors.textPrimary,
    textAlign: "center",
    marginTop: 6,
    maxWidth: BUILDING_SIZE,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: GRID_PADDING,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.15)",
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
});
