import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ResourceBar } from "@/components/ResourceBar";
import { LayerSwitcher } from "@/components/LayerSwitcher";
import { PlanetView } from "@/components/PlanetView";
import { BuildingCard } from "@/components/BuildingCard";
import { BuildingDetailModal } from "@/components/BuildingDetailModal";
import { ConstructionQueue } from "@/components/ConstructionQueue";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/SkeletonLoader";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing } from "@/constants/theme";
import {
  LayerType,
  LAYER_TYPES,
  BuildingType,
  BUILDING_DEFINITIONS,
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

  const [activeLayer, setActiveLayer] = useState<LayerType>(LAYER_TYPES.SURFACE);
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

  const filteredBuildings = buildings?.filter((b) => {
    const definition = BUILDING_DEFINITIONS[b.buildingType];
    return definition?.layer === activeLayer;
  }) || [];

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
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
          <LayerSwitcher activeLayer={activeLayer} onLayerChange={setActiveLayer} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.planetSection}>
          <PlanetView
            activeLayer={activeLayer}
            buildings={buildings || []}
            onBuildingPress={handleBuildingPress}
          />
        </Animated.View>

        {constructionQueue && constructionQueue.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <ConstructionQueue items={constructionQueue} />
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} Structures
          </ThemedText>

          {isLoading ? (
            <View style={styles.buildingList}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : filteredBuildings.length > 0 ? (
            <View style={styles.buildingList}>
              {filteredBuildings.map((building, index) => (
                <Animated.View
                  key={building.id}
                  entering={FadeInDown.delay(450 + index * 50).duration(300)}
                >
                  <BuildingCard
                    buildingType={building.buildingType}
                    level={building.level}
                    isConstructing={building.isConstructing}
                    onPress={() => handleBuildingPress(building)}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <EmptyState
              image={require("../../assets/images/empty-construction.png")}
              title="No Structures Yet"
              description={`Build your first ${activeLayer} structure to begin your galactic conquest.`}
            />
          )}
        </Animated.View>
      </ScrollView>

      <BuildingDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        buildingType={selectedBuilding?.buildingType || null}
        level={selectedBuilding?.level || 1}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  section: {
    marginTop: Spacing.lg,
  },
  planetSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
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
});
