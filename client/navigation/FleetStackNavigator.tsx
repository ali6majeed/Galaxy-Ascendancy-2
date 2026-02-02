import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import FleetScreen from "@/screens/FleetScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type FleetStackParamList = {
  Fleet: undefined;
};

const Stack = createNativeStackNavigator<FleetStackParamList>();

export default function FleetStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Fleet"
        component={FleetScreen}
        options={{
          title: "Fleet",
        }}
      />
    </Stack.Navigator>
  );
}
