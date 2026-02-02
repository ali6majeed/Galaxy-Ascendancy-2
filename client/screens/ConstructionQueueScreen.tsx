import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { GameColors, Spacing, BorderRadius } from "@/constants/theme";
import { formatTime, BUILDING_DEFINITIONS, BuildingType } from "@/constants/gameData";

interface ConstructionItem {
  id: string;
  buildingType: string;
  buildingName: string;
  targetLevel: number;
  completesAt: number;
}

function ConstructionItemCard({ item, index }: { item: ConstructionItem; index: number }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const remaining = Math.max(0, item.completesAt - Date.now());
      setTimeRemaining(Math.floor(remaining / 1000));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [item.completesAt]);

  const progress = Math.min(1, 1 - timeRemaining / 300);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      style={styles.itemCard}
    >
      <View style={styles.queueNumber}>
        <ThemedText style={styles.queueNumberText}>{index + 1}</ThemedText>
      </View>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName}>
          {item.buildingName} Lv.{item.targetLevel}
        </ThemedText>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
        </View>
        <ThemedText style={styles.itemTime}>{formatTime(timeRemaining)}</ThemedText>
      </View>
      {index === 0 ? (
        <View style={styles.activeIndicator}>
          <Feather name="loader" size={18} color={GameColors.accent} />
        </View>
      ) : (
        <View style={styles.queuedIndicator}>
          <Feather name="clock" size={18} color={GameColors.textTertiary} />
        </View>
      )}
    </Animated.View>
  );
}

export default function ConstructionQueueScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const { data: constructionQueue, isLoading } = useQuery<ConstructionItem[]>({
    queryKey: ["/api/player/construction"],
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={constructionQueue || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
          flexGrow: 1,
        }}
        renderItem={({ item, index }) => (
          <ConstructionItemCard item={item} index={index} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            image={require("../../assets/images/empty-construction.png")}
            title="Queue Empty"
            description="No active construction. Visit your planet to start building."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GameColors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  queueNumber: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: GameColors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  queueNumberText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Orbitron_600SemiBold",
    color: GameColors.textSecondary,
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    color: GameColors.textPrimary,
  },
  progressContainer: {
    height: 4,
    backgroundColor: GameColors.surfaceElevated,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: GameColors.accent,
  },
  itemTime: {
    fontSize: 12,
    fontFamily: "Orbitron_500Medium",
    color: GameColors.accent,
  },
  activeIndicator: {
    padding: Spacing.xs,
  },
  queuedIndicator: {
    padding: Spacing.xs,
  },
});
