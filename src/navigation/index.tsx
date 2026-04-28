import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import { navigationRef } from './navigationRef';
import { supabase } from '../lib/supabase';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { FreightsScreen } from '../screens/FreightsScreen';
import { FreightDetailScreen } from '../screens/FreightDetailScreen';
import { CreateFreightScreen } from '../screens/CreateFreightScreen';
import { DriversScreen } from '../screens/DriversScreen';
import { DriverDetailScreen } from '../screens/DriverDetailScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function FreightsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FreightsList" component={FreightsScreen} />
      <Stack.Screen name="FreightDetail" component={FreightDetailScreen} />
      <Stack.Screen name="CreateFreight" component={CreateFreightScreen} />
    </Stack.Navigator>
  );
}

function DriversStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriversList" component={DriversScreen} />
      <Stack.Screen name="DriverDetail" component={DriverDetailScreen} />
    </Stack.Navigator>
  );
}

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  HomeTab:      { active: 'home',           inactive: 'home-outline' },
  FreightsTab:  { active: 'document-text',  inactive: 'document-text-outline' },
  DriversTab:   { active: 'people',         inactive: 'people-outline' },
  ChatTab:      { active: 'chatbubbles',    inactive: 'chatbubbles-outline' },
  ProfileTab:   { active: 'person',         inactive: 'person-outline' },
};

function MainTabs() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => {
    loadUnread();
    if (!user) return;
    const channel = supabase
      .channel(`tab-badge-msgs-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, loadUnread]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
        },
        tabBarIcon: ({ focused, color }) => {
          const icon = TAB_ICONS[route.name];
          return (
            <Ionicons
              name={(focused ? icon?.active : icon?.inactive) as any}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab"      component={HomeScreen}     options={{ title: 'Início' }} />
      <Tab.Screen name="FreightsTab"  component={FreightsStack}  options={{ title: 'Fretes' }} />
      <Tab.Screen name="DriversTab"   component={DriversStack}   options={{ title: 'Motoristas' }} />
      <Tab.Screen
        name="ChatTab"
        component={ChatStack}
        options={{
          title: 'Chat',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.primary, fontSize: 10, fontWeight: '700' },
        }}
      />
      <Tab.Screen name="ProfileTab"   component={ProfileScreen}  options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const linking = {
  prefixes: ['moovefretes://'],
  config: {
    screens: {
      Main: {
        screens: {
          FreightsTab: { screens: { FreightsList: 'fretes' } },
          ChatTab:     { screens: { ChatList: 'mensagens', Chat: 'chat/:conversationId' } },
        },
      },
      Notifications: 'notificacoes',
      ResetPassword: 'reset-password',
    },
  },
};

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main"            component={MainTabs} />
            <Stack.Screen name="FreightDetail"   component={FreightDetailScreen} />
            <Stack.Screen name="CreateFreight"   component={CreateFreightScreen} />
            <Stack.Screen name="DriverDetail"    component={DriverDetailScreen} />
            <Stack.Screen name="Notifications"   component={NotificationsScreen} />
            <Stack.Screen name="Settings"        component={SettingsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
