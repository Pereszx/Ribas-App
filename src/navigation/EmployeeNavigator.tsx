import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ScannerScreen from '../screens/employee/ScannerScreen';
import MyDocumentsScreen from '../screens/employee/MyDocumentsScreen';
import VehicleDetailScreen from '../screens/employee/VehicleDetailScreen';
import VehicleViewScreen from '../screens/employee/VehicleViewScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function EmployeeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { paddingBottom: 6, height: 60 },
        tabBarIcon: ({ color, size }) => {
          const icons: any = {
            'Scanner': 'qr-code-outline',
            'Veículos': 'car-outline',
            'Meus Docs': 'folder-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Veículos" component={VehicleDetailScreen} />
      <Tab.Screen name="Meus Docs" component={MyDocumentsScreen} />
    </Tab.Navigator>
  );
}

export default function EmployeeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EmployeeTabs" component={EmployeeTabs} />
      <Stack.Screen name="VehicleView" component={VehicleViewScreen} />
    </Stack.Navigator>
  );
}