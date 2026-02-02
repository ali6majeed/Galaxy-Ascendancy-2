import React, { useEffect } from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { formatNumber } from "@/constants/gameData";

interface ResourceItemProps {
  icon: ImageSourcePropType;
  amount: number;
  rate: number;
  color: string;
  isReduced?: boolean;
}

function ResourceItem({ icon, amount, rate, color, isReduced = false }: ResourceItemProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
  }));

  return (
    <View style={[styles.resourceItem, isReduced ? styles.resourceItemReduced : null]}>
      <Image source={icon} style={styles.resourceIcon} resizeMode="contain" />
      <View style={styles.resourceInfo}>
        <ThemedText style={[styles.resourceAmount, { color }]}>
          {formatNumber(amount)}
        </ThemedText>
        <Animated.View style={[styles.rateContainer, animatedStyle]}>
          <ThemedText style={[styles.resourceRate, { color: isReduced ? GameColors.warning : color }]}>
            +{formatNumber(rate)}/h
          </ThemedText>
          {isReduced ? (
            <Feather name="alert-triangle" size={10} color={GameColors.warning} style={styles.warningIcon} />
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

interface ResourceBarProps {
  metal: number;
  crystal: number;
  oxygen: number;
  energyProduction: number;
  energyConsumption: number;
  energyEfficiency: number;
  metalRate: number;
  crystalRate: number;
  oxygenRate: number;
}

export function ResourceBar({
  metal,
  crystal,
  oxygen,
  energyProduction,
  energyConsumption,
  energyEfficiency,
  metalRate,
  crystalRate,
  oxygenRate,
}: ResourceBarProps) {
  const isLowEnergy = energyEfficiency < 100;
  const isEnergyDeficit = energyProduction < energyConsumption;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ResourceItem
          icon={require("../../assets/images/resource-metal.png")}
          amount={metal}
          rate={metalRate}
          color={GameColors.metal}
          isReduced={isLowEnergy}
        />
        <ResourceItem
          icon={require("../../assets/images/resource-crystal.png")}
          amount={crystal}
          rate={crystalRate}
          color={GameColors.crystal}
          isReduced={isLowEnergy}
        />
      </View>
      <View style={styles.row}>
        <ResourceItem
          icon={require("../../assets/images/resource-oxygen.png")}
          amount={oxygen}
          rate={oxygenRate}
          color={GameColors.oxygen}
          isReduced={isLowEnergy}
        />
        <View style={[styles.resourceItem, isEnergyDeficit ? styles.energyDeficit : null]}>
          <Image
            source={require("../../assets/images/resource-energy.png")}
            style={styles.resourceIcon}
            resizeMode="contain"
          />
          <View style={styles.resourceInfo}>
            <ThemedText style={[styles.resourceAmount, { color: isEnergyDeficit ? GameColors.warning : GameColors.energy }]}>
              {formatNumber(energyProduction)}/{formatNumber(energyConsumption)}
            </ThemedText>
            <View style={styles.efficiencyRow}>
              <ThemedText style={[styles.resourceRate, { color: isEnergyDeficit ? GameColors.warning : GameColors.success }]}>
                {energyEfficiency}% efficiency
              </ThemedText>
              {isEnergyDeficit ? (
                <Feather name="zap-off" size={10} color={GameColors.warning} style={styles.warningIcon} />
              ) : null}
            </View>
          </View>
        </View>
      </View>
      
      {isEnergyDeficit ? (
        <View style={styles.warningBanner}>
          <Feather name="alert-triangle" size={14} color={GameColors.warning} />
          <ThemedText style={styles.warningText}>
            Low energy! Buildings at {energyEfficiency}% efficiency. Build more Energy Plants.
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  resourceItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GameColors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  resourceItemReduced: {
    borderWidth: 1,
    borderColor: "rgba(255, 159, 10, 0.3)",
  },
  energyDeficit: {
    borderWidth: 1,
    borderColor: GameColors.warning,
  },
  resourceIcon: {
    width: 28,
    height: 28,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceAmount: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
  },
  rateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  resourceRate: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: "Inter_400Regular",
  },
  efficiencyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningIcon: {
    marginLeft: 4,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 159, 10, 0.15)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: GameColors.warning,
    fontFamily: "Inter_500Medium",
  },
});
