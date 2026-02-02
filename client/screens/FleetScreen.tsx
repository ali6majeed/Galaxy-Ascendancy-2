import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  SHIP_TYPES,
  SHIP_DEFINITIONS,
  ShipType,
  formatNumber,
  formatTime,
} from "@/constants/gameData";
import { apiRequest } from "@/lib/query-client";

interface Ship {
  id: string;
  shipType: ShipType;
  quantity: number;
}

interface ShipQueueItem {
  id: string;
  shipType: ShipType;
  quantity: number;
  completesAt: number;
}

interface Building {
  id: string;
  buildingType: string;
  level: number;
}

interface PlayerResources {
  metal: number;
  crystal: number;
  oxygen: number;
}

const SHIP_ICONS: Record<ShipType, string> = {
  [SHIP_TYPES.FIGHTER]: "zap",
  [SHIP_TYPES.BOMBER]: "target",
  [SHIP_TYPES.CRUISER]: "anchor",
  [SHIP_TYPES.BATTLESHIP]: "shield",
  [SHIP_TYPES.CARRIER]: "box",
  [SHIP_TYPES.TRANSPORT]: "truck",
};

const SHIP_COLORS: Record<ShipType, string> = {
  [SHIP_TYPES.FIGHTER]: "#00D4FF",
  [SHIP_TYPES.BOMBER]: "#FF6B35",
  [SHIP_TYPES.CRUISER]: "#00FF88",
  [SHIP_TYPES.BATTLESHIP]: "#FFB800",
  [SHIP_TYPES.CARRIER]: "#AA66FF",
  [SHIP_TYPES.TRANSPORT]: "#FF3366",
};

