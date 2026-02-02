import React from "react";
import {
  View,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { GameButton } from "@/components/GameButton";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  calculateUpgradeCost,
  calculateProductionRate,
  calculateConstructionTime,
  calculateEnergyConsumption,
  formatTime,
  formatNumber,
} from "@/constants/gameData";

const buildingImages: Record<string, any> = {
  metal_mine: require("../../assets/images/building-metal-mine.png"),
  crystal_refinery: require("../../assets/images/building-crystal-refinery.png"),
  oxygen_processor: require("../../assets/images/building-oxygen-processor.png"),
  energy_plant: require("../../assets/images/building-energy-plant.png"),
  fleet_dock: require("../../assets/images/building-fleet-dock.png"),
  research_lab: require("../../assets/images/building-research-lab.png"),
};

interface BuildingDetailModalProps {
  visible: boolean;
  onClose: () => void;
  buildingType: BuildingType | null;
  level: number;
  resources: {
    metal: number;
    crystal: number;
    oxygen: number;
    energy: number;
    energyCapacity: number;
  };
  onUpgrade: (buildingType: BuildingType) => void;
  isUpgrading?: boolean;
}

export function BuildingDetailModal({
  visible,
  onClose,
  buildingType,
  level,
  resources,
  onUpgrade,
  isUpgrading = false,
}: BuildingDetailModalProps) {
  const insets = useSafeAreaInsets();

  if (!buildingType) return null;

  const building = BUILDING_DEFINITIONS[buildingType];
  const upgradeCost = calculateUpgradeCost(building, level + 1);
  const currentProduction = calculateProductionRate(building, level);
  const nextProduction = calculateProductionRate(building, level + 1);
  const constructionTime = calculateConstructionTime(building, level + 1);
  const currentEnergy = calculateEnergyConsumption(building, level);
  const nextEnergy = calculateEnergyConsumption(building, level + 1);

  const canAfford =
    resources.metal >= upgradeCost.metal &&
    resources.crystal >= upgradeCost.crystal &&
    resources.oxygen >= upgradeCost.oxygen;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleUpgrade = () => {
    if (canAfford && !isUpgrading) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpgrade(buildingType);
    }
  };

  const getResourceColor = () => {
    switch (building.resourceType) {
      case "metal":
        return GameColors.metal;
      case "crystal":
        return GameColors.crystal;
      case "oxygen":
        return GameColors.oxygen;
      case "energy":
        return GameColors.energy;
      default:
        return GameColors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayPress} onPress={handleClose} />
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(150)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.modalContainer, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <View style={styles.handle} />
          
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Feather name="x" size={24} color={GameColors.textSecondary} />
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.imageContainer}>
                <Image
                  source={buildingImages[buildingType]}
                  style={styles.buildingImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.headerInfo}>
                <ThemedText style={styles.buildingName}>{building.name}</ThemedText>
                <View style={styles.levelBadge}>
                  <ThemedText style={styles.levelText}>Level {level}</ThemedText>
                </View>
              </View>
            </View>

            <ThemedText style={styles.description}>{building.description}</ThemedText>

            {building.baseProductionRate > 0 ? (
              <View style={styles.statsSection}>
                <ThemedText style={styles.sectionTitle}>Production</ThemedText>
                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Feather name="trending-up" size={14} color={getResourceColor()} />
                    <ThemedText style={styles.statLabelText}>Current</ThemedText>
                  </View>
                  <ThemedText style={[styles.statValue, { color: getResourceColor() }]}>
                    +{formatNumber(currentProduction)}/h
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Feather name="arrow-up" size={14} color={GameColors.success} />
                    <ThemedText style={styles.statLabelText}>After Upgrade</ThemedText>
                  </View>
                  <ThemedText style={[styles.statValue, { color: GameColors.success }]}>
                    +{formatNumber(nextProduction)}/h
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {building.energyConsumption > 0 ? (
              <View style={styles.statsSection}>
                <ThemedText style={styles.sectionTitle}>Energy Usage</ThemedText>
                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Feather name="zap" size={14} color={GameColors.energy} />
                    <ThemedText style={styles.statLabelText}>Current</ThemedText>
                  </View>
                  <ThemedText style={styles.statValue}>
                    {currentEnergy} units
                  </ThemedText>
                </View>
                <View style={styles.statRow}>
                  <View style={styles.statLabel}>
                    <Feather name="zap" size={14} color={GameColors.warning} />
                    <ThemedText style={styles.statLabelText}>After Upgrade</ThemedText>
                  </View>
                  <ThemedText style={[styles.statValue, { color: GameColors.warning }]}>
                    {nextEnergy} units
                  </ThemedText>
                </View>
              </View>
            ) : null}

            <View style={styles.upgradeSection}>
              <ThemedText style={styles.sectionTitle}>Upgrade to Level {level + 1}</ThemedText>
              
              <View style={styles.costContainer}>
                <CostItem
                  icon="box"
                  label="Metal"
                  cost={upgradeCost.metal}
                  available={resources.metal}
                  color={GameColors.metal}
                />
                <CostItem
                  icon="hexagon"
                  label="Crystal"
                  cost={upgradeCost.crystal}
                  available={resources.crystal}
                  color={GameColors.crystal}
                />
                {upgradeCost.oxygen > 0 ? (
                  <CostItem
                    icon="wind"
                    label="Oxygen"
                    cost={upgradeCost.oxygen}
                    available={resources.oxygen}
                    color={GameColors.oxygen}
                  />
                ) : null}
              </View>

              <View style={styles.timeRow}>
                <Feather name="clock" size={16} color={GameColors.textSecondary} />
                <ThemedText style={styles.timeText}>
                  Build Time: {formatTime(constructionTime)}
                </ThemedText>
              </View>

              <GameButton
                title={isUpgrading ? "Starting..." : canAfford ? "Upgrade" : "Not Enough Resources"}
                onPress={handleUpgrade}
                disabled={!canAfford || isUpgrading}
                variant={canAfford ? "primary" : "secondary"}
                icon={canAfford && !isUpgrading ? "arrow-up-circle" : undefined}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

interface CostItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  cost: number;
  available: number;
  color: string;
}

function CostItem({ icon, label, cost, available, color }: CostItemProps) {
  const canAfford = available >= cost;
  
  return (
    <View style={styles.costItem}>
      <View style={styles.costHeader}>
        <Feather name={icon} size={14} color={color} />
        <ThemedText style={styles.costLabel}>{label}</ThemedText>
      </View>
      <ThemedText
        style={[
          styles.costValue,
          { color: canAfford ? GameColors.textPrimary : GameColors.danger },
        ]}
      >
        {formatNumber(cost)}
      </ThemedText>
      <ThemedText style={styles.costAvailable}>
        Have: {formatNumber(available)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  overlayPress: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: GameColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: GameColors.textTertiary,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: GameColors.background,
  },
  buildingImage: {
    width: "100%",
    height: "100%",
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.sm,
  },
  buildingName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  levelBadge: {
    backgroundColor: GameColors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  levelText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textPrimary,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: GameColors.textSecondary,
    marginBottom: Spacing.xl,
  },
  statsSection: {
    backgroundColor: GameColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
    marginBottom: Spacing.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  statLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statLabelText: {
    fontSize: 13,
    color: GameColors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  upgradeSection: {
    backgroundColor: GameColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  costContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  costItem: {
    flex: 1,
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    alignItems: "center",
  },
  costHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  costLabel: {
    fontSize: 11,
    color: GameColors.textSecondary,
  },
  costValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Orbitron_600SemiBold",
  },
  costAvailable: {
    fontSize: 10,
    color: GameColors.textTertiary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeText: {
    fontSize: 13,
    color: GameColors.textSecondary,
  },
});
