import type { Freight, Driver } from './index';

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  FreightDetail: { freight: Freight };
  CreateFreight: { editFreight?: Freight } | undefined;
  DriverDetail: { driver: Driver };
  Chat: {
    conversationId?: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    source?: 'direct' | 'freight' | 'route';
    sourceId?: string;
    originCity?: string;
    originState?: string;
    destinationCity?: string;
    destinationState?: string;
    initialMessage?: string;
  };
  Notifications: undefined;
  Settings: { page?: string } | undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  FreightsTab: undefined;
  DriversTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

export type FreightsStackParamList = {
  FreightsList: undefined;
  FreightDetail: { freight: Freight };
  CreateFreight: { editFreight?: Freight } | undefined;
};

export type DriversStackParamList = {
  DriversList: undefined;
  DriverDetail: { driver: Driver };
};

export type ChatStackParamList = {
  ChatList: undefined;
  Chat: RootStackParamList['Chat'];
};
