import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverVehicleDataScreen({ navigation }: any) {
  const { data } = useDriverSignup();
  const canContinue = !!data.vehicleType && !!data.bodyType && !!data.trackerType;

  function handleContinue() {
    navigation.navigate('DriverPlateRntrc');
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('veiculo')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={!canContinue} />}
    >
      <Text style={styles.title}>Informe os dados do veículo</Text>

      <SelectRow
        label="Tipo de veículo" placeholder="Selecione o tipo de veículo"
        value={data.vehicleType} onPress={() => navigation.navigate('DriverVehicleType')}
      />
      <SelectRow
        label="Tipo de carroceria" placeholder="Selecione o tipo de carroceria"
        value={data.bodyType} onPress={() => navigation.navigate('DriverBodyType')}
      />
      <SelectRow
        label="Rastreador" placeholder="Informe se o veículo possui rastreador"
        value={data.trackerType} onPress={() => navigation.navigate('DriverTracker')}
      />
    </DriverStepLayout>
  );
}

function SelectRow({
  label, placeholder, value, onPress,
}: { label: string; placeholder: string; value: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={value ? styles.rowValue : styles.rowPlaceholder} numberOfLines={1}>{value || placeholder}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 14,
  },
  rowLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  rowValue: { fontSize: 14, color: COLORS.primary, marginTop: 4 },
  rowPlaceholder: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
});
