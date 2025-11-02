import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';

import LandingScreen from '../screens/LandingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EmailSettingsScreen from '../screens/EmailSettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isSignedIn ? (
          <Stack.Screen name="Landing" component={LandingScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen
              name="EmailSettings"
              component={EmailSettingsScreen}
              options={{ headerShown: true, title: 'Email Settings' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

