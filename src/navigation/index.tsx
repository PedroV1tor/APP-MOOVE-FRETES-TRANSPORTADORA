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
import { UserTypeSelectionScreen } from '../screens/auth/UserTypeSelectionScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { AccessDeniedScreen } from '../screens/auth/AccessDeniedScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { DriverHomeScreen } from '../screens/DriverHomeScreen';
import { FreightsScreen } from '../screens/FreightsScreen';
import { FreightDetailScreen } from '../screens/FreightDetailScreen';
import { CreateFreightScreen } from '../screens/CreateFreightScreen';
import { DriversScreen } from '../screens/DriversScreen';
import { DriverDetailScreen } from '../screens/DriverDetailScreen';
import { ChatListScreen } from '../screens/ChatListScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DriverProfileScreen } from '../screens/DriverProfileScreen';
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

/**
 * Motorista usa a mesma tela (FreightsScreen já se adapta sozinha quando o
 * usuário é caminhoneiro: some a aba "Meus Fretes" e o botão de publicar),
 * só sem a rota CreateFreight — motorista nunca deveria conseguir chegar lá.
 */
function DriverFreightsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FreightsList" component={FreightsScreen} />
      <Stack.Screen name="FreightDetail" component={FreightDetailScreen} />
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

function useUnreadMessages(userId: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', userId)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }, [userId]);

  useEffect(() => {
    loadUnread();
    if (!userId) return;
    const channel = supabase
      .channel(`tab-badge-msgs-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, loadUnread]);

  return unreadCount;
}

const tabScreenOptions = ({ route }: any) => ({
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
    fontWeight: '600' as const,
    marginTop: 0,
  },
  tabBarIcon: ({ focused, color }: any) => {
    const icon = TAB_ICONS[route.name];
    return (
      <Ionicons
        name={(focused ? icon?.active : icon?.inactive) as any}
        size={22}
        color={color}
      />
    );
  },
});

/** Transportadora, embarcador, agenciador e colaboradores — publicam frete e gerenciam motoristas. */
function CarrierTabs() {
  const { user } = useAuth();
  const unreadCount = useUnreadMessages(user?.id);

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
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

/**
 * Motorista — só vê o que é relevante pra ele: início, chat e o próprio
 * perfil. Não vê "Fretes" (publicar/gerenciar) nem "Motoristas" (gestão de
 * frota), que são ações de quem contrata, não de quem dirige.
 */
function DriverTabs() {
  const { user } = useAuth();
  const unreadCount = useUnreadMessages(user?.id);

  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen name="HomeTab" component={DriverHomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="FreightsTab" component={DriverFreightsStack} options={{ title: 'Fretes' }} />
      <Tab.Screen
        name="ChatTab"
        component={ChatStack}
        options={{
          title: 'Chat',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.primary, fontSize: 10, fontWeight: '700' },
        }}
      />
      <Tab.Screen name="ProfileTab" component={DriverProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  return user?.profile?.user_type === 'caminhoneiro' ? <DriverTabs /> : <CarrierTabs />;
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

const ALLOWED_USER_TYPES = ['transportadora', 'embarcador', 'agenciador', 'shipper', 'carrier', 'collaborator', 'caminhoneiro'];

function isAllowedUser(userType: string | null | undefined): boolean {
  return !!userType && ALLOWED_USER_TYPES.includes(userType);
}

export function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const authenticated = !!user;
  const allowed = authenticated && isAllowedUser(user.profile?.user_type);

  return (
    <NavigationContainer linking={linking} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authenticated && !allowed ? (
          <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} />
        ) : allowed ? (
          <>
            <Stack.Screen name="Main"            component={MainTabs} />
            <Stack.Screen name="FreightDetail"   component={FreightDetailScreen} />
            <Stack.Screen name="CreateFreight"   component={CreateFreightScreen} />
            <Stack.Screen name="DriverDetail"    component={DriverDetailScreen} />
            <Stack.Screen name="Notifications"   component={NotificationsScreen} />
            <Stack.Screen name="Settings"        component={SettingsScreen} />
            <Stack.Screen name="ResetPassword"   component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="UserTypeSelection" component={UserTypeSelectionScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
