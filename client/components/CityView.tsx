import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Pressable } from "react-native";
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

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
  BUILDING_MAX_SLOTS,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAP_SIZE = Math.min(SCREEN_WIDTH - 40, SCREEN_HEIGHT * 0.65);
const BUILDING_SIZE = 56;
const SMALL_BUILDING_SIZE = 48;

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

interface BuildingPosition {
  x: number;
  y: number;
  size: number;
}

const BUILDING_ICONS: Record<BuildingType, keyof typeof Feather.glyphMap> = {
  [BUILDING_TYPES.METAL_MINE]: "box",
  [BUILDING_TYPES.CRYSTAL_REFINERY]: "hexagon",
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: "wind",
  [BUILDING_TYPES.ENERGY_PLANT]: "zap",
  [BUILDING_TYPES.RESEARCH_LAB]: "cpu",
  [BUILDING_TYPES.FLEET_DOCK]: "navigation",
};

const BUILDING_COLORS: Record<BuildingType, string> = {
  [BUILDING_TYPES.METAL_MINE]: "#8B7355",
  [BUILDING_TYPES.CRYSTAL_REFINERY]: "#9B59B6",
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: "#3498DB",
  [BUILDING_TYPES.ENERGY_PLANT]: "#F39C12",
  [BUILDING_TYPES.RESEARCH_LAB]: "#1ABC9C",
  [BUILDING_TYPES.FLEET_DOCK]: "#E74C3C",
};

function getBuildingPositions(): Record<string, BuildingPosition> {
  const centerX = MAP_SIZE / 2;
  const centerY = MAP_SIZE / 2;
  const positions: Record<string, BuildingPosition> = {};
  
  const metalPositions = [
    { x: centerX - 90, y: centerY - 100 },
    { x: centerX - 30, y: centerY - 130 },
    { x: centerX + 30, y: centerY - 100 },
    { x: centerX + 90, y: centerY - 130 },
  ];
  metalPositions.forEach((pos, i) => {
    positions[`metal_mine-${i}`] = { ...pos, size: BUILDING_SIZE };
  });
  
  const crystalPositions = [
    { x: centerX + 80, y: centerY - 40 },
    { x: centerX + 110, y: centerY + 20 },
    { x: centerX + 80, y: centerY + 80 },
    { x: centerX + 110, y: centerY + 140 },
  ];
  crystalPositions.forEach((pos, i) => {
    positions[`crystal_refinery-${i}`] = { ...pos, size: BUILDING_SIZE };
  });
  
  const oxygenPositions = [
    { x: centerX - 100, y: centerY - 30 },
    { x: centerX - 130, y: centerY + 30 },
    { x: centerX - 100, y: centerY + 90 },
    { x: centerX - 130, y: centerY + 150 },
    { x: centerX - 60, y: centerY + 120 },
    { x: centerX - 60, y: centerY + 180 },
  ];
  oxygenPositions.forEach((pos, i) => {
    positions[`oxygen_processor-${i}`] = { ...pos, size: SMALL_BUILDING_SIZE };
  });
  
  const energyPositions = [
    { x: centerX - 40, y: centerY - 40 },
    { x: centerX + 20, y: centerY - 20 },
    { x: centerX - 20, y: centerY + 30 },
    { x: centerX + 40, y: centerY + 50 },
  ];
  energyPositions.forEach((pos, i) => {
    positions[`energy_plant-${i}`] = { ...pos, size: BUILDING_SIZE };
  });
  
  positions[`research_lab-0`] = { x: centerX - 30, y: centerY + 100, size: BUILDING_SIZE + 8 };
  positions[`fleet_dock-0`] = { x: centerX + 30, y: centerY + 160, size: BUILDING_SIZE + 8 };
  
  return positions;
}

interface BuildingNodeProps {
  buildingType: BuildingType;
  slotIndex: number;
  building?: Building;
  position: BuildingPosition;
  onPress: () => void;
  canUpgrade: boolean;
}

