import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { isValidEmail } from '../../../utils/registrationHelpers';
import { supabase } from '../../../lib/supabase';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverEmailScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [email, setEmail] = useState(data.email);
  const [touched, setTouched] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setAvailable(null);
    if (!isValidEmail(email)) return;
    timeoutRef.current = setTimeout(checkEmail, 800);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function checkEmail() {
    setChecking(true);
    try {
      const { data: existing, error } = await supabase
        .from('profiles').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
      setAvailable(error ? true : !existing);
    } catch {
      setAvailable(true);
    } finally {
      setChecking(false);
    }
  }

  function handleContinue() {
    update({ email: email.trim().toLowerCase() });
    navigation.navigate('DriverCep');
  }

  const canContinue = isValidEmail(email) && available === true;

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('email')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={!canContinue} loading={checking} />}
    >
      <Text style={styles.title}>Digite seu e-mail</Text>
      <Text style={styles.subtitle}>Vamos usar para você entrar no aplicativo.</Text>
      <TextField
        label="E-mail" value={email}
        onChangeText={t => { setEmail(t); setTouched(true); }}
        placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" maxLength={150}
        rightIcon={checking ? <ActivityIndicator size="small" color={COLORS.primary} /> : touched && isValidEmail(email) ? (
          <Ionicons name={available === true ? 'checkmark-circle' : available === false ? 'close-circle' : 'help-circle-outline'} size={18} color={available === true ? COLORS.success : available === false ? COLORS.danger : COLORS.textLight} />
        ) : undefined}
        error={touched && email.length > 0 && !isValidEmail(email) ? 'E-mail inválido' : available === false ? 'Este e-mail já está cadastrado' : undefined}
      />
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: -8 },
});
