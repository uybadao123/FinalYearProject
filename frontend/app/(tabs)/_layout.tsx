// (tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#1B5E20',
      tabBarInactiveTintColor: '#BDC3C7',
      tabBarStyle: {
        height: 65,
        paddingBottom: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F3F4',
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      headerShown: false,
    }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={28} color={color} />,
        }}
      />
      
      {/* Central management for Zones and Plots */}
      <Tabs.Screen
        name="garden" 
        options={{
          title: 'Garden',
          tabBarIcon: ({ color }) => <MaterialIcons name="local-florist" size={28} color={color} />,
        }}
      />

      {/* Botanical reference and crop profiles */}
      <Tabs.Screen
        name="handbook"
        options={{
          title: 'Handbook',
          tabBarIcon: ({ color }) => <MaterialIcons name="menu-book" size={28} color={color} />,
        }}
      />

        {/* User profile and settings */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}