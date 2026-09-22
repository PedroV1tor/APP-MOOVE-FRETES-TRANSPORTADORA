import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout } from '../../../components/registration/DriverStepLayout';

/** Tela genérica de seleção única (rastreador) ou agrupada (tipo de veículo/carroceria). */
export function SelectListScreen({
  navigation, title, value, onSelect, groups,
}: {
  navigation: any;
  title: string;
  value: string;
  onSelect: (option: string) => void;
  groups: { label: string; options: string[] }[];
}) {
  function handleSelect(option: string) {
    onSelect(option);
    navigation.goBack();
  }

  return (
    <DriverStepLayout onBack={() => navigation.goBack()}>
      <Text style={styles.title}>{title}</Text>
      {groups.map(group => (
        <View key={group.label} style={styles.group}>
          {group.label ? <Text style={styles.groupLabel}>{group.label}</Text> : null}
          {group.options.map(option => (
            <TouchableOpacity key={option} style={styles.option} onPress={() => handleSelect(option)} activeOpacity={0.7}>
              <Ionicons name={value === option ? 'radio-button-on' : 'radio-button-off'} size={20} color={value === option ? COLORS.primary : COLORS.textLight} />
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </DriverStepLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  group: { gap: 4 },
  groupLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textLight, marginTop: 10, marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  optionText: { fontSize: 15, color: COLORS.text },
});