export default function FleetScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [buildQuantity, setBuildQuantity] = useState(1);

  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ["/api/player/ships"],
  });

  const { data: shipQueue = [] } = useQuery<ShipQueueItem[]>({
    queryKey: ["/api/player/ship-queue"],
    refetchInterval: 1000,
  });

  const { data: buildings = [] } = useQuery<Building[]>({
    queryKey: ["/api/player/buildings"],
  });

  const { data: resources } = useQuery<PlayerResources>({
    queryKey: ["/api/player/resources"],
  });

  const buildMutation = useMutation({
    mutationFn: async ({ shipType, quantity }: { shipType: ShipType; quantity: number }) => {
      const response = await apiRequest("POST", "/api/ships/build", { shipType, quantity });
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/player/ships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/ship-queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/resources"] });
      setSelectedShip(null);
      setBuildQuantity(1);
    },
    onError: (error) => {
      console.error("Build failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/player/ships"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/player/ship-queue"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/player/buildings"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/player/resources"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const shipyard = buildings.find((b) => b.buildingType === "shipyard");
  const shipyardLevel = shipyard?.level || 0;

  const getShipCount = (shipType: ShipType): number => {
    const ship = ships.find((s) => s.shipType === shipType);
    return ship?.quantity || 0;
  };

  const canBuildShip = (shipType: ShipType): boolean => {
    const def = SHIP_DEFINITIONS[shipType];
    return shipyardLevel >= def.requiredShipyardLevel;
  };

  const canAffordShip = (shipType: ShipType, quantity: number): boolean => {
    if (!resources) return false;
    const def = SHIP_DEFINITIONS[shipType];
    return (
      resources.metal >= def.baseCost.metal * quantity &&
      resources.crystal >= def.baseCost.crystal * quantity &&
      resources.oxygen >= def.baseCost.oxygen * quantity
    );
  };

  const handleBuild = () => {
    if (selectedShip) {
      buildMutation.mutate({ shipType: selectedShip, quantity: buildQuantity });
    }
  };

  const totalFleetPower = ships.reduce((sum, ship) => {
    const def = SHIP_DEFINITIONS[ship.shipType];
    return sum + (def.attack + def.defense) * ship.quantity;
  }, 0);

  const totalShips = ships.reduce((sum, ship) => sum + ship.quantity, 0);

  if (shipyardLevel === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
      >
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="anchor" size={48} color={GameColors.textSecondary} />
          </View>
          <ThemedText style={styles.emptyTitle}>Hangar Empty</ThemedText>
          <ThemedText style={styles.emptyDescription}>
            Build a Shipyard in the City Center to start constructing your fleet.
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GameColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{totalShips}</ThemedText>
            <ThemedText style={styles.statLabel}>Total Ships</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{formatNumber(totalFleetPower)}</ThemedText>
            <ThemedText style={styles.statLabel}>Fleet Power</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>Lv.{shipyardLevel}</ThemedText>
            <ThemedText style={styles.statLabel}>Shipyard</ThemedText>
          </View>
        </Animated.View>

        {shipQueue.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <ThemedText style={styles.sectionTitle}>Building Queue</ThemedText>
            {shipQueue.map((item) => {
              const def = SHIP_DEFINITIONS[item.shipType];
              const remaining = Math.max(0, Math.floor((item.completesAt - Date.now()) / 1000));
              const color = SHIP_COLORS[item.shipType];
              return (
                <Card key={item.id} style={styles.queueCard}>
                  <View style={[styles.queueIcon, { backgroundColor: color }]}>
                    <Feather name={SHIP_ICONS[item.shipType] as any} size={16} color="#FFF" />
                  </View>
                  <View style={styles.queueInfo}>
                    <ThemedText style={styles.queueName}>
                      {def.name} x{item.quantity}
                    </ThemedText>
                    <ThemedText style={styles.queueTime}>{formatTime(remaining)}</ThemedText>
                  </View>
                  <Feather name="loader" size={16} color={GameColors.warning} />
                </Card>
              );
            })}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <ThemedText style={styles.sectionTitle}>Your Hangar</ThemedText>
          {ships.length === 0 ? (
            <Card style={styles.emptyHangar}>
              <ThemedText style={styles.emptyHangarText}>No ships yet. Build your first ship below!</ThemedText>
            </Card>
          ) : (
            <View style={styles.hangarGrid}>
              {ships.map((ship) => {
                const def = SHIP_DEFINITIONS[ship.shipType];
                const color = SHIP_COLORS[ship.shipType];
                return (
                  <Card key={ship.id} style={styles.shipCard}>
                    <View style={[styles.shipIcon, { backgroundColor: color }]}>
                      <Feather name={SHIP_ICONS[ship.shipType] as any} size={20} color="#FFF" />
                    </View>
                    <ThemedText style={styles.shipName}>{def.name}</ThemedText>
                    <ThemedText style={styles.shipCount}>x{ship.quantity}</ThemedText>
                  </Card>
                );
              })}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(300)}>
          <ThemedText style={styles.sectionTitle}>Build Ships</ThemedText>
          {Object.values(SHIP_TYPES).map((shipType) => {
            const def = SHIP_DEFINITIONS[shipType];
            const color = SHIP_COLORS[shipType];
            const unlocked = canBuildShip(shipType);
            const count = getShipCount(shipType);

            return (
              <Pressable
                key={shipType}
                onPress={() => {
                  if (unlocked) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedShip(shipType);
                    setBuildQuantity(1);
                  }
                }}
                style={({ pressed }) => [
                  styles.buildCard,
                  !unlocked && styles.buildCardLocked,
                  pressed && unlocked && styles.buildCardPressed,
                ]}
              >
                <View style={[styles.buildIcon, { backgroundColor: unlocked ? color : GameColors.textSecondary }]}>
                  <Feather name={SHIP_ICONS[shipType] as any} size={24} color="#FFF" />
                </View>
                <View style={styles.buildInfo}>
                  <ThemedText style={[styles.buildName, !unlocked && styles.textLocked]}>{def.name}</ThemedText>
                  <ThemedText style={[styles.buildDesc, !unlocked && styles.textLocked]} numberOfLines={1}>
                    {unlocked ? def.description : `Requires Shipyard Lv.${def.requiredShipyardLevel}`}
                  </ThemedText>
                  <View style={styles.buildStats}>
                    <View style={styles.stat}>
                      <Feather name="zap" size={10} color={GameColors.warning} />
                      <ThemedText style={styles.statText}>{def.attack}</ThemedText>
                    </View>
                    <View style={styles.stat}>
                      <Feather name="shield" size={10} color={GameColors.primary} />
                      <ThemedText style={styles.statText}>{def.defense}</ThemedText>
                    </View>
                    <View style={styles.stat}>
                      <Feather name="wind" size={10} color={GameColors.success} />
                      <ThemedText style={styles.statText}>{def.speed}</ThemedText>
                    </View>
                  </View>
                </View>
                {count > 0 ? (
                  <View style={styles.countBadge}>
                    <ThemedText style={styles.countText}>x{count}</ThemedText>
                  </View>
                ) : null}
                {unlocked ? <Feather name="chevron-right" size={20} color={GameColors.textSecondary} /> : <Feather name="lock" size={20} color={GameColors.textSecondary} />}
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>

      <Modal visible={selectedShip !== null} transparent animationType="fade" onRequestClose={() => setSelectedShip(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedShip ? (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIcon, { backgroundColor: SHIP_COLORS[selectedShip] }]}>
                    <Feather name={SHIP_ICONS[selectedShip] as any} size={28} color="#FFF" />
                  </View>
                  <ThemedText style={styles.modalTitle}>{SHIP_DEFINITIONS[selectedShip].name}</ThemedText>
                  <Pressable onPress={() => setSelectedShip(null)} style={styles.closeButton}>
                    <Feather name="x" size={24} color={GameColors.textSecondary} />
                  </Pressable>
                </View>

                <ThemedText style={styles.modalDesc}>{SHIP_DEFINITIONS[selectedShip].description}</ThemedText>

                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Feather name="zap" size={16} color={GameColors.warning} />
                    <ThemedText style={styles.modalStatValue}>{SHIP_DEFINITIONS[selectedShip].attack}</ThemedText>
                    <ThemedText style={styles.modalStatLabel}>Attack</ThemedText>
                  </View>
                  <View style={styles.modalStat}>
                    <Feather name="shield" size={16} color={GameColors.primary} />
                    <ThemedText style={styles.modalStatValue}>{SHIP_DEFINITIONS[selectedShip].defense}</ThemedText>
                    <ThemedText style={styles.modalStatLabel}>Defense</ThemedText>
                  </View>
                  <View style={styles.modalStat}>
                    <Feather name="wind" size={16} color={GameColors.success} />
                    <ThemedText style={styles.modalStatValue}>{SHIP_DEFINITIONS[selectedShip].speed}</ThemedText>
                    <ThemedText style={styles.modalStatLabel}>Speed</ThemedText>
                  </View>
                  <View style={styles.modalStat}>
                    <Feather name="box" size={16} color={GameColors.accent} />
                    <ThemedText style={styles.modalStatValue}>{SHIP_DEFINITIONS[selectedShip].cargo}</ThemedText>
                    <ThemedText style={styles.modalStatLabel}>Cargo</ThemedText>
                  </View>
                </View>

                <View style={styles.quantityRow}>
                  <ThemedText style={styles.quantityLabel}>Quantity:</ThemedText>
                  <Pressable
                    onPress={() => setBuildQuantity(Math.max(1, buildQuantity - 1))}
                    style={styles.quantityButton}
                  >
                    <Feather name="minus" size={18} color={GameColors.textPrimary} />
                  </Pressable>
                  <ThemedText style={styles.quantityValue}>{buildQuantity}</ThemedText>
                  <Pressable onPress={() => setBuildQuantity(buildQuantity + 1)} style={styles.quantityButton}>
                    <Feather name="plus" size={18} color={GameColors.textPrimary} />
                  </Pressable>
                </View>

                <View style={styles.costSection}>
                  <ThemedText style={styles.costTitle}>Total Cost</ThemedText>
                  <View style={styles.costRow}>
                    <View style={styles.costItem}>
                      <ThemedText style={styles.costLabel}>Metal</ThemedText>
                      <ThemedText style={styles.costValue}>
                        {formatNumber(SHIP_DEFINITIONS[selectedShip].baseCost.metal * buildQuantity)}
                      </ThemedText>
                    </View>
                    <View style={styles.costItem}>
                      <ThemedText style={styles.costLabel}>Crystal</ThemedText>
                      <ThemedText style={styles.costValue}>
                        {formatNumber(SHIP_DEFINITIONS[selectedShip].baseCost.crystal * buildQuantity)}
                      </ThemedText>
                    </View>
                    <View style={styles.costItem}>
                      <ThemedText style={styles.costLabel}>Oxygen</ThemedText>
                      <ThemedText style={styles.costValue}>
                        {formatNumber(SHIP_DEFINITIONS[selectedShip].baseCost.oxygen * buildQuantity)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.buildTime}>
                    Build time: {formatTime(SHIP_DEFINITIONS[selectedShip].buildTime * buildQuantity)}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={handleBuild}
                  disabled={!canAffordShip(selectedShip, buildQuantity) || buildMutation.isPending}
                  style={[
                    styles.buildButton,
                    (!canAffordShip(selectedShip, buildQuantity) || buildMutation.isPending) && styles.buildButtonDisabled,
                  ]}
                >
                  <ThemedText style={styles.buildButtonText}>
                    {buildMutation.isPending ? "Building..." : canAffordShip(selectedShip, buildQuantity) ? "Build" : "Insufficient Resources"}
                  </ThemedText>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GameColors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: GameColors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  queueCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  queueIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  queueInfo: {
    flex: 1,
  },
  queueName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  queueTime: {
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.warning,
  },
  emptyHangar: {
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  emptyHangarText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  hangarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  shipCard: {
    width: "30%",
    padding: Spacing.md,
    alignItems: "center",
  },
  shipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  shipName: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  shipCount: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
  },
  buildCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  buildCardLocked: {
    opacity: 0.5,
  },
  buildCardPressed: {
    opacity: 0.8,
  },
  buildIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  buildInfo: {
    flex: 1,
  },
  buildName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  buildDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  textLocked: {
    color: GameColors.textSecondary,
  },
  buildStats: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  statText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: GameColors.textSecondary,
  },
  countBadge: {
    backgroundColor: GameColors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  countText: {
    fontSize: 10,
    fontFamily: "Orbitron_700Bold",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    marginBottom: Spacing.md,
  },
  modalStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalStat: {
    alignItems: "center",
  },
  modalStatValue: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
    marginTop: 4,
  },
  modalStatLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  quantityLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: GameColors.textPrimary,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GameColors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  quantityValue: {
    fontSize: 20,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
    minWidth: 40,
    textAlign: "center",
  },
  costSection: {
    backgroundColor: GameColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  costTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.sm,
  },
  costItem: {
    alignItems: "center",
  },
  costLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  costValue: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  buildTime: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: GameColors.warning,
    textAlign: "center",
  },
  buildButton: {
    backgroundColor: GameColors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  buildButtonDisabled: {
    backgroundColor: GameColors.textSecondary,
    opacity: 0.5,
  },
  buildButtonText: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: "#FFF",
  },
});
