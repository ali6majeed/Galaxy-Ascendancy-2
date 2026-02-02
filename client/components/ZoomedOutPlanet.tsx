import React, { useEffect } from "react";
import { View, StyleSheet, Image, Dimensions, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { 
  formatNumber, 
  BuildingType, 
  BUILDING_DEFINITIONS, 
  BUILDING_TYPES,
  BUILDING_MAX_SLOTS,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLANET_SIZE = SCREEN_WIDTH * 0.85;
const FIELD_SIZE = 44;

interface Building {
  id: string;
  buildingType: BuildingType;
  slotIndex: number;
  level: number;
  isConstructing: boolean;
}

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
}

interface ZoomedOutPlanetProps {
  resources?: PlayerResources;
  buildings: Building[];
  onCityPress: () => void;
  onFieldPress: (buildingType: BuildingType, slotIndex: number, building?: Building) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUILDING_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  [BUILDING_TYPES.METAL_MINE]: "box",
  [BUILDING_TYPES.CRYSTAL_REFINERY]: "hexagon",
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: "wind",
  [BUILDING_TYPES.ENERGY_PLANT]: "zap",
};

const BUILDING_COLORS: Record<string, string> = {
  [BUILDING_TYPES.METAL_MINE]: "#8B7355",
  [BUILDING_TYPES.CRYSTAL_REFINERY]: "#9B59B6",
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: "#3498DB",
  [BUILDING_TYPES.ENERGY_PLANT]: "#F39C12",
};

interface FieldPosition {
  x: number;
  y: number;
  buildingType: BuildingType;
  slotIndex: number;
}

function getFieldPositions(): FieldPosition[] {
  const centerX = PLANET_SIZE / 2;
  const centerY = PLANET_SIZE / 2;
  const positions: FieldPosition[] = [];
  
  const metalAngles = [-150, -130, -110, -90];
  metalAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.38;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.METAL_MINE,
      slotIndex: i,
    });
  });
  
  const crystalAngles = [-70, -50, -30, -10];
  crystalAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.38;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.CRYSTAL_REFINERY,
      slotIndex: i,
    });
  });
  
  const oxygenAngles = [10, 30, 50, 70, 90, 110];
  oxygenAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.38;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR,
      slotIndex: i,
    });
  });
  
  const energyAngles = [130, 150, 170, 190];
  energyAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.38;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.ENERGY_PLANT,
      slotIndex: i,
    });
  });
  
  return positions;
}

interface ResourceFieldProps {
  position: FieldPosition;
  building?: Building;
  onPress: () => void;
}

function ResourceField({ position, building, onPress }: ResourceFieldProps) {
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.2);
  
  const isEmpty = !building;
  const canUpgrade = building && !building.isConstructing;
  const color = BUILDING_COLORS[position.buildingType];
  const icon = BUILDING_ICONS[position.buildingType];
  
  useEffect(() => {
    if (canUpgrade) {
      pulseAnim.value = withRepeat(
        withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [canUpgrade]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));
  
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.fieldContainer,
        {
          left: position.x - FIELD_SIZE / 2,
          top: position.y - FIELD_SIZE / 2,
        },
      ]}
    >
      {canUpgrade ? (
        <Animated.View style={[styles.fieldGlow, glowStyle, { backgroundColor: color }]} />
      ) : null}
      
      <Animated.View style={[styles.fieldInner, animatedStyle]}>
        {isEmpty ? (
          <View style={[styles.emptyField, { borderColor: color }]}>
            <Feather name="plus" size={16} color={color} />
          </View>
        ) : (
          <LinearGradient
            colors={[color, `${color}99`]}
            style={styles.fieldGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={icon} size={16} color="#FFFFFF" />
            <View style={styles.levelBadge}>
              <ThemedText style={styles.levelText}>{building.level}</ThemedText>
            </View>
            {building.isConstructing ? (
              <View style={styles.constructingDot} />
            ) : null}
          </LinearGradient>
        )}
      </Animated.View>
    </Pressable>
  );
}

function ResourceSummary({ 
  icon, 
  rate, 
  color, 
  label,
  style,
}: { 
  icon: any; 
  rate: number; 
  color: string; 
  label: string;
  style?: any;
}) {
  return (
    <View style={[styles.resourceSummary, style]}>
      <View style={[styles.resourceSummaryIcon, { borderColor: color }]}>
        <Image source={icon} style={styles.resourceSummaryImage} resizeMode="contain" />
      </View>
      <View style={styles.resourceSummaryInfo}>
        <ThemedText style={[styles.resourceSummaryRate, { color }]}>+{formatNumber(rate)}/h</ThemedText>
        <ThemedText style={styles.resourceSummaryLabel}>{label}</ThemedText>
      </View>
    </View>
  );
}

