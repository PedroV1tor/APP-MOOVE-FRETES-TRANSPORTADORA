import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

// ── SectionCard ──────────────────────────────────────────────────
export function SectionCard({ icon, title, subtitle, children }: {
  icon: string; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon as any} size={20} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ── FieldLabel ──────────────────────────────────────────────────
export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}{required ? ' *' : ''}
    </Text>
  );
}

// ── InputBox ──────────────────────────────────────────────────
export function InputBox({ icon, ...props }: any) {
  return (
    <View style={styles.inputWrapper}>
      {icon && <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />}
      <TextInput
        style={[styles.input, props.multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholderTextColor={COLORS.textLight}
        {...props}
      />
    </View>
  );
}

// ── ChipItem ──────────────────────────────────────────────────
export function ChipItem({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, checked && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipLabel, checked && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── SegmentedControl ──────────────────────────────────────────────
export function SegmentedControl({ options, value, onChange }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt, i) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segOpt,
              active && styles.segOptActive,
              i === 0 && { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
              i === options.length - 1 && { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.segLabel, active && styles.segLabelActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── InlineSelect ──────────────────────────────────────────────────
export function InlineSelect({ value, options, placeholder, onSelect, icon }: any) {
  return (
    <View style={styles.inlineSelect}>
      {icon && <Ionicons name={icon} size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options?.map((opt: any, index: number) => {
          const val = typeof opt === 'string' ? opt : opt?.value;
          const label = typeof opt === 'string' ? opt : opt?.label;
          const active = value === val;
          const itemKey = val != null ? String(val) : `fallback-${index}`;
          return (
            <TouchableOpacity
              key={itemKey}
              style={[styles.inlineOpt, active && styles.inlineOptActive]}
              onPress={() => onSelect(val)}
            >
              <Text style={[styles.inlineLabel, active && styles.inlineLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

import { ScrollView } from 'react-native';

// ── YesNoToggle ──────────────────────────────────────────────────
export function YesNoToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.yesNo}>
      <Text style={styles.yesNoLabel}>{label}</Text>
      <View style={styles.yesNoRow}>
        <TouchableOpacity
          style={[styles.yesNoBtn, value === true && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
          onPress={() => onChange(true)}
        >
          <Text style={[styles.yesNoText, value === true && { color: '#fff' }]}>Sim</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.yesNoBtn, value === false && { backgroundColor: COLORS.danger, borderColor: COLORS.danger }]}
          onPress={() => onChange(false)}
        >
          <Text style={[styles.yesNoText, value === false && { color: '#fff' }]}>Não</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '10', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionSubtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  sectionBody: { gap: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 12, height: 46, backgroundColor: COLORS.background,
  },
  input: { flex: 1, fontSize: 14, color: COLORS.text },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  chipLabelActive: { color: '#fff', fontWeight: '700' },
  segmented: { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 10, height: 40, borderWidth: 1, borderColor: COLORS.border },
  segOpt: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segOptActive: { backgroundColor: COLORS.primary },
  segLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segLabelActive: { color: '#fff' },
  inlineSelect: { flexDirection: 'row', alignItems: 'center' },
  inlineOpt: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
  inlineOptActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  inlineLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  inlineLabelActive: { color: '#fff' },
  yesNo: { flex: 1, gap: 6 },
  yesNoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  yesNoRow: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  yesNoBtn: { flex: 1, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  yesNoText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
});
