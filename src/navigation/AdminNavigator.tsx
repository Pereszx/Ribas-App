import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/admin/DashboardScreen';
import VehiclesScreen from '../screens/admin/VehiclesScreen';
import MaintenanceScreen from '../screens/admin/MaintenanceScreen';
import HRScreen from '../screens/admin/HRScreen';
import VehicleDetailAdminScreen from '../screens/admin/VehicleDetailAdminScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AdminTabs() {
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
            'Veículos': 'car-outline',
            'Manutenções': 'construct-outline',
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

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailAdminScreen} />
    </Stack.Navigator>
  );
}