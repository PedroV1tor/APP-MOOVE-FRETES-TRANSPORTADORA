import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { maskCEP, inRange } from '../../../utils/registrationHelpers';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverAddressConfirmScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [confirmed, setConfirmed] = useState(false);
  const [number, setNumber] = useState(data.number);
  const [complement, setComplement] = useState(data.complement);

  function handleWrongCep() {
    navigation.navigate('DriverCep');
  }

  function handleContinue() {
    update({ number: number.trim(), complement: complement.trim() });
    navigation.navigate('DriverPersonalConfirm');
  }

  if (!confirmed) {
    return (
      <DriverStepLayout onBack={() => navigation.goBack()} progress={progressFor('endereco')}>
        <Text style={styles.title}>Os dados abaixo estão corretos?</Text>

        <View style={styles.addressCard}>
          <Ionicons name="home-outline" size={20} color={COLORS.text} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressCep}>CEP: {maskCEP(data.cep)}</Text>
            <Text style={styles.addressLine}>{data.street}, {data.neighborhood}. {data.city} - {data.uf}</Text>
          </View>
        </View>

        <View style={styles.confirmRow}>
          <TouchableOpacity onPress={handleWrongCep}>
            <Text style={styles.linkText}>Não, trocar o CEP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => setConfirmed(true)} activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>Sim, continuar</Text>
          </TouchableOpacity>
        </View>
      </DriverStepLayout>
    );
  }

  return (
    <DriverStepLayout
      onBack={() => setConfirmed(false)}
      progress={progressFor('endereco')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={!inRange(number, 1, 10)} />}
    >
      <Text style={styles.title}>Complete seu endereço</Text>
      <Text style={styles.subtitle}>{data.street}, {data.neighborhood}. {data.city} - {data.uf}</Text>
      <TextField label="Número" value={number} onChangeText={setNumber} placeholder="Nº" keyboardType="numeric" maxLength={10} />
      <TextField label="Complemento" value={complement} onChangeText={setComplement} placeholder="Apto, sala, etc." optional maxLength={60} />
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: -8 },
  addressCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.background, borderRadius: 14, padding: 16,
  },
  addressCep: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  addressLine: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  linkText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  confirmBtn: { backgroundColor: COLORS.primary, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 24 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
