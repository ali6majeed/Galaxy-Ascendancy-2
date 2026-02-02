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

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { formatNumber, BuildingType, BUILDING_DEFINITIONS, BUILDING_TYPES } from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLANET_SIZE = SCREEN_WIDTH * 0.85;

interface Building {
  id: string;
  buildingType: BuildingType;
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
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function ResourceOrbit({ 
  icon, 
  rate, 
  color, 
  angle, 
  radius,
  delay = 0,
}: { 
  icon: any; 
  rate: number; 
  color: string; 
  angle: number; 
  radius: number;
  delay?: number;
}) {
  const pulse = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 + delay }),
        withTiming(0, { duration: 2000 + delay })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const floatY = interpolate(float.value, [0, 1], [0, -8]);
    return {
      transform: [{ translateY: floatY }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.7]),
  }));

  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <Animated.View 
      style={[
        styles.resourceOrbit,
        animatedStyle,
        { 
          left: PLANET_SIZE / 2 + x - 32,
          top: PLANET_SIZE / 2 + y - 32,
        }
      ]}
    >
      <Animated.View style={[styles.resourceGlow, glowStyle, { backgroundColor: color }]} />
      <View style={[styles.resourceBubble, { borderColor: color }]}>
        <Image source={icon} style={styles.resourceIcon} resizeMode="contain" />
      </View>
      <View style={[styles.rateTag, { backgroundColor: color }]}>
        <ThemedText style={styles.rateText}>+{formatNumber(rate)}/h</ThemedText>
      </View>
    </Animated.View>
  );
}

export function ZoomedOutPlanet({ resources, buildings, onCityPress }: ZoomedOutPlanetProps) {
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

  const buildingCount = buildings.length;

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

      <ResourceOrbit
        icon={require("../../assets/images/resource-metal.png")}
        rate={resources?.metalRate ?? 0}
        color={GameColors.metal}
        angle={-60}
        radius={PLANET_SIZE * 0.42}
        delay={0}
      />
      <ResourceOrbit
        icon={require("../../assets/images/resource-crystal.png")}
        rate={resources?.crystalRate ?? 0}
        color={GameColors.crystal}
        angle={60}
        radius={PLANET_SIZE * 0.42}
        delay={200}
      />
      <ResourceOrbit
        icon={require("../../assets/images/resource-oxygen.png")}
        rate={resources?.oxygenRate ?? 0}
        color={GameColors.oxygen}
        angle={180}
        radius={PLANET_SIZE * 0.42}
        delay={400}
      />

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
            <ThemedText style={styles.cityIcon}>🏙️</ThemedText>
          </View>
          <View style={styles.cityLabel}>
            <ThemedText style={styles.cityLabelText}>ENTER CITY</ThemedText>
            <ThemedText style={styles.buildingCountText}>
              {buildingCount} {buildingCount === 1 ? "building" : "buildings"}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>

      <View style={styles.tapHint}>
        <ThemedText style={styles.tapHintText}>
          Tap the city center to manage buildings
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: PLANET_SIZE,
    height: PLANET_SIZE + 60,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitRing: {
    position: "absolute",
    width: PLANET_SIZE * 1.1,
    height: PLANET_SIZE * 1.1,
    borderRadius: PLANET_SIZE * 0.55,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.2)",
    alignItems: "center",
    justifyContent: "flex-start",
    top: (PLANET_SIZE + 60 - PLANET_SIZE * 1.1) / 2 - 30,
  },
  orbitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GameColors.primary,
    marginTop: -3,
  },
  planetWrapper: {
    width: PLANET_SIZE * 0.9,
    height: PLANET_SIZE * 0.9,
    borderRadius: PLANET_SIZE * 0.45,
    overflow: "hidden",
    position: "absolute",
    top: 30,
  },
  planetImage: {
    width: "100%",
    height: "100%",
  },
  resourceOrbit: {
    position: "absolute",
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  resourceGlow: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  resourceBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GameColors.surface,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  resourceIcon: {
    width: 28,
    height: 28,
  },
  rateTag: {
    position: "absolute",
    bottom: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 2,
  },
  rateText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.textPrimary,
  },
  cityGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: GameColors.primary,
    top: PLANET_SIZE / 2 - 20,
  },
  cityButton: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    top: PLANET_SIZE / 2 - 15,
  },
  cityInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cityPulseRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: GameColors.primary,
    opacity: 0.5,
  },
  cityCore: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: GameColors.surface,
    borderWidth: 3,
    borderColor: GameColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  cityIcon: {
    fontSize: 28,
  },
  cityLabel: {
    position: "absolute",
    bottom: -40,
    alignItems: "center",
  },
  cityLabelText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Orbitron_700Bold",
    color: GameColors.primary,
    letterSpacing: 1,
  },
  buildingCountText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: GameColors.textSecondary,
    marginTop: 2,
  },
  tapHint: {
    position: "absolute",
    bottom: -20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tapHintText: {
    fontSize: 11,
    color: GameColors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
});
