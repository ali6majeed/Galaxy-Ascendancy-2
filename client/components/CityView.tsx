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
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
  BUILDING_MAX_SLOTS,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const FACILITY_TYPES: BuildingType[] = [
  BUILDING_TYPES.RESEARCH_LAB,
  BUILDING_TYPES.FLEET_DOCK,
];

const FACILITY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  [BUILDING_TYPES.RESEARCH_LAB]: "cpu",
  [BUILDING_TYPES.FLEET_DOCK]: "navigation",
};

const FACILITY_COLORS: Record<string, string> = {
  [BUILDING_TYPES.RESEARCH_LAB]: "#1ABC9C",
  [BUILDING_TYPES.FLEET_DOCK]: "#E74C3C",
};

interface FacilityCardProps {
  buildingType: BuildingType;
  building?: Building;
  onPress: () => void;
}

function FacilityCard({ buildingType, building, onPress }: FacilityCardProps) {
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.2);
  
  const isEmpty = !building;
  const canUpgrade = building && !building.isConstructing;
  const definition = BUILDING_DEFINITIONS[buildingType];
  const color = FACILITY_COLORS[buildingType];
  const icon = FACILITY_ICONS[buildingType];
  
  useEffect(() => {
    if (canUpgrade) {
      pulseAnim.value = withRepeat(
        withTiming(1.03, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [canUpgrade]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));
  
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={styles.facilityCardContainer}
    >
      {canUpgrade ? (
        <Animated.View style={[styles.facilityGlow, glowStyle, { backgroundColor: color }]} />
      ) : null}
      
      <Animated.View style={[styles.facilityCard, animatedStyle]}>
        {isEmpty ? (
          <View style={[styles.emptyFacility, { borderColor: color }]}>
            <Feather name="plus" size={32} color={color} />
            <ThemedText style={styles.emptyFacilityText}>Build {definition.name}</ThemedText>
            <ThemedText style={styles.emptyFacilityDescription} numberOfLines={2}>
              {definition.description}
            </ThemedText>
          </View>
        ) : (
          <LinearGradient
            colors={[`${color}40`, `${color}20`]}
            style={styles.facilityGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.facilityHeader}>
              <View style={[styles.facilityIconContainer, { backgroundColor: color }]}>
                <Feather name={icon} size={28} color="#FFFFFF" />
              </View>
              <View style={styles.facilityInfo}>
                <ThemedText style={styles.facilityName}>{definition.name}</ThemedText>
                <View style={styles.levelContainer}>
                  <ThemedText style={styles.facilityLevel}>Level {building.level}</ThemedText>
                  {building.isConstructing ? (
                    <View style={styles.constructingBadge}>
                      <Feather name="loader" size={12} color={GameColors.warning} />
                      <ThemedText style={styles.constructingText}>Upgrading</ThemedText>
                    </View>
                  ) : (
                    <View style={styles.upgradeBadge}>
                      <Feather name="arrow-up" size={12} color={GameColors.success} />
                      <ThemedText style={styles.upgradeText}>Tap to upgrade</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <ThemedText style={styles.facilityDescription} numberOfLines={2}>
              {definition.description}
            </ThemedText>
          </LinearGradient>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function CityView({ buildings, onBuildingPress, onEmptySlotPress }: CityViewProps) {
  const facilityBuildings = buildings.filter(b => 
    b.buildingType === BUILDING_TYPES.RESEARCH_LAB ||
    b.buildingType === BUILDING_TYPES.FLEET_DOCK
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <ThemedText style={styles.viewTitle}>City Center</ThemedText>
        <ThemedText style={styles.viewSubtitle}>
          Core facilities and fleet management
        </ThemedText>
      </Animated.View>

      <View style={styles.facilitiesContainer}>
        {FACILITY_TYPES.map((facilityType, index) => {
          const building = facilityBuildings.find(b => b.buildingType === facilityType);
          return (
            <Animated.View
              key={facilityType}
              entering={FadeIn.delay(100 + index * 100).duration(400)}
            >
              <FacilityCard
                buildingType={facilityType}
                building={building}
                onPress={() => {
                  if (building) {
                    onBuildingPress(building);
                  } else {
                    onEmptySlotPress(facilityType, 0);
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
          Resource fields are located around the planet. Go back to planet view to manage them.
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
    marginBottom: Spacing.xl,
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
  facilitiesContainer: {
    gap: Spacing.lg,
  },
  facilityCardContainer: {
    position: "relative",
  },
  facilityGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
    transform: [{ scale: 1.02 }],
  },
  facilityCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  emptyFacility: {
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(0,0,0,0.3)",
    minHeight: 140,
  },
  emptyFacilityText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyFacilityDescription: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: GameColors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  facilityGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 140,
  },
  facilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  facilityIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: 4,
  },
  facilityLevel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textSecondary,
  },
  constructingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  constructingText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: GameColors.warning,
  },
  upgradeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(46, 204, 113, 0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  upgradeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: GameColors.success,
  },
  facilityDescription: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    marginTop: Spacing.md,
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
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    lineHeight: 18,
  },
});