function BuildingNode({ buildingType, slotIndex, building, position, onPress, canUpgrade }: BuildingNodeProps) {
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.3);
  
  useEffect(() => {
    if (canUpgrade && building) {
      pulseAnim.value = withRepeat(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [canUpgrade, building]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));
  
  const icon = BUILDING_ICONS[buildingType];
  const color = BUILDING_COLORS[buildingType];
  const definition = BUILDING_DEFINITIONS[buildingType];
  const isEmpty = !building;
  
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.buildingNode,
        {
          left: position.x - position.size / 2,
          top: position.y - position.size / 2,
          width: position.size,
          height: position.size,
        },
      ]}
    >
      {canUpgrade && building ? (
        <Animated.View style={[styles.glowEffect, glowStyle, { backgroundColor: color }]} />
      ) : null}
      
      <Animated.View style={[styles.buildingInner, isEmpty ? styles.emptyBuilding : null, animatedStyle]}>
        {isEmpty ? (
          <View style={[styles.emptyBuildingContent, { borderColor: color }]}>
            <Feather name="plus" size={20} color={color} />
          </View>
        ) : (
          <LinearGradient
            colors={[color, `${color}99`]}
            style={styles.buildingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={icon} size={position.size > 50 ? 22 : 18} color="#FFFFFF" />
            <View style={styles.levelBadge}>
              <ThemedText style={styles.levelText}>{building.level}</ThemedText>
            </View>
            {building.isConstructing ? (
              <View style={styles.constructingIndicator}>
                <Feather name="loader" size={12} color="#FFF" />
              </View>
            ) : null}
          </LinearGradient>
        )}
      </Animated.View>
      
      {canUpgrade && building ? (
        <View style={styles.upgradeArrow}>
          <Feather name="arrow-up" size={12} color={GameColors.success} />
        </View>
      ) : null}
    </Pressable>
  );
}

interface SlotItem {
  buildingType: BuildingType;
  slotIndex: number;
  building?: Building;
  position: BuildingPosition;
}

function getAllSlots(buildings: Building[]): SlotItem[] {
  const positions = getBuildingPositions();
  const slots: SlotItem[] = [];
  
  const buildingTypes: BuildingType[] = [
    BUILDING_TYPES.METAL_MINE,
    BUILDING_TYPES.CRYSTAL_REFINERY,
    BUILDING_TYPES.OXYGEN_PROCESSOR,
    BUILDING_TYPES.ENERGY_PLANT,
    BUILDING_TYPES.RESEARCH_LAB,
    BUILDING_TYPES.FLEET_DOCK,
  ];
  
  for (const buildingType of buildingTypes) {
    const maxSlots = BUILDING_MAX_SLOTS[buildingType];
    const existingBuildings = buildings.filter(b => b.buildingType === buildingType);
    
    for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
      const building = existingBuildings.find(b => b.slotIndex === slotIndex);
      const posKey = `${buildingType}-${slotIndex}`;
      const position = positions[posKey];
      
      if (position) {
        slots.push({ buildingType, slotIndex, building, position });
      }
    }
  }
  
  return slots;
}

