import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/admin/DashboardScreen';
import VehiclesScreen from '../screens/admin/VehiclesScreen';
import MaintenanceScreen from '../screens/admin/MaintenanceScreen';
import HRScreen from '../screens/admin/HRScreen';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { paddingBottom: 6, height: 60 },
        tabBarIcon: ({ color, size }) => {
          const icons: any = {
            Dashboard: 'home-outline',
            Veículos: 'car-outline',
            Manutenções: 'construct-outline',
            RH: 'people-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Veículos" component={VehiclesScreen} />
      <Tab.Screen name="Manutenções" component={MaintenanceScreen} />
      <Tab.Screen name="RH" component={HRScreen} />
    </Tab.Navigator>
  );
}