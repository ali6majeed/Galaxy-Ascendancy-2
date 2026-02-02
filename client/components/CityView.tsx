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

const RESOURCE_BUILDING_TYPES: BuildingType[] = [
  BUILDING_TYPES.METAL_MINE,
  BUILDING_TYPES.CRYSTAL_REFINERY,
  BUILDING_TYPES.OXYGEN_PROCESSOR,
  BUILDING_TYPES.ENERGY_PLANT,
];

const FACILITY_BUILDING_TYPES: BuildingType[] = [
  BUILDING_TYPES.RESEARCH_LAB,
  BUILDING_TYPES.FLEET_DOCK,
];

interface EmptyBuildingSlotProps {
  buildingType: BuildingType;
  slotIndex: number;
  totalSlots: number;
  onPress: () => void;
}

function EmptyBuildingSlot({ buildingType, slotIndex, totalSlots, onPress }: EmptyBuildingSlotProps) {
  const definition = BUILDING_DEFINITIONS[buildingType];
  const slotLabel = totalSlots > 1 ? ` #${slotIndex + 1}` : "";
  
  return (
    <View style={styles.emptySlot}>
      <View style={styles.emptySlotContent}>
        <View style={styles.emptyIconContainer}>
          <ThemedText style={styles.emptyPlusIcon}>+</ThemedText>
        </View>
        <View style={styles.emptySlotInfo}>
          <ThemedText style={styles.emptySlotTitle}>{definition.name}{slotLabel}</ThemedText>
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

interface SlotItem {
  type: "building" | "empty";
  buildingType: BuildingType;
  slotIndex: number;
  building?: Building;
}

function getSlotItems(buildingTypes: BuildingType[], buildings: Building[]): SlotItem[] {
  const slots: SlotItem[] = [];
  
  for (const buildingType of buildingTypes) {
    const maxSlots = BUILDING_MAX_SLOTS[buildingType];
    const existingBuildings = buildings.filter(b => b.buildingType === buildingType);
    const existingSlotIndexes = new Set(existingBuildings.map(b => b.slotIndex));
    
    for (let slotIndex = 0; slotIndex < maxSlots; slotIndex++) {
      const building = existingBuildings.find(b => b.slotIndex === slotIndex);
      if (building) {
        slots.push({ type: "building", buildingType, slotIndex, building });
      } else {
        slots.push({ type: "empty", buildingType, slotIndex });
      }
    }
  }
  
  return slots;
}

export function CityView({ buildings, onBuildingPress, onEmptySlotPress }: CityViewProps) {
  const resourceSlots = getSlotItems(RESOURCE_BUILDING_TYPES, buildings);
  const facilitySlots = getSlotItems(FACILITY_BUILDING_TYPES, buildings);

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
          {resourceSlots.map((slot, index) => (
            <Animated.View
              key={`${slot.buildingType}-${slot.slotIndex}`}
              entering={FadeInDown.delay(150 + index * 30).duration(300)}
            >
              {slot.type === "building" && slot.building ? (
                <BuildingCard
                  buildingType={slot.building.buildingType}
                  level={slot.building.level}
                  isConstructing={slot.building.isConstructing}
                  slotIndex={slot.slotIndex}
                  totalSlots={BUILDING_MAX_SLOTS[slot.buildingType]}
                  onPress={() => onBuildingPress(slot.building!)}
                />
              ) : (
                <EmptyBuildingSlot
                  buildingType={slot.buildingType}
                  slotIndex={slot.slotIndex}
                  totalSlots={BUILDING_MAX_SLOTS[slot.buildingType]}
                  onPress={() => onEmptySlotPress(slot.buildingType, slot.slotIndex)}
                />
              )}
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Facilities & Fleet</ThemedText>
        <View style={styles.buildingList}>
          {facilitySlots.map((slot, index) => (
            <Animated.View
              key={`${slot.buildingType}-${slot.slotIndex}`}
              entering={FadeInDown.delay(350 + index * 30).duration(300)}
            >
              {slot.type === "building" && slot.building ? (
                <BuildingCard
                  buildingType={slot.building.buildingType}
                  level={slot.building.level}
                  isConstructing={slot.building.isConstructing}
                  slotIndex={slot.slotIndex}
                  totalSlots={BUILDING_MAX_SLOTS[slot.buildingType]}
                  onPress={() => onBuildingPress(slot.building!)}
                />
              ) : (
                <EmptyBuildingSlot
                  buildingType={slot.buildingType}
                  slotIndex={slot.slotIndex}
                  totalSlots={BUILDING_MAX_SLOTS[slot.buildingType]}
                  onPress={() => onEmptySlotPress(slot.buildingType, slot.slotIndex)}
                />
              )}
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {resourceSlots.length === 0 && facilitySlots.length === 0 ? (
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
