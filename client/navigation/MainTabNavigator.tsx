import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";

import PlanetStackNavigator from "@/navigation/PlanetStackNavigator";
import GalaxyStackNavigator from "@/navigation/GalaxyStackNavigator";
import FleetStackNavigator from "@/navigation/FleetStackNavigator";
import AllianceStackNavigator from "@/navigation/AllianceStackNavigator";
import { GameColors } from "@/constants/theme";

export type MainTabParamList = {
  PlanetTab: undefined;
  GalaxyTab: undefined;
  FleetTab: undefined;
  AllianceTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="PlanetTab"
      screenOptions={{
        tabBarActiveTintColor: GameColors.primary,
        tabBarInactiveTintColor: GameColors.textSecondary,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: GameColors.surface,
            web: GameColors.surface,
          }),
          borderTopWidth: 0,
          borderTopColor: "transparent",
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="PlanetTab"
        component={PlanetStackNavigator}
        options={{
          title: "Planet",
          tabBarIcon: ({ color, size }) => (
            <Feather name="globe" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="GalaxyTab"
        component={GalaxyStackNavigator}
        options={{
          title: "Galaxy",
          tabBarIcon: ({ color, size }) => (
            <Feather name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FleetTab"
        component={FleetStackNavigator}
        options={{
          title: "Fleet",
          tabBarIcon: ({ color, size }) => (
            <Feather name="navigation" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AllianceTab"
        component={AllianceStackNavigator}
        options={{
          title: "Alliance",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
