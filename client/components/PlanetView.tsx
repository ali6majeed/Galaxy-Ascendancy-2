import React, { useEffect } from "react";
import { View, StyleSheet, Image, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

import { GameColors } from "@/constants/theme";
import { LayerType, LAYER_TYPES } from "@/constants/gameData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLANET_SIZE = SCREEN_WIDTH * 0.85;

interface PlanetViewProps {
  activeLayer: LayerType;
}

const layerImages = {
  [LAYER_TYPES.ORBIT]: require("../../assets/images/planet-orbit-layer.png"),
  [LAYER_TYPES.SURFACE]: require("../../assets/images/planet-surface-layer.png"),
  [LAYER_TYPES.CORE]: require("../../assets/images/planet-core-layer.png"),
};

export function PlanetView({ activeLayer }: PlanetViewProps) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.02]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.9, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1.1, 1.2]) }],
  }));

  const getGlowColor = () => {
    switch (activeLayer) {
      case LAYER_TYPES.ORBIT:
        return GameColors.primary;
      case LAYER_TYPES.SURFACE:
        return GameColors.success;
      case LAYER_TYPES.CORE:
        return GameColors.energy;
      default:
        return GameColors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowOuter, glowStyle, { backgroundColor: getGlowColor() }]} />
      <Animated.View style={[styles.planetContainer, pulseStyle]}>
        <Animated.Image
          key={activeLayer}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          source={layerImages[activeLayer]}
          style={[styles.planetImage]}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.View style={[styles.orbitRing, rotationStyle]}>
        <View style={styles.orbitDot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  glowOuter: {
    position: "absolute",
    width: PLANET_SIZE,
    height: PLANET_SIZE,
    borderRadius: PLANET_SIZE / 2,
  },
  planetContainer: {
    width: PLANET_SIZE * 0.9,
    height: PLANET_SIZE * 0.9,
    borderRadius: PLANET_SIZE * 0.45,
    overflow: "hidden",
    backgroundColor: GameColors.background,
  },
  planetImage: {
    width: "100%",
    height: "100%",
  },
  orbitRing: {
    position: "absolute",
    width: PLANET_SIZE * 1.1,
    height: PLANET_SIZE * 1.1,
    borderRadius: PLANET_SIZE * 0.55,
    borderWidth: 1,
    borderColor: "rgba(10, 132, 255, 0.3)",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  orbitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GameColors.primary,
    marginTop: -4,
  },
});
