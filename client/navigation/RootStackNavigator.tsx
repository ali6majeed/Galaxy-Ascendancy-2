import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import BuildingDetailScreen from "@/screens/BuildingDetailScreen";
import ConstructionQueueScreen from "@/screens/ConstructionQueueScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { BuildingType } from "@/constants/gameData";

export type RootStackParamList = {
  Main: undefined;
  BuildingDetail: {
    buildingType: BuildingType;
    level: number;
  };
  ConstructionQueue: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BuildingDetail"
        component={BuildingDetailScreen}
        options={{
          presentation: "modal",
          headerTitle: "Building Details",
        }}
      />
      <Stack.Screen
        name="ConstructionQueue"
        component={ConstructionQueueScreen}
        options={{
          presentation: "modal",
          headerTitle: "Construction Queue",
        }}
      />
    </Stack.Navigator>
  );
}
