import React, { useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  ScrollView,
} from "react-native";
import Animated, {
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
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
const MAP_SIZE = Math.min(SCREEN_WIDTH - 24, 380);

const cityComplete = require("../../assets/images/city-complete.png");

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

interface MapPosition {
  x: number;
  y: number;
  size: number;
  buildingType: BuildingType;
}

const BUILDING_POSITIONS: MapPosition[] = [
  { x: 0.5, y: 0.42, size: 80, buildingType: BUILDING_TYPES.COMMAND_CENTER },
  { x: 0.25, y: 0.22, size: 60, buildingType: BUILDING_TYPES.RESEARCH_LAB },
  { x: 0.75, y: 0.22, size: 60, buildingType: BUILDING_TYPES.FLEET_DOCK },
  { x: 0.18, y: 0.55, size: 60, buildingType: BUILDING_TYPES.SHIPYARD },
  { x: 0.82, y: 0.55, size: 60, buildingType: BUILDING_TYPES.DEFENSE_PLATFORM },
  { x: 0.5, y: 0.78, size: 65, buildingType: BUILDING_TYPES.TRADE_HUB },
];

const BUILDING_COLORS: Record<string, string> = {
  [BUILDING_TYPES.COMMAND_CENTER]: "#00D4FF",
  [BUILDING_TYPES.RESEARCH_LAB]: "#00FF88",
  [BUILDING_TYPES.FLEET_DOCK]: "#FF6B35",
  [BUILDING_TYPES.SHIPYARD]: "#FFB800",
  [BUILDING_TYPES.DEFENSE_PLATFORM]: "#FF3366",
  [BUILDING_TYPES.TRADE_HUB]: "#AA66FF",
};

interface MapBuildingProps {
  position: MapPosition;
  building?: Building;
  onPress: () => void;
}

function MapBuilding({ position, building, onPress }: MapBuildingProps) {
  const glowAnim = useSharedValue(0.3);
  const activityAnim = useSharedValue(1);
  const constructAnim = useSharedValue(0);

  const isEmpty = !building;
  const isConstructing = building?.isConstructing;
  const color = BUILDING_COLORS[position.buildingType];
  const definition = BUILDING_DEFINITIONS[position.buildingType];

  useEffect(() => {
    if (!isEmpty && !isConstructing) {
      glowAnim.value = withRepeat(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      activityAnim.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
    if (isConstructing) {
      constructAnim.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [isEmpty, isConstructing]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const animatedBuildingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activityAnim.value }],
  }));

  const left = position.x * MAP_SIZE - position.size / 2;
  const top = position.y * MAP_SIZE - position.size / 2;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[
        styles.buildingContainer,
        {
          left,
          top,
          width: position.size,
          height: position.size,
        },
      ]}
    >
      {isEmpty ? (
        <Animated.View entering={ZoomIn.duration(300)} style={styles.emptySlot}>
          <View style={[styles.emptyPlatform, { shadowColor: color }]} />
        </Animated.View>
      ) : (
        <Animated.View style={[styles.builtBuilding, animatedBuildingStyle]}>
          <Animated.View
            style={[
              styles.buildingGlow,
              animatedGlowStyle,
              { backgroundColor: color, shadowColor: color },
            ]}
          />
          
          <View style={[styles.levelIndicator, { backgroundColor: color }]}>
            <ThemedText style={styles.levelText}>{building.level}</ThemedText>
          </View>

          {isConstructing ? (
            <View style={styles.constructingOverlay}>
              <Feather name="settings" size={18} color={GameColors.warning} />
            </View>
          ) : null}
        </Animated.View>
      )}

      <View style={styles.labelContainer}>
        <ThemedText style={styles.buildingLabel} numberOfLines={1}>
          {definition.name}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function CityPower({ buildings }: { buildings: Building[] }) {
  const totalPower = useMemo(() => {
    return buildings.reduce((sum, b) => sum + b.level * 100, 0);
  }, [buildings]);

  const builtCount = buildings.length;
  const totalSlots = BUILDING_POSITIONS.length;

  return (
    <View style={styles.powerBar}>
      <View style={styles.powerItem}>
        <Feather name="zap" size={16} color="#FFB800" />
        <ThemedText style={styles.powerValue}>{totalPower.toLocaleString()}</ThemedText>
        <ThemedText style={styles.powerLabel}>Power</ThemedText>
      </View>
      <View style={styles.powerDivider} />
      <View style={styles.powerItem}>
        <Feather name="home" size={16} color="#00D4FF" />
        <ThemedText style={styles.powerValue}>{builtCount}/{totalSlots}</ThemedText>
        <ThemedText style={styles.powerLabel}>Built</ThemedText>
      </View>
      <View style={styles.powerDivider} />
      <View style={styles.powerItem}>
        <Feather name="trending-up" size={16} color="#00FF88" />
        <ThemedText style={styles.powerValue}>
          {builtCount > 0 ? Math.round((builtCount / totalSlots) * 100) : 0}%
        </ThemedText>
        <ThemedText style={styles.powerLabel}>Progress</ThemedText>
      </View>
    </View>
  );
}

export function CityView({
  buildings,
  onBuildingPress,
  onEmptySlotPress,
}: CityViewProps) {
  const findBuilding = (buildingType: BuildingType) => {
    return buildings.find((b) => b.buildingType === buildingType);
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <ThemedText style={styles.title}>Your Colony</ThemedText>
      </Animated.View>

      <CityPower buildings={buildings} />

      <View style={styles.mapContainer}>
        <Image source={cityComplete} style={styles.mapBackground} resizeMode="cover" />
        
        <View style={styles.mapOverlay}>
          {BUILDING_POSITIONS.map((position) => {
            const building = findBuilding(position.buildingType);
            return (
              <MapBuilding
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

      <View style={styles.upgradeHint}>
        <ThemedText style={styles.hintText}>
          Tap buildings to upgrade. Higher levels = bigger buildings!
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
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: "#00FFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  powerBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 20, 40, 0.9)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  powerItem: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  powerValue: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
    marginTop: 2,
  },
  powerLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  powerDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  mapContainer: {
    width: MAP_SIZE,
    height: MAP_SIZE,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  mapBackground: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  buildingContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  emptySlot: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  emptyPlatform: {
    width: "70%",
    height: "70%",
    borderRadius: 100,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 4,
  },
  builtBuilding: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  buildingGlow: {
    position: "absolute",
    width: "110%",
    height: "110%",
    borderRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  buildingImage: {
    width: "100%",
    height: "100%",
  },
  levelIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.5)",
  },
  levelText: {
    fontSize: 10,
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingOverlay: {
    position: "absolute",
    bottom: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  activityLights: {
    position: "absolute",
    bottom: 4,
    flexDirection: "row",
    gap: 3,
  },
  light: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  labelContainer: {
    position: "absolute",
    bottom: -14,
    left: -10,
    right: -10,
    alignItems: "center",
  },
  buildingLabel: {
    fontSize: 8,
    fontFamily: "Inter_500Medium",
    color: GameColors.textPrimary,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textAlign: "center",
  },
  upgradeHint: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  hintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    textAlign: "center",
  },
});
