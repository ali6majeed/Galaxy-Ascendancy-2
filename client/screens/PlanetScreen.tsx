import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ResourceBar } from "@/components/ResourceBar";
import { PageSwitcher, PlanetPageType } from "@/components/PageSwitcher";
import { PlanetView } from "@/components/PlanetView";
import { BuildingCard } from "@/components/BuildingCard";
import { BuildingDetailModal } from "@/components/BuildingDetailModal";
import { ConstructionQueue } from "@/components/ConstructionQueue";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import {
  BuildingType,
  BUILDING_DEFINITIONS,
  RESOURCE_BUILDINGS,
  FACILITY_BUILDINGS,
} from "@/constants/gameData";
import { apiRequest } from "@/lib/query-client";

interface PlayerResources {
  metal: number;
  crystal: number;
  oxygen: number;
  energyProduction: number;
  energyConsumption: number;
  energyEfficiency: number;
  metalRate: number;
  crystalRate: number;
  oxygenRate: number;
  baseMetalRate: number;
  baseCrystalRate: number;
  baseOxygenRate: number;
}

interface Building {
  id: string;
  buildingType: BuildingType;
  level: number;
  isConstructing: boolean;
}

interface ConstructionItem {
  id: string;
  buildingType: string;
  buildingName: string;
  targetLevel: number;
  completesAt: number;
}

