import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { BuildingCard } from "@/components/BuildingCard";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  BUILDING_TYPES,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Building {
  id: string;
  buildingType: BuildingType;
  level: number;
  isConstructing: boolean;
}

interface CityViewProps {
  buildings: Building[];
  onBuildingPress: (building: Building) => void;
  onEmptySlotPress: (buildingType: BuildingType) => void;
}

const ALL_BUILDING_TYPES: BuildingType[] = [
  BUILDING_TYPES.METAL_MINE,
  BUILDING_TYPES.CRYSTAL_REFINERY,
  BUILDING_TYPES.OXYGEN_PROCESSOR,
  BUILDING_TYPES.ENERGY_PLANT,
  BUILDING_TYPES.RESEARCH_LAB,
  BUILDING_TYPES.FLEET_DOCK,
];

interface EmptyBuildingSlotProps {
  buildingType: BuildingType;
  onPress: () => void;
}

function EmptyBuildingSlot({ buildingType, onPress }: EmptyBuildingSlotProps) {
  const definition = BUILDING_DEFINITIONS[buildingType];
  
  return (
    <View style={styles.emptySlot}>
      <View style={styles.emptySlotContent}>
        <View style={styles.emptyIconContainer}>
          <ThemedText style={styles.emptyPlusIcon}>+</ThemedText>
        </View>
        <View style={styles.emptySlotInfo}>
          <ThemedText style={styles.emptySlotTitle}>{definition.name}</ThemedText>
          <ThemedText style={styles.emptySlotDescription} numberOfLines={1}>
            {definition.description}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.buildButton} onPress={onPress}>
        BUILD
      </ThemedText>
    </View>
  );
}

export function CityView({ buildings, onBuildingPress, onEmptySlotPress }: CityViewProps) {
  const existingBuildingTypes = new Set(buildings.map(b => b.buildingType));
  
  const emptySlots = ALL_BUILDING_TYPES.filter(
    (type) => !existingBuildingTypes.has(type)
  );

  const resourceBuildingTypes: BuildingType[] = [
    BUILDING_TYPES.METAL_MINE, 
    BUILDING_TYPES.CRYSTAL_REFINERY, 
    BUILDING_TYPES.OXYGEN_PROCESSOR, 
    BUILDING_TYPES.ENERGY_PLANT
  ];
  
  const facilityBuildingTypes: BuildingType[] = [
    BUILDING_TYPES.RESEARCH_LAB, 
    BUILDING_TYPES.FLEET_DOCK
  ];

  const resourceBuildings = buildings.filter(b => 
    resourceBuildingTypes.includes(b.buildingType)
  );

  const facilityBuildings = buildings.filter(b => 
    facilityBuildingTypes.includes(b.buildingType)
  );

  const emptyResourceSlots = emptySlots.filter(type =>
    resourceBuildingTypes.includes(type)
  );

  const emptyFacilitySlots = emptySlots.filter(type =>
    facilityBuildingTypes.includes(type)
  );

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(0).duration(300)}>
        <ThemedText style={styles.viewTitle}>City Overview</ThemedText>
        <ThemedText style={styles.viewSubtitle}>
          Manage all your structures and facilities
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Resource Buildings</ThemedText>
        <View style={styles.buildingList}>
          {resourceBuildings.map((building, index) => (
            <Animated.View
              key={building.id}
              entering={FadeInDown.delay(150 + index * 50).duration(300)}
            >
              <BuildingCard
                buildingType={building.buildingType}
                level={building.level}
                isConstructing={building.isConstructing}
                onPress={() => onBuildingPress(building)}
              />
            </Animated.View>
          ))}
          {emptyResourceSlots.map((buildingType, index) => (
            <Animated.View
              key={buildingType}
              entering={FadeInDown.delay(150 + (resourceBuildings.length + index) * 50).duration(300)}
            >
              <EmptyBuildingSlot
                buildingType={buildingType}
                onPress={() => onEmptySlotPress(buildingType)}
              />
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Facilities & Fleet</ThemedText>
        <View style={styles.buildingList}>
          {facilityBuildings.map((building, index) => (
            <Animated.View
              key={building.id}
              entering={FadeInDown.delay(350 + index * 50).duration(300)}
            >
              <BuildingCard
                buildingType={building.buildingType}
                level={building.level}
                isConstructing={building.isConstructing}
                onPress={() => onBuildingPress(building)}
              />
            </Animated.View>
          ))}
          {emptyFacilitySlots.map((buildingType, index) => (
            <Animated.View
              key={buildingType}
              entering={FadeInDown.delay(350 + (facilityBuildings.length + index) * 50).duration(300)}
            >
              <EmptyBuildingSlot
                buildingType={buildingType}
                onPress={() => onEmptySlotPress(buildingType)}
              />
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {buildings.length === 0 && emptySlots.length === 0 ? (
        <EmptyState
          image={require("../../assets/images/empty-construction.png")}
          title="No Buildings Available"
          description="Something went wrong. Please refresh."
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textPrimary,
    marginBottom: Spacing.md,
  },
  buildingList: {
    gap: Spacing.sm,
  },
  emptySlot: {
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.textTertiary,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emptySlotContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: GameColors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GameColors.textTertiary,
  },
  emptyPlusIcon: {
    fontSize: 24,
    fontWeight: "700",
    color: GameColors.textSecondary,
    fontFamily: "Orbitron_700Bold",
  },
  emptySlotInfo: {
    flex: 1,
  },
  emptySlotTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textSecondary,
  },
  emptySlotDescription: {
    fontSize: 11,
    color: GameColors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  buildButton: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
});
