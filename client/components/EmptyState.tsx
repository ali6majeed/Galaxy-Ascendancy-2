import React from "react";
import { View, StyleSheet, Image, ImageSourcePropType } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";

interface EmptyStateProps {
  image: ImageSourcePropType;
  title: string;
  description: string;
}

export function EmptyState({ image, title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={styles.description}>{description}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    gap: Spacing.lg,
  },
  image: {
    width: 150,
    height: 150,
    opacity: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: GameColors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
