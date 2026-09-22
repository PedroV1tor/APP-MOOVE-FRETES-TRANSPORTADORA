import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DriverSignupProvider } from '../contexts/DriverSignupContext';
import { DriverCpfScreen } from '../screens/auth/driverSignup/CpfScreen';
import { DriverNameScreen } from '../screens/auth/driverSignup/NameScreen';
import { DriverPhoneScreen } from '../screens/auth/driverSignup/PhoneScreen';
import { DriverEmailScreen } from '../screens/auth/driverSignup/EmailScreen';
import { DriverCepScreen } from '../screens/auth/driverSignup/CepScreen';
import { DriverAddressConfirmScreen } from '../screens/auth/driverSignup/AddressConfirmScreen';
import { DriverPersonalConfirmScreen } from '../screens/auth/driverSignup/PersonalConfirmScreen';
import { DriverVehicleDataScreen } from '../screens/auth/driverSignup/VehicleDataScreen';
import { DriverVehicleTypeScreen } from '../screens/auth/driverSignup/VehicleTypeScreen';
import { DriverBodyTypeScreen } from '../screens/auth/driverSignup/BodyTypeScreen';
import { DriverTrackerScreen } from '../screens/auth/driverSignup/TrackerScreen';
import { DriverPlateRntrcScreen } from '../screens/auth/driverSignup/PlateRntrcScreen';
import { DriverCnhUploadScreen } from '../screens/auth/driverSignup/CnhUploadScreen';
import { DriverSelfieScreen } from '../screens/auth/driverSignup/SelfieScreen';
import { DriverPasswordScreen } from '../screens/auth/driverSignup/PasswordScreen';

const Stack = createNativeStackNavigator();

/** Cadastro de motorista em etapas (uma tela por passo), no mesmo formato do app Fretebras. */
export function DriverSignupNavigator() {
  return (
    <DriverSignupProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="DriverCpf">
        <Stack.Screen name="DriverCpf" component={DriverCpfScreen} />
        <Stack.Screen name="DriverName" component={DriverNameScreen} />
        <Stack.Screen name="DriverPhone" component={DriverPhoneScreen} />
        <Stack.Screen name="DriverEmail" component={DriverEmailScreen} />
        <Stack.Screen name="DriverCep" component={DriverCepScreen} />
        <Stack.Screen name="DriverAddressConfirm" component={DriverAddressConfirmScreen} />
        <Stack.Screen name="DriverPersonalConfirm" component={DriverPersonalConfirmScreen} />
        <Stack.Screen name="DriverVehicleData" component={DriverVehicleDataScreen} />
        <Stack.Screen name="DriverVehicleType" component={DriverVehicleTypeScreen} />
        <Stack.Screen name="DriverBodyType" component={DriverBodyTypeScreen} />
        <Stack.Screen name="DriverTracker" component={DriverTrackerScreen} />
        <Stack.Screen name="DriverPlateRntrc" component={DriverPlateRntrcScreen} />
        <Stack.Screen name="DriverCnhUpload" component={DriverCnhUploadScreen} />
        <Stack.Screen name="DriverSelfie" component={DriverSelfieScreen} />
        <Stack.Screen name="DriverPassword" component={DriverPasswordScreen} />
      </Stack.Navigator>
    </DriverSignupProvider>
  );
}
