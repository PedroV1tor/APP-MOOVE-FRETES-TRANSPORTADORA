import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { checkPasswordStrength } from '../../utils/registrationHelpers';

interface FieldProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  maxLength?: number;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
  editable?: boolean;
  multiline?: boolean;
}

/** Campo de texto padrão do cadastro (usado em todas as etapas). */
export function TextField({
  label, icon, value, onChangeText, placeholder, required, optional, error,
  keyboardType, autoCapitalize, maxLength, secureTextEntry, rightIcon, editable = true, multiline,
}: FieldProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
        {optional && <Text style={styles.optional}> (opcional)</Text>}
      </Text>
      <View style={[styles.wrapper, !!error && styles.wrapperError, !editable && styles.wrapperDisabled, multiline && styles.wrapperMulti]}>
        {icon && <Ionicons name={icon} size={18} color={error ? COLORS.danger : COLORS.textSecondary} style={styles.icon} />}
        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={false}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
        />
        {rightIcon}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/** Campo de senha com botão de mostrar/ocultar e medidor de força. */
export function PasswordField({
  label, value, onChangeText, placeholder, error, showStrength,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; error?: string; showStrength?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength ? checkPasswordStrength(value) : null;

  return (
    <View style={styles.group}>
      <TextField
        label={label}
        icon="lock-closed-outline"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        required
        error={error}
        rightIcon={
          <TouchableOpacity onPress={() => setVisible(!visible)} style={{ padding: 4 }}>
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        }
      />
      {showStrength && value.length > 0 && strength && (
        <View style={styles.strengthBox}>
          <StrengthRow ok={strength.hasMinLength} label="Mínimo 8 caracteres" />
          <StrengthRow ok={strength.hasUpperCase} label="Letra maiúscula" />
          <StrengthRow ok={strength.hasLowerCase} label="Letra minúscula" />
          <StrengthRow ok={strength.hasNumber} label="Número" />
        </View>
      )}
    </View>
  );
}

function StrengthRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.strengthRow}>
      <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={13} color={ok ? COLORS.success : COLORS.textLight} />
      <Text style={[styles.strengthLabel, ok && { color: COLORS.success }]}>{label}</Text>
    </View>
  );
}

/** Cabeçalho com barra de progresso + ícones das etapas do wizard. */
export function WizardHeader({
  steps, currentIndex,
}: { steps: { label: string; icon: keyof typeof Ionicons.glyphMap }[]; currentIndex: number }) {
  const progress = ((currentIndex + 1) / steps.length) * 100;
  return (
    <View style={styles.wizardHeader}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.stepsRow}>
        {steps.map((step, i) => {
          const active = i === currentIndex;
          const done = i < currentIndex;
          return (
            <View key={step.label} style={styles.stepItem}>
              <View style={[styles.stepDot, active && styles.stepDotActive, done && styles.stepDotDone]}>
                <Ionicons name={done ? 'checkmark' : step.icon} size={16} color={active || done ? '#fff' : COLORS.textLight} />
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>{step.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  required: { color: COLORS.danger },
  optional: { color: COLORS.textLight, fontWeight: '400', fontSize: 12 },
  wrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, backgroundColor: COLORS.surface, paddingHorizontal: 12, height: 48,
  },
  wrapperMulti: { height: undefined, minHeight: 90, alignItems: 'flex-start', paddingVertical: 10 },
  wrapperError: { borderColor: COLORS.danger },
  wrapperDisabled: { backgroundColor: COLORS.borderLight },
  icon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  error: { fontSize: 12, color: COLORS.danger },
  strengthBox: { backgroundColor: COLORS.background, borderRadius: 10, padding: 10, gap: 4 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  strengthLabel: { fontSize: 12, color: COLORS.textLight },

  wizardHeader: { gap: 12 },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: COLORS.borderLight, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', flex: 1, gap: 4 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotDone: { backgroundColor: COLORS.success },
  stepLabel: { fontSize: 10, color: COLORS.textLight, textAlign: 'center' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
});
