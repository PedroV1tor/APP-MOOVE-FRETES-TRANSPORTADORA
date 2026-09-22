import React, { useState } from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { maskCEP, onlyDigits, lookupCEP } from '../../../utils/registrationHelpers';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverCepScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [cep, setCep] = useState(data.cep);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      const addr = await lookupCEP(cep);
      if (!addr) {
        Alert.alert('CEP não encontrado', 'Confira o CEP digitado e tente novamente.');
        return;
      }
      update({
        cep: onlyDigits(cep),
        street: addr.logradouro || '',
        neighborhood: addr.bairro || '',
        city: addr.localidade || '',
        uf: addr.uf || '',
      });
      navigation.navigate('DriverAddressConfirm');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('cep')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={onlyDigits(cep).length !== 8} loading={loading} />}
    >
      <Text style={styles.title}>Digite seu CEP</Text>
      <TextField label="CEP" value={cep} onChangeText={t => setCep(maskCEP(t))} placeholder="00000-000" keyboardType="numeric" maxLength={9} />
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
});