export default function PlanetScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const [activePage, setActivePage] = useState<PlanetPageType>("resources");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: resources, isLoading: resourcesLoading } = useQuery<PlayerResources>({
    queryKey: ["/api/player/resources"],
  });

  const { data: buildings, isLoading: buildingsLoading } = useQuery<Building[]>({
    queryKey: ["/api/player/buildings"],
  });

  const { data: constructionQueue } = useQuery<ConstructionItem[]>({
    queryKey: ["/api/player/construction"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (buildingType: BuildingType) => {
      const response = await apiRequest("POST", "/api/buildings/upgrade", { buildingType });
      return response.json();
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/player/resources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/buildings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/construction"] });
      setModalVisible(false);
      setSelectedBuilding(null);
    },
    onError: (error) => {
      console.error("Upgrade failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/player/resources"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/player/buildings"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/player/construction"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const relevantBuildingTypes = activePage === "resources" ? RESOURCE_BUILDINGS : FACILITY_BUILDINGS;
  
  const filteredBuildings = buildings?.filter((b) => 
    relevantBuildingTypes.includes(b.buildingType)
  ) || [];

  const availableBuildingSlots = relevantBuildingTypes.filter(
    (type) => !buildings?.some((b) => b.buildingType === type)
  );

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setModalVisible(true);
  };

  const handleEmptySlotPress = (buildingType: BuildingType) => {
    setSelectedBuilding({ id: "", buildingType, level: 0, isConstructing: false });
    setModalVisible(true);
  };

  const handleUpgrade = (buildingType: BuildingType) => {
    upgradeMutation.mutate(buildingType);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedBuilding(null);
  };

  const isLoading = resourcesLoading || buildingsLoading;

  const pageTitle = activePage === "resources" 
    ? "Resource Production" 
    : "Buildings & Fleet";

  const pageDescription = activePage === "resources"
    ? "Manage your resource-generating structures"
    : "Research technologies and build your fleet";

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GameColors.primary}
          />
        }
      >
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <ResourceBar
            metal={resources?.metal ?? 0}
            crystal={resources?.crystal ?? 0}
            oxygen={resources?.oxygen ?? 0}
            energyProduction={resources?.energyProduction ?? 0}
            energyConsumption={resources?.energyConsumption ?? 0}
            energyEfficiency={resources?.energyEfficiency ?? 100}
            metalRate={resources?.metalRate ?? 0}
            crystalRate={resources?.crystalRate ?? 0}
            oxygenRate={resources?.oxygenRate ?? 0}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <PageSwitcher activePage={activePage} onPageChange={setActivePage} />
        </Animated.View>

        <Animated.View 
          key={activePage}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.pageHeader}
        >
          <ThemedText style={styles.pageTitle}>{pageTitle}</ThemedText>
          <ThemedText style={styles.pageDescription}>{pageDescription}</ThemedText>
        </Animated.View>

        {constructionQueue && constructionQueue.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <ConstructionQueue items={constructionQueue} />
          </Animated.View>
        ) : null}

        <Animated.View 
          key={`buildings-${activePage}`}
          entering={FadeIn.duration(300)}
          style={styles.section}
        >
          <ThemedText style={styles.sectionTitle}>
            {activePage === "resources" ? "Resource Structures" : "Facility Structures"}
          </ThemedText>

          {isLoading ? (
            <View style={styles.buildingList}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : (
            <View style={styles.buildingList}>
              {filteredBuildings.map((building, index) => (
                <Animated.View
                  key={building.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <BuildingCard
                    buildingType={building.buildingType}
                    level={building.level}
                    isConstructing={building.isConstructing}
                    onPress={() => handleBuildingPress(building)}
                  />
                </Animated.View>
              ))}
              
              {availableBuildingSlots.map((buildingType, index) => (
                <Animated.View
                  key={buildingType}
                  entering={FadeInDown.delay((filteredBuildings.length + index) * 50).duration(300)}
                >
                  <EmptyBuildingCard
                    buildingType={buildingType}
                    onPress={() => handleEmptySlotPress(buildingType)}
                  />
                </Animated.View>
              ))}

              {filteredBuildings.length === 0 && availableBuildingSlots.length === 0 ? (
                <EmptyState
                  image={require("../../assets/images/empty-construction.png")}
                  title="No Structures Available"
                  description="Check back later for new structures to build."
                />
              ) : null}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <BuildingDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        buildingType={selectedBuilding?.buildingType || null}
        level={selectedBuilding?.level ?? 0}
        resources={{
          metal: resources?.metal ?? 0,
          crystal: resources?.crystal ?? 0,
          oxygen: resources?.oxygen ?? 0,
          energyProduction: resources?.energyProduction ?? 0,
          energyConsumption: resources?.energyConsumption ?? 0,
        }}
        onUpgrade={handleUpgrade}
        isUpgrading={upgradeMutation.isPending}
      />
    </>
  );
}

interface EmptyBuildingCardProps {
  buildingType: BuildingType;
  onPress: () => void;
}

function EmptyBuildingCard({ buildingType, onPress }: EmptyBuildingCardProps) {
  const definition = BUILDING_DEFINITIONS[buildingType];
  
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyCardContent}>
        <View style={styles.emptyIconContainer}>
          <ThemedText style={styles.emptyPlusIcon}>+</ThemedText>
        </View>
        <View style={styles.emptyCardInfo}>
          <ThemedText style={styles.emptyCardTitle}>{definition.name}</ThemedText>
          <ThemedText style={styles.emptyCardDescription} numberOfLines={2}>
            {definition.description}
          </ThemedText>
        </View>
      </View>
      <View style={styles.emptyCardAction}>
        <ThemedText style={styles.buildButtonText} onPress={onPress}>
          BUILD
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  section: {
    marginTop: Spacing.lg,
  },
  pageHeader: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
    textAlign: "center",
  },
  pageDescription: {
    fontSize: 13,
    color: GameColors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: Spacing.xs,
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
  emptyCard: {
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: GameColors.textTertiary,
    borderStyle: "dashed",
  },
  emptyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: GameColors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: GameColors.textTertiary,
  },
  emptyPlusIcon: {
    fontSize: 28,
    fontWeight: "700",
    color: GameColors.textSecondary,
    fontFamily: "Orbitron_700Bold",
  },
  emptyCardInfo: {
    flex: 1,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textSecondary,
  },
  emptyCardDescription: {
    fontSize: 12,
    color: GameColors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  emptyCardAction: {
    marginTop: Spacing.md,
    alignItems: "flex-end",
  },
  buildButtonText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(10, 132, 255, 0.15)",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
});
