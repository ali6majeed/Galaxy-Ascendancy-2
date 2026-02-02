import React from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

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
  formatNumber,
  formatTime,
} from "@/constants/gameData";
import { apiRequest } from "@/lib/query-client";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type BuildingDetailRouteProp = RouteProp<RootStackParamList, "BuildingDetail">;

const buildingImages: Record<string, any> = {
  metal_mine: require("../../assets/images/building-metal-mine.png"),
  crystal_refinery: require("../../assets/images/building-crystal-refinery.png"),
  oxygen_processor: require("../../assets/images/building-oxygen-processor.png"),
  energy_plant: require("../../assets/images/building-energy-plant.png"),
  fleet_dock: require("../../assets/images/building-fleet-dock.png"),
  research_lab: require("../../assets/images/building-research-lab.png"),
};

interface ResourceIconProps {
  type: "metal" | "crystal" | "oxygen";
  amount: number;
}

function ResourceCost({ type, amount }: ResourceIconProps) {
  const icons = {
    metal: require("../../assets/images/resource-metal.png"),
    crystal: require("../../assets/images/resource-crystal.png"),
    oxygen: require("../../assets/images/resource-oxygen.png"),
  };

  const colors = {
    metal: GameColors.metal,
    crystal: GameColors.crystal,
    oxygen: GameColors.oxygen,
  };

  return (
    <View style={styles.costItem}>
      <Image source={icons[type]} style={styles.costIcon} resizeMode="contain" />
      <ThemedText style={[styles.costAmount, { color: colors[type] }]}>
        {formatNumber(amount)}
      </ThemedText>
    </View>
  );
}

interface PlayerResources {
  metal: number;
  crystal: number;
  oxygen: number;
  energy: number;
  energyCapacity: number;
}

export default function BuildingDetailScreen() {
  const route = useRoute<BuildingDetailRouteProp>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();

  const { buildingType, level } = route.params;
  const building = BUILDING_DEFINITIONS[buildingType as BuildingType];
  const nextLevel = level + 1;

  const upgradeCost = calculateUpgradeCost(building, nextLevel);
  const currentProduction = calculateProductionRate(building, level);
  const nextProduction = calculateProductionRate(building, nextLevel);
  const constructionTime = calculateConstructionTime(building, nextLevel);
  const energyConsumption = calculateEnergyConsumption(building, nextLevel);

  const { data: resources } = useQuery<PlayerResources>({
    queryKey: ["/api/player/resources"],
  });

  const canAfford =
    resources &&
    resources.metal >= upgradeCost.metal &&
    resources.crystal >= upgradeCost.crystal &&
    resources.oxygen >= upgradeCost.oxygen;

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/buildings/upgrade", {
        buildingType,
      });
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/player"] });
      navigation.goBack();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleUpgrade = () => {
    if (canAfford) {
      upgradeMutation.mutate();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: insets.bottom + Spacing.xl,
        paddingHorizontal: Spacing.lg,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.imageContainer}>
        <Image
          source={buildingImages[buildingType]}
          style={styles.buildingImage}
          resizeMode="cover"
        />
        <View style={styles.levelBadge}>
          <ThemedText style={styles.levelText}>Lv.{level}</ThemedText>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <ThemedText style={styles.buildingName}>{building.name}</ThemedText>
        <ThemedText style={styles.buildingDescription}>{building.description}</ThemedText>
      </Animated.View>

      {currentProduction > 0 ? (
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statsCard}>
          <ThemedText style={styles.cardTitle}>Production</ThemedText>
          <View style={styles.productionRow}>
            <View style={styles.productionItem}>
              <ThemedText style={styles.productionLabel}>Current</ThemedText>
              <ThemedText style={styles.productionValue}>
                +{formatNumber(currentProduction)}/h
              </ThemedText>
            </View>
            <Feather name="arrow-right" size={20} color={GameColors.success} />
            <View style={styles.productionItem}>
              <ThemedText style={styles.productionLabel}>After Upgrade</ThemedText>
              <ThemedText style={[styles.productionValue, { color: GameColors.success }]}>
                +{formatNumber(nextProduction)}/h
              </ThemedText>
            </View>
          </View>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statsCard}>
        <ThemedText style={styles.cardTitle}>Upgrade to Level {nextLevel}</ThemedText>

        <View style={styles.costRow}>
          <ResourceCost type="metal" amount={upgradeCost.metal} />
          <ResourceCost type="crystal" amount={upgradeCost.crystal} />
          {upgradeCost.oxygen > 0 ? (
            <ResourceCost type="oxygen" amount={upgradeCost.oxygen} />
          ) : null}
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Feather name="clock" size={16} color={GameColors.textSecondary} />
            <ThemedText style={styles.infoText}>{formatTime(constructionTime)}</ThemedText>
          </View>
          {energyConsumption > 0 ? (
            <View style={styles.infoItem}>
              <Feather name="zap" size={16} color={GameColors.energy} />
              <ThemedText style={[styles.infoText, { color: GameColors.energy }]}>
                -{energyConsumption}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.buttonContainer}>
        <GameButton
          onPress={handleUpgrade}
          disabled={!canAfford || upgradeMutation.isPending}
          variant="primary"
          size="large"
        >
          {upgradeMutation.isPending ? "Upgrading..." : "Upgrade Now"}
        </GameButton>
        {!canAfford && resources ? (
          <ThemedText style={styles.insufficientText}>Insufficient resources</ThemedText>
        ) : null}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1.5,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: GameColors.surface,
    marginBottom: Spacing.xl,
  },
  buildingImage: {
    width: "100%",
    height: "100%",
  },
  levelBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  levelText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.primary,
  },
  buildingName: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  buildingDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: GameColors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginBottom: Spacing.xl,
  },
  statsCard: {
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textSecondary,
    marginBottom: Spacing.md,
  },
  productionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productionItem: {
    flex: 1,
    alignItems: "center",
  },
  productionLabel: {
    fontSize: 12,
    color: GameColors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginBottom: Spacing.xs,
  },
  productionValue: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textPrimary,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  costItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  costIcon: {
    width: 32,
    height: 32,
  },
  costAmount: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing["2xl"],
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
    color: GameColors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  buttonContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  insufficientText: {
    fontSize: 13,
    color: GameColors.danger,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
