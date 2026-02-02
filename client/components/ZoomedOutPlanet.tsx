import React, { useEffect, useMemo } from "react";
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

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { 
  formatNumber, 
  BuildingType, 
  BUILDING_DEFINITIONS, 
  BUILDING_TYPES,
} from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLANET_SIZE = SCREEN_WIDTH * 0.95;
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

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function getFieldPositionsOnPlanet(): FieldPosition[] {
  const planetRadius = PLANET_SIZE * 0.45;
  const centerX = PLANET_SIZE / 2;
  const centerY = PLANET_SIZE / 2;
  
  const allSlots: { type: BuildingType; slotIndex: number }[] = [];
  
  for (let i = 0; i < 4; i++) allSlots.push({ type: BUILDING_TYPES.METAL_MINE, slotIndex: i });
  for (let i = 0; i < 4; i++) allSlots.push({ type: BUILDING_TYPES.CRYSTAL_REFINERY, slotIndex: i });
  for (let i = 0; i < 6; i++) allSlots.push({ type: BUILDING_TYPES.OXYGEN_PROCESSOR, slotIndex: i });
  for (let i = 0; i < 4; i++) allSlots.push({ type: BUILDING_TYPES.ENERGY_PLANT, slotIndex: i });
  
  const shuffledSlots: { type: BuildingType; slotIndex: number }[] = [];
  const indices = allSlots.map((_, i) => i);
  for (let i = 0; i < allSlots.length; i++) {
    const seed = i * 73 + 42;
    const randIndex = Math.floor(seededRandom(seed) * indices.length);
    shuffledSlots.push(allSlots[indices[randIndex]]);
    indices.splice(randIndex, 1);
  }
  
  const positions: FieldPosition[] = [];
  const totalSlots = shuffledSlots.length;
  
  shuffledSlots.forEach((slot, i) => {
    const seed = i * 97 + slot.slotIndex * 31;
    
    const baseAngle = (i / totalSlots) * 360;
    const angleOffset = (seededRandom(seed + 200) - 0.5) * 40;
    const angle = baseAngle + angleOffset;
    
    const minRadius = 0.15;
    const maxRadius = 0.85;
    const radiusVariation = seededRandom(seed + 300);
    const radius = (minRadius + radiusVariation * (maxRadius - minRadius)) * planetRadius;
    
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: slot.type,
      slotIndex: slot.slotIndex,
    });
  });
  
  return positions;
}

function getResourceColor(ratio: number): string {
  const safeRatio = Math.max(0, Math.min(ratio, 1));
  
  if (safeRatio < 0.2) {
    return "#E74C3C";
  } else if (safeRatio < 0.4) {
    return "#E67E22";
  } else if (safeRatio < 0.6) {
    return "#F1C40F";
  } else if (safeRatio < 0.8) {
    return "#A3D550";
  } else {
    return "#2ECC71";
  }
}

interface ResourceFieldProps {
  position: FieldPosition;
  building?: Building;
  onPress: () => void;
}

