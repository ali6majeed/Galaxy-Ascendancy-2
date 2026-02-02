import React, { useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { ResourceBar } from "@/components/ResourceBar";
import { ZoomedOutPlanet } from "@/components/ZoomedOutPlanet";
import { CityView } from "@/components/CityView";
import { BuildingDetailModal } from "@/components/BuildingDetailModal";
import { ConstructionQueue } from "@/components/ConstructionQueue";
import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { BuildingType } from "@/constants/gameData";
import { apiRequest } from "@/lib/query-client";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
  slotIndex: number;
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

type ViewMode = "planet" | "city";

export default function PlanetScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<ViewMode>("planet");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const zoomProgress = useSharedValue(0);

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
    mutationFn: async ({ buildingType, slotIndex }: { buildingType: BuildingType; slotIndex: number }) => {
      const response = await apiRequest("POST", "/api/buildings/upgrade", { buildingType, slotIndex });
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

  const handleCityPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    zoomProgress.value = withSpring(1, { damping: 15, stiffness: 100 }, () => {
      runOnJS(setViewMode)("city");
    });
  };

  const handleBackToplanet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    zoomProgress.value = withSpring(0, { damping: 15, stiffness: 100 }, () => {
      runOnJS(setViewMode)("planet");
    });
  };

  const handleBuildingPress = (building: Building) => {
    setSelectedBuilding(building);
    setModalVisible(true);
  };

  const handleEmptySlotPress = (buildingType: BuildingType, slotIndex: number = 0) => {
    setSelectedBuilding({ id: "", buildingType, slotIndex, level: 0, isConstructing: false });
    setModalVisible(true);
  };

  const handleFieldPress = (buildingType: BuildingType, slotIndex: number, building?: Building) => {
    if (building) {
      setSelectedBuilding(building);
    } else {
      setSelectedBuilding({ id: "", buildingType, slotIndex, level: 0, isConstructing: false });
    }
    setModalVisible(true);
  };

  const handleUpgrade = (buildingType: BuildingType, slotIndex: number = 0) => {
    upgradeMutation.mutate({ buildingType, slotIndex });
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedBuilding(null);
  };

  const planetAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      zoomProgress.value,
      [0, 1],
      [1, 2.5],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      zoomProgress.value,
      [0, 0.5],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const cityAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      zoomProgress.value,
      [0, 1],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      zoomProgress.value,
      [0.5, 1],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

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

        {constructionQueue && constructionQueue.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <ConstructionQueue items={constructionQueue} />
          </Animated.View>
        ) : null}

        <View style={styles.viewContainer}>
          {viewMode === "planet" ? (
            <Animated.View 
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.planetViewWrapper}
            >
              <ZoomedOutPlanet
                resources={resources}
                buildings={buildings || []}
                onCityPress={handleCityPress}
                onFieldPress={handleFieldPress}
              />
            </Animated.View>
          ) : (
            <Animated.View 
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
              style={styles.cityViewWrapper}
            >
              <Pressable style={styles.backButton} onPress={handleBackToplanet} testID="back-to-planet">
                <Feather name="arrow-left" size={20} color={GameColors.textPrimary} />
                <ThemedText style={styles.backButtonText}>Back to Planet</ThemedText>
              </Pressable>
              
              <CityView
                buildings={buildings || []}
                onBuildingPress={handleBuildingPress}
                onEmptySlotPress={handleEmptySlotPress}
              />
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <BuildingDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        buildingType={selectedBuilding?.buildingType || null}
        slotIndex={selectedBuilding?.slotIndex ?? 0}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  section: {
    marginTop: Spacing.lg,
  },
  viewContainer: {
    marginTop: Spacing.xl,
    minHeight: SCREEN_WIDTH,
  },
  planetViewWrapper: {
    alignItems: "center",
  },
  cityViewWrapper: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GameColors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
});
