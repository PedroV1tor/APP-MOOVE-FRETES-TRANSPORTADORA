import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../utils/constants';

/** Barra de progresso fina + percentual, igual ao passo a passo do Fretebras. */
export function StepProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{Math.round(progress)}%</Text>
    </View>
  );
}

/**
 * Casca de tela comum ao wizard de cadastro do motorista: seta de voltar,
 * barra de progresso opcional, conteúdo rolável e botão de rodapé.
 */
export function DriverStepLayout({
  onBack, progress, children, footer,
}: {
  onBack: () => void;
  progress?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {progress !== undefined && (
        <View style={styles.progressWrap}>
          <StepProgressBar progress={progress} />
        </View>
      )}

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>

      {footer && <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>{footer}</View>}
    </KeyboardAvoidingView>
  );
}

export function PrimaryButton({
  label, onPress, disabled, loading,
}: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, (disabled || loading) && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function CheckboxRow({
  checked, onToggle, children,
}: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity style={styles.checkboxRow} onPress={onToggle} activeOpacity={0.7}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? COLORS.primary : COLORS.textLight} />
      <Text style={styles.checkboxLabel}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 4 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  progressWrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: COLORS.borderLight, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 16 },
  footer: { paddingHorizontal: 24, paddingTop: 12 },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 30, height: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkboxLabel: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
});
