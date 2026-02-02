import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";
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

interface PlayerResources {
  metal: number;
  crystal: number;
  oxygen: number;
}

interface ShipBuildingModalProps {
  visible: boolean;
  onClose: () => void;
  fleetDockLevel: number;
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

export function ShipBuildingModal({ visible, onClose, fleetDockLevel }: ShipBuildingModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [buildQuantity, setBuildQuantity] = useState(1);

  const { data: ships = [] } = useQuery<Ship[]>({
    queryKey: ["/api/player/ships"],
    enabled: visible,
  });

  const { data: shipQueue = [] } = useQuery<ShipQueueItem[]>({
    queryKey: ["/api/player/ship-queue"],
    refetchInterval: visible ? 1000 : false,
    enabled: visible,
  });

  const { data: resources } = useQuery<PlayerResources>({
    queryKey: ["/api/player/resources"],
    enabled: visible,
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

  const getShipCount = (shipType: ShipType): number => {
    const ship = ships.find((s) => s.shipType === shipType);
    return ship?.quantity || 0;
  };

  const canBuildShip = (shipType: ShipType): boolean => {
    const def = SHIP_DEFINITIONS[shipType];
    return fleetDockLevel >= def.requiredShipyardLevel;
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

  const handleClose = () => {
    setSelectedShip(null);
    setBuildQuantity(1);
    onClose();
  };

  const totalFleetPower = ships.reduce((sum, ship) => {
    const def = SHIP_DEFINITIONS[ship.shipType];
    return sum + (def.attack + def.defense) * ship.quantity;
  }, 0);

  const totalShips = ships.reduce((sum, ship) => sum + ship.quantity, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View 
          entering={SlideInDown.springify().damping(15)}
          style={[styles.container, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Feather name="anchor" size={24} color={GameColors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerTitle}>Fleet Dock</ThemedText>
              <ThemedText style={styles.headerLevel}>Level {fleetDockLevel}</ThemedText>
            </View>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={GameColors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{totalShips}</ThemedText>
              <ThemedText style={styles.statLabel}>Ships</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{formatNumber(totalFleetPower)}</ThemedText>
              <ThemedText style={styles.statLabel}>Power</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>{shipQueue.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Building</ThemedText>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {shipQueue.length > 0 ? (
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Build Queue</ThemedText>
                {shipQueue.map((item) => {
                  const def = SHIP_DEFINITIONS[item.shipType];
                  const remaining = Math.max(0, Math.floor((item.completesAt - Date.now()) / 1000));
                  const color = SHIP_COLORS[item.shipType];
                  return (
                    <Card key={item.id} style={styles.queueCard}>
                      <View style={[styles.queueIcon, { backgroundColor: color }]}>
                        <Feather name={SHIP_ICONS[item.shipType] as any} size={14} color="#FFF" />
                      </View>
                      <View style={styles.queueInfo}>
                        <ThemedText style={styles.queueName}>
                          {def.name} x{item.quantity}
                        </ThemedText>
                        <ThemedText style={styles.queueTime}>{formatTime(remaining)}</ThemedText>
                      </View>
                    </Card>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Build Ships</ThemedText>
              {Object.values(SHIP_TYPES).map((shipType) => {
                const def = SHIP_DEFINITIONS[shipType];
                const color = SHIP_COLORS[shipType];
                const unlocked = canBuildShip(shipType);
                const count = getShipCount(shipType);
                const isSelected = selectedShip === shipType;

                return (
                  <Pressable
                    key={shipType}
                    onPress={() => {
                      if (unlocked) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setSelectedShip(isSelected ? null : shipType);
                        setBuildQuantity(1);
                      }
                    }}
                    style={[
                      styles.shipCard,
                      !unlocked && styles.shipCardLocked,
                      isSelected && styles.shipCardSelected,
                    ]}
                  >
                    <View style={[styles.shipIcon, { backgroundColor: unlocked ? color : GameColors.textSecondary }]}>
                      <Feather name={SHIP_ICONS[shipType] as any} size={20} color="#FFF" />
                    </View>
                    <View style={styles.shipInfo}>
                      <ThemedText style={[styles.shipName, !unlocked && styles.textLocked]}>{def.name}</ThemedText>
                      <ThemedText style={[styles.shipDesc, !unlocked && styles.textLocked]} numberOfLines={1}>
                        {unlocked ? def.description : `Requires Fleet Dock Lv.${def.requiredShipyardLevel}`}
                      </ThemedText>
                      <View style={styles.shipStats}>
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
                    {unlocked ? (
                      <Feather name={isSelected ? "chevron-down" : "chevron-right"} size={20} color={GameColors.textSecondary} />
                    ) : (
                      <Feather name="lock" size={18} color={GameColors.textSecondary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {selectedShip ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.buildPanel}>
              <View style={styles.buildHeader}>
                <View style={[styles.buildPanelIcon, { backgroundColor: SHIP_COLORS[selectedShip] }]}>
                  <Feather name={SHIP_ICONS[selectedShip] as any} size={18} color="#FFF" />
                </View>
                <ThemedText style={styles.buildPanelTitle}>{SHIP_DEFINITIONS[selectedShip].name}</ThemedText>
              </View>

              <View style={styles.quantityRow}>
                <Pressable
                  onPress={() => setBuildQuantity(Math.max(1, buildQuantity - 1))}
                  style={styles.quantityButton}
                >
                  <Feather name="minus" size={16} color={GameColors.textPrimary} />
                </Pressable>
                <ThemedText style={styles.quantityValue}>{buildQuantity}</ThemedText>
                <Pressable onPress={() => setBuildQuantity(buildQuantity + 1)} style={styles.quantityButton}>
                  <Feather name="plus" size={16} color={GameColors.textPrimary} />
                </Pressable>
              </View>

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
                {formatTime(SHIP_DEFINITIONS[selectedShip].buildTime * buildQuantity)}
              </ThemedText>

              <Pressable
                onPress={handleBuild}
                disabled={!canAffordShip(selectedShip, buildQuantity) || buildMutation.isPending}
                style={[
                  styles.buildButton,
                  (!canAffordShip(selectedShip, buildQuantity) || buildMutation.isPending) && styles.buildButtonDisabled,
                ]}
              >
                <Feather name="anchor" size={16} color="#FFF" />
                <ThemedText style={styles.buildButtonText}>
                  {buildMutation.isPending ? "Building..." : canAffordShip(selectedShip, buildQuantity) ? "Build" : "Need Resources"}
                </ThemedText>
              </Pressable>
            </Animated.View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: GameColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GameColors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  headerLevel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: GameColors.primary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  statCard: {
    flex: 1,
    backgroundColor: GameColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: GameColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
  },
  queueCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  queueIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  queueInfo: {
    flex: 1,
  },
  queueName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  queueTime: {
    fontSize: 11,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.warning,
  },
  shipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GameColors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  shipCardLocked: {
    opacity: 0.5,
  },
  shipCardSelected: {
    borderColor: GameColors.primary,
    borderWidth: 2,
  },
  shipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  shipInfo: {
    flex: 1,
  },
  shipName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  shipDesc: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  textLocked: {
    color: GameColors.textSecondary,
  },
  shipStats: {
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
    fontSize: 9,
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
  buildPanel: {
    backgroundColor: GameColors.background,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  buildHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  buildPanelIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  buildPanelTitle: {
    fontSize: 14,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    gap: Spacing.lg,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GameColors.surface,
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
  costRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.sm,
  },
  costItem: {
    alignItems: "center",
  },
  costLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  costValue: {
    fontSize: 12,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  buildTime: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: GameColors.warning,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  buildButton: {
    flexDirection: "row",
    backgroundColor: GameColors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
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
