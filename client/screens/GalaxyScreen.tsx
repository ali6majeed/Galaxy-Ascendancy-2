import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { EmptyState } from "@/components/EmptyState";
import { GameColors, Spacing } from "@/constants/theme";

export default function GalaxyScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
        },
      ]}
    >
      <EmptyState
        image={require("../../assets/images/empty-galaxy-search.png")}
        title="Galaxy Awaits"
        description="The galaxy map will show other players, neutral zones, and the Ideal Planet at the center. Coming soon..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
    paddingHorizontal: Spacing.lg,
  },
});
