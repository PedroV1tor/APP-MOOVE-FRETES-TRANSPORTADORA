import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabase';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton, CheckboxRow } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { TermsAcceptSheet } from '../../../components/registration/TermsAcceptSheet';
import { maskCPF, validateCPF, onlyDigits } from '../../../utils/registrationHelpers';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';

const REMEMBER_CPF_KEY = 'driverSignup:lastCpf';

export function DriverCpfScreen({ navigation }: any) {
  const { update } = useDriverSignup();
  const [cpf, setCpf] = useState('');
  const [remember, setRemember] = useState(true);
  const [checking, setChecking] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(REMEMBER_CPF_KEY).then(saved => {
      if (saved) setCpf(maskCPF(saved));
    });
  }, []);

  async function handleContinue() {
    if (!validateCPF(cpf)) {
      Alert.alert('CPF inválido', 'Confira o CPF digitado e tente novamente.');
      return;
    }
    setChecking(true);
    try {
      const digits = onlyDigits(cpf);
      const { data: existing } = await supabase.from('profiles').select('id').eq('cpf', digits).maybeSingle();
      if (existing) {
        Alert.alert(
          'CPF já cadastrado',
          'Já existe uma conta com esse CPF. Faça login para continuar.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
        );
        return;
      }
      await AsyncStorage.setItem(REMEMBER_CPF_KEY, remember ? digits : '');
      setShowTerms(true);
    } finally {
      setChecking(false);
    }
  }

  function handleAcceptTerms() {
    setShowTerms(false);
    update({ cpf: onlyDigits(cpf) });
    navigation.navigate('DriverName');
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={onlyDigits(cpf).length !== 11} loading={checking} />}
    >
      <Text style={styles.title}>Digite seu CPF</Text>
      <Text style={styles.subtitle}>Vamos verificar se você tem cadastro.</Text>

      <TextField
        label="CPF"
        value={cpf}
        onChangeText={t => setCpf(maskCPF(t))}
        placeholder="000.000.000-00"
        keyboardType="numeric"
        maxLength={14}
      />

      <CheckboxRow checked={remember} onToggle={() => setRemember(!remember)}>
        Lembrar meu CPF
      </CheckboxRow>

      <TermsAcceptSheet visible={showTerms} onCancel={() => setShowTerms(false)} onAccept={handleAcceptTerms} />
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: -8 },
});
