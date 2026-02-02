import React, { useEffect } from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { formatNumber } from "@/constants/gameData";

interface ResourceItemProps {
  icon: ImageSourcePropType;
  amount: number;
  rate: number;
  color: string;
}

function ResourceItem({ icon, amount, rate, color }: ResourceItemProps) {
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
    <View style={styles.resourceItem}>
      <Image source={icon} style={styles.resourceIcon} resizeMode="contain" />
      <View style={styles.resourceInfo}>
        <ThemedText style={[styles.resourceAmount, { color }]}>
          {formatNumber(amount)}
        </ThemedText>
        <Animated.View style={animatedStyle}>
          <ThemedText style={[styles.resourceRate, { color }]}>
            +{formatNumber(rate)}/h
          </ThemedText>
        </Animated.View>
      </View>
    </View>
  );
}

interface ResourceBarProps {
  metal: number;
  crystal: number;
  oxygen: number;
  energy: number;
  energyCapacity: number;
  metalRate: number;
  crystalRate: number;
  oxygenRate: number;
  energyRate: number;
}

export function ResourceBar({
  metal,
  crystal,
  oxygen,
  energy,
  energyCapacity,
  metalRate,
  crystalRate,
  oxygenRate,
  energyRate,
}: ResourceBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ResourceItem
          icon={require("../../assets/images/resource-metal.png")}
          amount={metal}
          rate={metalRate}
          color={GameColors.metal}
        />
        <ResourceItem
          icon={require("../../assets/images/resource-crystal.png")}
          amount={crystal}
          rate={crystalRate}
          color={GameColors.crystal}
        />
      </View>
      <View style={styles.row}>
        <ResourceItem
          icon={require("../../assets/images/resource-oxygen.png")}
          amount={oxygen}
          rate={oxygenRate}
          color={GameColors.oxygen}
        />
        <View style={styles.resourceItem}>
          <Image
            source={require("../../assets/images/resource-energy.png")}
            style={styles.resourceIcon}
            resizeMode="contain"
          />
          <View style={styles.resourceInfo}>
            <ThemedText style={[styles.resourceAmount, { color: GameColors.energy }]}>
              {formatNumber(energy)}/{formatNumber(energyCapacity)}
            </ThemedText>
            <ThemedText style={[styles.resourceRate, { color: GameColors.energy }]}>
              +{formatNumber(energyRate)}/h
            </ThemedText>
          </View>
        </View>
      </View>
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
  resourceRate: {
    fontSize: 10,
    opacity: 0.7,
    fontFamily: "Inter_400Regular",
  },
});