export function ZoomedOutPlanet({ resources, buildings, onCityPress, onFieldPress }: ZoomedOutPlanetProps) {
  const rotation = useSharedValue(0);
  const planetPulse = useSharedValue(0);
  const cityGlow = useSharedValue(0);
  const cityScale = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 90000, easing: Easing.linear }),
      -1,
      false
    );
    planetPulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    cityGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const planetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(planetPulse.value, [0, 1], [1, 1.02]) }],
  }));

  const cityGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cityGlow.value, [0.5, 1], [0.4, 0.8]),
    transform: [{ scale: interpolate(cityGlow.value, [0.5, 1], [1, 1.1]) }],
  }));

  const cityButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cityScale.value }],
  }));

  const handleCityPressIn = () => {
    cityScale.value = withSpring(0.95);
  };

  const handleCityPressOut = () => {
    cityScale.value = withSpring(1);
  };

  const fieldPositions = getFieldPositions();
  
  const resourceBuildings = buildings.filter(b => 
    b.buildingType === BUILDING_TYPES.METAL_MINE ||
    b.buildingType === BUILDING_TYPES.CRYSTAL_REFINERY ||
    b.buildingType === BUILDING_TYPES.OXYGEN_PROCESSOR ||
    b.buildingType === BUILDING_TYPES.ENERGY_PLANT
  );
  
  const facilityCount = buildings.filter(b => 
    b.buildingType === BUILDING_TYPES.RESEARCH_LAB ||
    b.buildingType === BUILDING_TYPES.FLEET_DOCK
  ).length;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.orbitRing, rotationStyle]}>
        <View style={styles.orbitDot} />
      </Animated.View>
      
      <Animated.View style={[styles.planetWrapper, planetStyle]}>
        <Image
          source={require("../../assets/images/planet-surface-layer.png")}
          style={styles.planetImage}
          resizeMode="contain"
        />
      </Animated.View>

      {fieldPositions.map((pos, index) => {
        const building = resourceBuildings.find(
          b => b.buildingType === pos.buildingType && b.slotIndex === pos.slotIndex
        );
        return (
          <ResourceField
            key={`${pos.buildingType}-${pos.slotIndex}`}
            position={pos}
            building={building}
            onPress={() => onFieldPress(pos.buildingType, pos.slotIndex, building)}
          />
        );
      })}

      <Animated.View style={[styles.cityGlow, cityGlowStyle]} />
      
      <AnimatedPressable 
        style={[styles.cityButton, cityButtonStyle]}
        onPress={onCityPress}
        onPressIn={handleCityPressIn}
        onPressOut={handleCityPressOut}
        testID="city-center-button"
      >
        <View style={styles.cityInner}>
          <Animated.View style={[styles.cityPulseRing]} />
          <View style={styles.cityCore}>
            <Feather name="home" size={24} color={GameColors.primary} />
          </View>
          <View style={styles.cityLabel}>
            <ThemedText style={styles.cityLabelText}>CITY CENTER</ThemedText>
            <ThemedText style={styles.buildingCountText}>
              {facilityCount} {facilityCount === 1 ? "facility" : "facilities"}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>

      <View style={styles.resourceSummaryContainer}>
        <ResourceSummary
          icon={require("../../assets/images/resource-metal.png")}
          rate={resources?.metalRate ?? 0}
          color={GameColors.metal}
          label="Metal"
        />
        <ResourceSummary
          icon={require("../../assets/images/resource-crystal.png")}
          rate={resources?.crystalRate ?? 0}
          color={GameColors.crystal}
          label="Crystal"
        />
        <ResourceSummary
          icon={require("../../assets/images/resource-oxygen.png")}
          rate={resources?.oxygenRate ?? 0}
          color={GameColors.oxygen}
          label="Oxygen"
        />
      </View>

      <View style={styles.legend}>
        {Object.entries(BUILDING_COLORS).map(([type, color]) => (
          <View key={type} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <ThemedText style={styles.legendText}>
              {BUILDING_DEFINITIONS[type as BuildingType].name.split(" ")[0]}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: PLANET_SIZE,
    height: PLANET_SIZE + 120,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitRing: {
    position: "absolute",
    width: PLANET_SIZE * 0.85,
    height: PLANET_SIZE * 0.85,
    borderRadius: PLANET_SIZE * 0.425,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.15)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "flex-start",
    top: 60,
  },
  orbitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GameColors.primary,
    marginTop: -2,
  },
  planetWrapper: {
    width: PLANET_SIZE * 0.65,
    height: PLANET_SIZE * 0.65,
    borderRadius: PLANET_SIZE * 0.325,
    overflow: "hidden",
    position: "absolute",
    top: PLANET_SIZE * 0.175 + 30,
  },
  planetImage: {
    width: "100%",
    height: "100%",
  },
  fieldContainer: {
    position: "absolute",
    width: FIELD_SIZE,
    height: FIELD_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  fieldGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FIELD_SIZE / 2,
    transform: [{ scale: 1.3 }],
  },
  fieldInner: {
    width: FIELD_SIZE,
    height: FIELD_SIZE,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  emptyField: {
    flex: 1,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
  },
  levelBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
  },
  levelText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingDot: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GameColors.warning,
  },
  cityGlow: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: GameColors.primary,
    top: PLANET_SIZE / 2 - 5,
  },
  cityButton: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    top: PLANET_SIZE / 2,
  },
  cityInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cityPulseRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: GameColors.primary,
    opacity: 0.5,
  },
  cityCore: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GameColors.surface,
    borderWidth: 2,
    borderColor: GameColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cityLabel: {
    position: "absolute",
    bottom: -35,
    alignItems: "center",
  },
  cityLabelText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
    letterSpacing: 0.5,
  },
  buildingCountText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    marginTop: 2,
  },
  resourceSummaryContainer: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
  },
  resourceSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  resourceSummaryIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GameColors.surface,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceSummaryImage: {
    width: 14,
    height: 14,
  },
  resourceSummaryInfo: {
    alignItems: "flex-start",
  },
  resourceSummaryRate: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
  },
  resourceSummaryLabel: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
  legend: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
  },
});
