import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ScannerScreen from '../screens/employee/ScannerScreen';
import ReportScreen from '../screens/employee/ReportScreen';
import MyDocumentsScreen from '../screens/employee/MyDocumentsScreen';

const Tab = createBottomTabNavigator();

export default function EmployeeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: { paddingBottom: 6, height: 60 },
        tabBarIcon: ({ color, size }) => {
          const icons: any = {
            Scanner: 'qr-code-outline',
            Relatórios: 'document-text-outline',
            'Meus Docs': 'folder-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Relatórios" component={ReportScreen} />
      <Tab.Screen name="Meus Docs" component={MyDocumentsScreen} />
    </Tab.Navigator>
  );
}