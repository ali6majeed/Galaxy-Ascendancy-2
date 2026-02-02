import React, { useEffect } from "react";
import { View, StyleSheet, Image, Dimensions, Pressable, ImageSourcePropType } from "react-native";
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

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { 
  formatNumber, 
  BuildingType, 
  BUILDING_DEFINITIONS, 
  BUILDING_TYPES,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLANET_SIZE = SCREEN_WIDTH * 0.85;
const FIELD_SIZE = 52;

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

const FIELD_IMAGES: Record<string, ImageSourcePropType> = {
  [BUILDING_TYPES.METAL_MINE]: require("../../assets/images/field-metal.png"),
  [BUILDING_TYPES.CRYSTAL_REFINERY]: require("../../assets/images/field-crystal.png"),
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: require("../../assets/images/field-oxygen.png"),
  [BUILDING_TYPES.ENERGY_PLANT]: require("../../assets/images/field-energy.png"),
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
  rotation: number;
}

function getFieldPositions(): FieldPosition[] {
  const centerX = PLANET_SIZE / 2;
  const centerY = PLANET_SIZE / 2;
  const positions: FieldPosition[] = [];
  
  const metalAngles = [-155, -130, -105, -80];
  metalAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.40;
    const randomOffset = (i % 2 === 0 ? -8 : 8) + Math.random() * 4;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius + randomOffset,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius + randomOffset,
      buildingType: BUILDING_TYPES.METAL_MINE,
      slotIndex: i,
      rotation: (i * 15) - 30,
    });
  });
  
  const crystalAngles = [-55, -30, -5, 20];
  crystalAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.40;
    const randomOffset = (i % 2 === 0 ? 6 : -6) + Math.random() * 4;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius + randomOffset,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius + randomOffset,
      buildingType: BUILDING_TYPES.CRYSTAL_REFINERY,
      slotIndex: i,
      rotation: (i * 20) - 40,
    });
  });
  
  const oxygenAngles = [45, 70, 95, 120, 145, 170];
  oxygenAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.40;
    const randomOffset = (i % 2 === 0 ? -5 : 5) + Math.random() * 3;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius + randomOffset,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius + randomOffset,
      buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR,
      slotIndex: i,
      rotation: (i * 12) - 30,
    });
  });
  
  const energyAngles = [195, 220, 245, 270];
  energyAngles.forEach((angle, i) => {
    const radius = PLANET_SIZE * 0.40;
    const randomOffset = (i % 2 === 0 ? 7 : -7) + Math.random() * 4;
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius + randomOffset,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius + randomOffset,
      buildingType: BUILDING_TYPES.ENERGY_PLANT,
      slotIndex: i,
      rotation: (i * 18) - 36,
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
  const floatAnim = useSharedValue(0);
  
  const isEmpty = !building;
  const canUpgrade = building && !building.isConstructing;
  const color = BUILDING_COLORS[position.buildingType];
  const fieldImage = FIELD_IMAGES[position.buildingType];
  
  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 + Math.random() * 500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000 + Math.random() * 500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    if (canUpgrade) {
      pulseAnim.value = withRepeat(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [canUpgrade]);
  
  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(floatAnim.value, [0, 1], [0, -4]);
    return {
      transform: [
        { translateY },
        { scale: pulseAnim.value },
        { rotate: `${position.rotation}deg` },
      ],
    };
  });
  
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
            <Image source={fieldImage} style={styles.emptyFieldImage} resizeMode="contain" />
            <View style={styles.emptyOverlay}>
              <Feather name="plus" size={18} color="#FFFFFF" />
            </View>
          </View>
        ) : (
          <View style={styles.builtField}>
            <Image source={fieldImage} style={styles.fieldImage} resizeMode="cover" />
            <View style={styles.levelBadge}>
              <ThemedText style={styles.levelText}>{building.level}</ThemedText>
            </View>
            {building.isConstructing ? (
              <View style={styles.constructingIndicator}>
                <Feather name="loader" size={10} color="#FFF" />
              </View>
            ) : (
              <View style={[styles.upgradeIndicator, { backgroundColor: color }]}>
                <Feather name="arrow-up" size={10} color="#FFF" />
              </View>
            )}
          </View>
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
}: { 
  icon: ImageSourcePropType; 
  rate: number; 
  color: string; 
  label: string;
}) {
  return (
    <View style={styles.resourceSummary}>
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
      withTiming(360, { duration: 120000, easing: Easing.linear }),
      -1,
      false
    );
    planetPulse.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
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
    transform: [{ scale: interpolate(planetPulse.value, [0, 1], [1, 1.015]) }],
  }));

  const cityGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cityGlow.value, [0.5, 1], [0.3, 0.6]),
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

      <View style={styles.planetArea}>
        <Animated.View style={[styles.orbitRing, rotationStyle]}>
          <View style={styles.orbitDot} />
        </Animated.View>
        
        <Animated.View style={[styles.planetWrapper, planetStyle]}>
          <Image
            source={require("../../assets/images/planet-surface-layer.png")}
            style={styles.planetImage}
            resizeMode="cover"
          />
          <View style={styles.planetAtmosphere} />
        </Animated.View>

        {fieldPositions.map((pos) => {
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
            <Animated.View style={styles.cityPulseRing} />
            <View style={styles.cityCore}>
              <Feather name="home" size={22} color={GameColors.primary} />
            </View>
            <View style={styles.cityLabel}>
              <ThemedText style={styles.cityLabelText}>CITY CENTER</ThemedText>
              <ThemedText style={styles.buildingCountText}>
                {facilityCount} {facilityCount === 1 ? "facility" : "facilities"}
              </ThemedText>
            </View>
          </View>
        </AnimatedPressable>
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
    alignItems: "center",
  },
  resourceSummaryContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
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
  planetArea: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitRing: {
    position: "absolute",
    width: PLANET_SIZE * 0.88,
    height: PLANET_SIZE * 0.88,
    borderRadius: PLANET_SIZE * 0.44,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.1)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  orbitDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GameColors.primary,
    marginTop: -2,
  },
  planetWrapper: {
    width: PLANET_SIZE * 0.55,
    height: PLANET_SIZE * 0.55,
    borderRadius: PLANET_SIZE * 0.275,
    overflow: "hidden",
    position: "absolute",
  },
  planetImage: {
    width: "100%",
    height: "100%",
  },
  planetAtmosphere: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PLANET_SIZE * 0.275,
    borderWidth: 2,
    borderColor: "rgba(100, 210, 255, 0.2)",
  },
  fieldContainer: {
    position: "absolute",
    width: FIELD_SIZE,
    height: FIELD_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldGlow: {
    position: "absolute",
    width: FIELD_SIZE + 16,
    height: FIELD_SIZE + 16,
    borderRadius: (FIELD_SIZE + 16) / 2,
  },
  fieldInner: {
    width: FIELD_SIZE,
    height: FIELD_SIZE,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  emptyField: {
    flex: 1,
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  emptyFieldImage: {
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  builtField: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  fieldImage: {
    width: "100%",
    height: "100%",
  },
  levelBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 16,
    alignItems: "center",
  },
  levelText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: "#FFFFFF",
  },
  constructingIndicator: {
    position: "absolute",
    top: 2,
    left: 2,
    backgroundColor: "rgba(255, 149, 0, 0.9)",
    padding: 3,
    borderRadius: 4,
  },
  upgradeIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    padding: 3,
    borderRadius: 4,
  },
  cityGlow: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: GameColors.primary,
  },
  cityButton: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cityInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cityPulseRing: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: GameColors.primary,
    opacity: 0.5,
  },
  cityCore: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: GameColors.surface,
    borderWidth: 2,
    borderColor: GameColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cityLabel: {
    position: "absolute",
    bottom: -32,
    alignItems: "center",
  },
  cityLabelText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
    letterSpacing: 0.5,
  },
  buildingCountText: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    marginTop: 1,
  },
  legend: {
    marginTop: Spacing.xl,
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