function ResourceField({ position, building, onPress }: ResourceFieldProps) {
  const isEmpty = !building;
  const color = BUILDING_COLORS[position.buildingType];
  
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[
        styles.fieldContainer,
        {
          left: position.x - FIELD_SIZE / 2,
          top: position.y - FIELD_SIZE / 2,
        },
      ]}
      testID={`resource-slot-${position.buildingType}-${position.slotIndex}`}
    >
      {isEmpty ? null : (
        <View style={styles.levelBadge}>
          <ThemedText style={[styles.levelNumber, { color }]}>{building.level}</ThemedText>
          {building.isConstructing ? (
            <View style={styles.constructingIndicator}>
              <Feather name="loader" size={10} color={GameColors.warning} />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

function ResourceProgressBar({ label, value, maxValue, rate }: { label: string; value: number; maxValue: number; rate?: number }) {
  const safeValue = Math.max(0, value);
  const ratio = Math.min(safeValue / maxValue, 1);
  const color = getResourceColor(ratio);
  
  return (
    <View style={styles.resourceBarItem}>
      <View style={styles.resourceBarHeader}>
        <ThemedText style={styles.resourceBarLabel}>{label}</ThemedText>
        {rate !== undefined ? (
          <ThemedText style={styles.resourceBarRate}>+{formatNumber(rate)}/h</ThemedText>
        ) : null}
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${ratio * 100}%`,
                backgroundColor: color,
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

function ResourceBar({ resources }: { resources?: PlayerResources }) {
  const metal = Math.max(0, resources?.metal ?? 0);
  const crystal = Math.max(0, resources?.crystal ?? 0);
  const oxygen = Math.max(0, resources?.oxygen ?? 0);
  const energy = Math.max(0, (resources?.energyProduction ?? 0) - (resources?.energyConsumption ?? 0));
  
  const maxResource = 100000;
  
  return (
    <View style={styles.resourceBar}>
      <ResourceProgressBar label="Metal" value={metal} maxValue={maxResource} rate={resources?.metalRate} />
      <ResourceProgressBar label="Crystal" value={crystal} maxValue={maxResource} rate={resources?.crystalRate} />
      <ResourceProgressBar label="O2" value={oxygen} maxValue={maxResource} rate={resources?.oxygenRate} />
      <ResourceProgressBar label="Energy" value={energy} maxValue={maxResource} />
    </View>
  );
}

export function ZoomedOutPlanet({ resources, buildings, onCityPress, onFieldPress }: ZoomedOutPlanetProps) {
  const rotation = useSharedValue(0);
  const cityGlow = useSharedValue(0);
  const cityScale = useSharedValue(1);

  const fieldPositions = useMemo(() => getFieldPositionsOnPlanet(), []);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 180000, easing: Easing.linear }),
      -1,
      false
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

  const cityGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cityGlow.value, [0.5, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(cityGlow.value, [0.5, 1], [1, 1.1]) }],
  }));

  const cityButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cityScale.value }],
  }));

  const handleCityPressIn = () => {
    cityScale.value = withSpring(0.92);
  };

  const handleCityPressOut = () => {
    cityScale.value = withSpring(1);
  };

  const resourceBuildings = buildings.filter(b => 
    b.buildingType === BUILDING_TYPES.METAL_MINE ||
    b.buildingType === BUILDING_TYPES.CRYSTAL_REFINERY ||
    b.buildingType === BUILDING_TYPES.OXYGEN_PROCESSOR ||
    b.buildingType === BUILDING_TYPES.ENERGY_PLANT
  );

  return (
    <View style={styles.container}>
      <ResourceBar resources={resources} />

      <View style={styles.planetContainer}>
        <Animated.View style={[styles.atmosphereRing, rotationStyle]} />
        
        <View style={styles.planetWrapper}>
          <Image
            source={require("../../assets/images/planet-resources.png")}
            style={styles.planetImage}
            resizeMode="cover"
          />
          
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
            <View style={styles.cityCore}>
              <Feather name="home" size={20} color={GameColors.primary} />
            </View>
            <View style={styles.cityLabel}>
              <ThemedText style={styles.cityLabelText}>CITY</ThemedText>
            </View>
          </AnimatedPressable>
        </View>
      </View>

      <View style={styles.legendContainer}>
        <ThemedText style={styles.legendTitle}>Tap resources to upgrade</ThemedText>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  resourceBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: Spacing.sm,
  },
  resourceBarItem: {
    alignItems: "center",
    gap: 2,
  },
  resourceBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  resourceBarLabel: {
    fontSize: 7,
    fontFamily: "Inter_500Medium",
    color: GameColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resourceBarRate: {
    fontSize: 7,
    fontFamily: "Orbitron_700Bold",
    color: GameColors.success,
  },
  progressBarContainer: {
    width: 50,
    height: 6,
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  planetContainer: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  atmosphereRing: {
    position: "absolute",
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    borderRadius: PLANET_SIZE / 2,
    borderWidth: 1,
    borderColor: "rgba(100, 210, 255, 0.15)",
  },
  planetWrapper: {
    width: PLANET_SIZE * 0.9,
    height: PLANET_SIZE * 0.9,
    borderRadius: PLANET_SIZE * 0.45,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
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
  },
  levelBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Orbitron_700Bold",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  constructingIndicator: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 3,
    borderRadius: 8,
  },
  cityGlow: {
    position: "absolute",
    left: PLANET_SIZE * 0.45 - 28,
    top: PLANET_SIZE * 0.45 - 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GameColors.primary,
  },
  cityButton: {
    position: "absolute",
    left: PLANET_SIZE * 0.45 - 22,
    top: PLANET_SIZE * 0.45 - 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  cityCore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GameColors.surface,
    borderWidth: 2,
    borderColor: GameColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cityLabel: {
    position: "absolute",
    bottom: -16,
    alignItems: "center",
  },
  cityLabelText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
    letterSpacing: 1,
  },
  legendContainer: {
    marginTop: Spacing.md,
    alignItems: "center",
  },
  legendTitle: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: GameColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  legend: {
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
