import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AllianceScreen from "@/screens/AllianceScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type AllianceStackParamList = {
  Alliance: undefined;
};

const Stack = createNativeStackNavigator<AllianceStackParamList>();

export default function AllianceStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Alliance"
        component={AllianceScreen}
        options={{
          title: "Alliance",
        }}
      />
    </Stack.Navigator>
  );
}
