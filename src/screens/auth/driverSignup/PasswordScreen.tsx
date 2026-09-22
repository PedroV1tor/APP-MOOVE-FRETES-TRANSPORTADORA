import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

function checkStrength(password: string) {
  return {
    hasMinLength: password.length >= 8,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
}

export function DriverPasswordScreen({ navigation }: any) {
  const { submit, loading } = useDriverSignup();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const strength = checkStrength(password);
  const canContinue = strength.hasMinLength && strength.hasLetter && strength.hasNumber;

  async function handleSubmit() {
    if (!canContinue) return;
    const { error } = await submit();
    if (error) {
      Alert.alert('Erro ao criar conta', error);
      return;
    }
    Alert.alert('Cadastro completo!', 'Bem-vindo ao MooveFretes! Seus documentos entraram na fila de verificação.');
    // Não navega manualmente: o AuthContext detecta a sessão criada e troca de tela sozinho.
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('senha')}
      footer={<PrimaryButton label="Salvar e continuar" onPress={handleSubmit} disabled={!canContinue} loading={loading} />}
    >
      <Text style={styles.title}>Agora, crie sua senha</Text>

      <View style={styles.group}>
        <Text style={styles.label}>Senha</Text>
        <View style={styles.wrapper}>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={t => setPassword(t.slice(0, 72))}
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setVisible(!visible)} style={{ padding: 4 }}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.strengthRow}>
        <Text style={styles.strengthLabel}>A senha deve conter:</Text>
        <View style={styles.strengthChips}>
          <StrengthChip ok={strength.hasMinLength} label="8 dígitos" />
          <StrengthChip ok={strength.hasLetter} label="1 letra" />
          <StrengthChip ok={strength.hasNumber} label="1 número" />
        </View>
      </View>
    </DriverStepLayout>
  );
}

function StrengthChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? COLORS.success : COLORS.textLight} />
      <Text style={[styles.chipText, ok && { color: COLORS.success }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  wrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, backgroundColor: COLORS.surface, paddingHorizontal: 12, height: 48,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  strengthRow: { gap: 8 },
  strengthLabel: { fontSize: 13, color: COLORS.textSecondary },
  strengthChips: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipText: { fontSize: 12.5, color: COLORS.textLight },
});
