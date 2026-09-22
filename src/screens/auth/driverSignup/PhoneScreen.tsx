import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { maskPhone, onlyDigits } from '../../../utils/registrationHelpers';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverPhoneScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [phone, setPhone] = useState(data.phone);
  const valid = onlyDigits(phone).length >= 10 && onlyDigits(phone).length <= 11;

  function handleContinue() {
    update({ phone });
    navigation.navigate('DriverEmail');
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('celular')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={!valid} />}
    >
      <Text style={styles.title}>Digite seu celular</Text>
      <TextField label="Celular" value={phone} onChangeText={t => setPhone(maskPhone(t))} placeholder="(00) 00000-0000" keyboardType="phone-pad" maxLength={16} />
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
});
