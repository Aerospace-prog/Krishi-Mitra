import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, Redirect } from 'expo-router';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <>
      <SignedOut>
        <Redirect href="/(public)/landing" />
      </SignedOut>
      <SignedIn>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: useClientOnlyValue(false, true),
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Recommend',
              tabBarIcon: ({ color }) => <TabBarIcon name="leaf" color={color} />,
            }}
          />
          <Tabs.Screen
            name="two"
            options={{
              title: 'History',
              tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
            }}
          />
        </Tabs>
      </SignedIn>
    </>
  );
}
