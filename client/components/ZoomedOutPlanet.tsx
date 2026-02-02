import React, { useEffect, useMemo } from "react";
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
const PLANET_SIZE = SCREEN_WIDTH * 0.95;
const FIELD_SIZE = 42;

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
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function getFieldPositionsOnPlanet(): FieldPosition[] {
  const planetRadius = PLANET_SIZE * 0.45;
  const centerX = PLANET_SIZE / 2;
  const centerY = PLANET_SIZE / 2;
  const positions: FieldPosition[] = [];
  
  const metalZone = { startAngle: 200, endAngle: 260, innerRadius: 0.25, outerRadius: 0.42 };
  for (let i = 0; i < 4; i++) {
    const seed = 100 + i;
    const angleRange = metalZone.endAngle - metalZone.startAngle;
    const angle = metalZone.startAngle + (i / 4) * angleRange + seededRandom(seed) * 12;
    const radiusRange = metalZone.outerRadius - metalZone.innerRadius;
    const radius = (metalZone.innerRadius + seededRandom(seed + 50) * radiusRange) * planetRadius;
    
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.METAL_MINE,
      slotIndex: i,
    });
  }
  
  const crystalZone = { startAngle: 280, endAngle: 350, innerRadius: 0.2, outerRadius: 0.4 };
  for (let i = 0; i < 4; i++) {
    const seed = 200 + i;
    const angleRange = crystalZone.endAngle - crystalZone.startAngle;
    const angle = crystalZone.startAngle + (i / 4) * angleRange + seededRandom(seed) * 15;
    const radiusRange = crystalZone.outerRadius - crystalZone.innerRadius;
    const radius = (crystalZone.innerRadius + seededRandom(seed + 50) * radiusRange) * planetRadius;
    
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.CRYSTAL_REFINERY,
      slotIndex: i,
    });
  }
  
  const oxygenZone = { startAngle: 20, endAngle: 110, innerRadius: 0.15, outerRadius: 0.4 };
  for (let i = 0; i < 6; i++) {
    const seed = 300 + i;
    const angleRange = oxygenZone.endAngle - oxygenZone.startAngle;
    const angle = oxygenZone.startAngle + (i / 6) * angleRange + seededRandom(seed) * 12;
    const radiusRange = oxygenZone.outerRadius - oxygenZone.innerRadius;
    const radius = (oxygenZone.innerRadius + seededRandom(seed + 50) * radiusRange) * planetRadius;
    
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR,
      slotIndex: i,
    });
  }
  
  const energyZone = { startAngle: 130, endAngle: 190, innerRadius: 0.2, outerRadius: 0.42 };
  for (let i = 0; i < 4; i++) {
    const seed = 400 + i;
    const angleRange = energyZone.endAngle - energyZone.startAngle;
    const angle = energyZone.startAngle + (i / 4) * angleRange + seededRandom(seed) * 12;
    const radiusRange = energyZone.outerRadius - energyZone.innerRadius;
    const radius = (energyZone.innerRadius + seededRandom(seed + 50) * radiusRange) * planetRadius;
    
    positions.push({
      x: centerX + Math.cos((angle * Math.PI) / 180) * radius,
      y: centerY + Math.sin((angle * Math.PI) / 180) * radius,
      buildingType: BUILDING_TYPES.ENERGY_PLANT,
      slotIndex: i,
    });
  }
  
  return positions;
}

interface ResourceFieldProps {
  position: FieldPosition;
  building?: Building;
  onPress: () => void;
}

function ResourceField({ position, building, onPress }: ResourceFieldProps) {
  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  
  const isEmpty = !building;
  const canUpgrade = building && !building.isConstructing;
  const color = BUILDING_COLORS[position.buildingType];
  const fieldImage = FIELD_IMAGES[position.buildingType];
  
  useEffect(() => {
    if (canUpgrade) {
      pulseAnim.value = withRepeat(
        withTiming(1.12, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      glowAnim.value = withRepeat(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (isEmpty) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [canUpgrade, isEmpty]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0, 0.6]),
    transform: [{ scale: interpolate(glowAnim.value, [0, 1], [1, 1.3]) }],
  }));
  
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
    >
      {canUpgrade ? (
        <Animated.View style={[styles.fieldGlow, glowStyle, { backgroundColor: color }]} />
      ) : null}
      
      <Animated.View style={[styles.fieldInner, animatedStyle]}>
        <Image 
          source={fieldImage} 
          style={[styles.fieldImage, isEmpty ? styles.emptyFieldImage : null]} 
          resizeMode="cover" 
        />
        
        {isEmpty ? (
          <View style={styles.emptyOverlay}>
            <View style={[styles.buildIndicator, { backgroundColor: color }]}>
              <Feather name="plus" size={14} color="#FFF" />
            </View>
          </View>
        ) : (
          <>
            <View style={[styles.levelBadge, { backgroundColor: color }]}>
              <ThemedText style={styles.levelText}>{building.level}</ThemedText>
            </View>
            {building.isConstructing ? (
              <View style={styles.constructingIndicator}>
                <Feather name="loader" size={10} color={GameColors.warning} />
              </View>
            ) : null}
          </>
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

  const fieldPositions = useMemo(() => getFieldPositionsOnPlanet(), []);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 180000, easing: Easing.linear }),
      -1,
      false
    );
    planetPulse.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
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

      <View style={styles.planetContainer}>
        <Animated.View style={[styles.atmosphereRing, rotationStyle]} />
        
        <View style={styles.planetWrapper}>
          <Image
            source={require("../../assets/images/planet-surface-layer.png")}
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
  resourceSummaryContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  resourceSummary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  resourceSummaryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GameColors.surface,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceSummaryImage: {
    width: 12,
    height: 12,
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
    fontSize: 7,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
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
  fieldGlow: {
    position: "absolute",
    width: FIELD_SIZE + 20,
    height: FIELD_SIZE + 20,
    borderRadius: (FIELD_SIZE + 20) / 2,
  },
  fieldInner: {
    width: FIELD_SIZE,
    height: FIELD_SIZE,
    borderRadius: FIELD_SIZE / 2,
    overflow: "hidden",
  },
  fieldImage: {
    width: "100%",
    height: "100%",
  },
  emptyFieldImage: {
    opacity: 0.4,
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  buildIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  levelBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 18,
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
    top: 0,
    left: 0,
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