export function CityView({ buildings, onBuildingPress, onEmptySlotPress }: CityViewProps) {
  const slots = getAllSlots(buildings);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <ThemedText style={styles.viewTitle}>City Overview</ThemedText>
        <ThemedText style={styles.viewSubtitle}>
          Tap buildings to upgrade or construct new ones
        </ThemedText>
      </Animated.View>

      <View style={styles.mapContainer}>
        <View style={[styles.cityMap, { width: MAP_SIZE, height: MAP_SIZE }]}>
          <View style={styles.mapBackground}>
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, styles.gridLineHorizontal]} />
            <View style={styles.centerMarker} />
          </View>
          
          <View style={styles.zoneLabelContainer}>
            <View style={[styles.zoneLabel, { top: 10, left: MAP_SIZE / 2 - 40 }]}>
              <ThemedText style={[styles.zoneLabelText, { color: BUILDING_COLORS[BUILDING_TYPES.METAL_MINE] }]}>
                MINING
              </ThemedText>
            </View>
            <View style={[styles.zoneLabel, { top: MAP_SIZE / 2 - 10, right: 5 }]}>
              <ThemedText style={[styles.zoneLabelText, { color: BUILDING_COLORS[BUILDING_TYPES.CRYSTAL_REFINERY] }]}>
                CRYSTAL
              </ThemedText>
            </View>
            <View style={[styles.zoneLabel, { top: MAP_SIZE / 2 - 10, left: 5 }]}>
              <ThemedText style={[styles.zoneLabelText, { color: BUILDING_COLORS[BUILDING_TYPES.OXYGEN_PROCESSOR] }]}>
                OXYGEN
              </ThemedText>
            </View>
            <View style={[styles.zoneLabel, { bottom: 30, left: MAP_SIZE / 2 - 30 }]}>
              <ThemedText style={[styles.zoneLabelText, { color: BUILDING_COLORS[BUILDING_TYPES.FLEET_DOCK] }]}>
                FLEET
              </ThemedText>
            </View>
          </View>
          
          {slots.map((slot, index) => (
            <Animated.View
              key={`${slot.buildingType}-${slot.slotIndex}`}
              entering={FadeIn.delay(100 + index * 20).duration(300)}
              style={styles.nodeWrapper}
            >
              <BuildingNode
                buildingType={slot.buildingType}
                slotIndex={slot.slotIndex}
                building={slot.building}
                position={slot.position}
                canUpgrade={!!slot.building && !slot.building.isConstructing}
                onPress={() => {
                  if (slot.building) {
                    onBuildingPress(slot.building);
                  } else {
                    onEmptySlotPress(slot.buildingType, slot.slotIndex);
                  }
                }}
              />
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendRow}>
          {Object.entries(BUILDING_COLORS).slice(0, 3).map(([type, color]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <ThemedText style={styles.legendText}>
                {BUILDING_DEFINITIONS[type as BuildingType].name.split(" ")[0]}
              </ThemedText>
            </View>
          ))}
        </View>
        <View style={styles.legendRow}>
          {Object.entries(BUILDING_COLORS).slice(3).map(([type, color]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <ThemedText style={styles.legendText}>
                {BUILDING_DEFINITIONS[type as BuildingType].name.split(" ")[0]}
              </ThemedText>
            </View>
          ))}
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
    color: GameColors.textPrimary,
    textAlign: "center",
  },
  viewSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  mapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cityMap: {
    position: "relative",
    backgroundColor: "rgba(20, 25, 35, 0.8)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: GameColors.textTertiary,
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  gridLine: {
    position: "absolute",
    width: 1,
    height: "80%",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  gridLineHorizontal: {
    width: "80%",
    height: 1,
  },
  centerMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  zoneLabelContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  zoneLabel: {
    position: "absolute",
  },
  zoneLabelText: {
    fontSize: 9,
    fontFamily: "Orbitron_600SemiBold",
    opacity: 0.6,
    letterSpacing: 1,
  },
  nodeWrapper: {
    position: "absolute",
  },
  buildingNode: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  glowEffect: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.md,
    transform: [{ scale: 1.4 }],
  },
  buildingInner: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  emptyBuilding: {
    backgroundColor: "transparent",
  },
  emptyBuildingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  buildingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  levelBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingIndicator: {
    position: "absolute",
    top: 2,
    left: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 2,
    borderRadius: 4,
  },
  upgradeArrow: {
    position: "absolute",
    top: -8,
    right: -4,
    backgroundColor: "rgba(46, 204, 113, 0.9)",
    borderRadius: 10,
    padding: 2,
  },
  legend: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: "rgba(20, 25, 35, 0.6)",
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
