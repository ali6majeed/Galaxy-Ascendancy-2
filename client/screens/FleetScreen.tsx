import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { EmptyState } from "@/components/EmptyState";
import { GameColors, Spacing } from "@/constants/theme";

export default function FleetScreen() {
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
        image={require("../../assets/images/empty-fleet.png")}
        title="Hangar Empty"
        description="Build a Fleet Dock on the Orbit layer to start constructing your first spacecraft."
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
