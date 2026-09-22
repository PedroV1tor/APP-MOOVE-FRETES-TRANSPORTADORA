import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { maskPlate, isValidPlate, onlyDigits, inRange } from '../../../utils/registrationHelpers';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverPlateRntrcScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [plate, setPlate] = useState(data.vehiclePlate);
  const [rntrc, setRntrc] = useState(data.rntrc);

  const canContinue = isValidPlate(plate) && inRange(onlyDigits(rntrc), 8, 9);

  function handleContinue() {
    update({ vehiclePlate: plate.toUpperCase(), rntrc: onlyDigits(rntrc) });
    navigation.navigate('DriverCnhUpload');
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('placa')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={!canContinue} />}
    >
      <Text style={styles.title}>Digite a placa e o RNTRC do veículo</Text>

      <TextField label="Placa do cavalo" value={plate} onChangeText={t => setPlate(maskPlate(t))} placeholder="ABC1D23" autoCapitalize="characters" maxLength={7} />
      <TextField label="RNTRC (ANTT)" value={rntrc} onChangeText={t => setRntrc(onlyDigits(t).slice(0, 9))} placeholder="8 a 9 dígitos" keyboardType="numeric" maxLength={9} />

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={COLORS.textSecondary} />
        <Text style={styles.infoText}>O RNTRC é o número de registro do transportador na ANTT, encontrado no seu Certificado RNTRC.</Text>
      </View>
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.background, borderRadius: 12, padding: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 12.5, color: COLORS.textSecondary, lineHeight: 18 },
});
