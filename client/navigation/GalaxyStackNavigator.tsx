import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import GalaxyScreen from "@/screens/GalaxyScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type GalaxyStackParamList = {
  Galaxy: undefined;
};

const Stack = createNativeStackNavigator<GalaxyStackParamList>();

export default function GalaxyStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Galaxy"
        component={GalaxyScreen}
        options={{
          title: "Galaxy",
        }}
      />
    </Stack.Navigator>
  );
}
