import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { inRange } from '../../../utils/registrationHelpers';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverNameScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [name, setName] = useState(data.name);

  function handleContinue() {
    update({ name: name.trim() });
    navigation.navigate('DriverPhone');
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('nome')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={!inRange(name, 3, 100)} />}
    >
      <Text style={styles.title}>Digite seu nome</Text>
      <TextField label="Nome completo" value={name} onChangeText={setName} placeholder="Digite seu nome completo" maxLength={100} />
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
});
