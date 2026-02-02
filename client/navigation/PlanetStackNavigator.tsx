import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PlanetScreen from "@/screens/PlanetScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PlanetStackParamList = {
  Planet: undefined;
};

const Stack = createNativeStackNavigator<PlanetStackParamList>();

export default function PlanetStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Planet"
        component={PlanetScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Galaxy Ascendancy" />,
        }}
      />
    </Stack.Navigator>
  );
}
