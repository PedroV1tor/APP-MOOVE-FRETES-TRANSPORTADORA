import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { TextField } from '../../../components/registration/RegistrationField';
import { maskCPF, maskPhone, validateCPF, onlyDigits, inRange } from '../../../utils/registrationHelpers';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

type EditableField = 'cpf' | 'name' | 'phone' | null;

export function DriverPersonalConfirmScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [editing, setEditing] = useState<EditableField>(null);
  const [cpf, setCpf] = useState(maskCPF(data.cpf));
  const [name, setName] = useState(data.name);
  const [phone, setPhone] = useState(data.phone);

  function saveField(field: EditableField) {
    if (field === 'cpf') update({ cpf: onlyDigits(cpf) });
    if (field === 'name') update({ name: name.trim() });
    if (field === 'phone') update({ phone });
    setEditing(null);
  }

  const addressLine = `${data.street}, ${data.number}. ${data.neighborhood}, ${data.city} - ${data.uf}`;

  function handleContinue() {
    navigation.navigate('DriverVehicleData');
  }

  const canContinue = validateCPF(cpf) && inRange(name, 3, 100) && onlyDigits(phone).length >= 10;

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('dadosPessoais')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} disabled={!canContinue} />}
    >
      <Text style={styles.title}>Confirme seus dados pessoais</Text>

      <Row icon="card-outline" label="CPF" value={maskCPF(data.cpf)} editing={editing === 'cpf'} onEdit={() => setEditing('cpf')}>
        <TextField label="CPF" value={cpf} onChangeText={t => setCpf(maskCPF(t))} keyboardType="numeric" maxLength={14} />
        <SaveButton onPress={() => saveField('cpf')} disabled={!validateCPF(cpf)} />
      </Row>

      <Row icon="person-outline" label="Nome completo" value={data.name} editing={editing === 'name'} onEdit={() => setEditing('name')}>
        <TextField label="Nome completo" value={name} onChangeText={setName} maxLength={100} />
        <SaveButton onPress={() => saveField('name')} disabled={!inRange(name, 3, 100)} />
      </Row>

      <Row icon="phone-portrait-outline" label="Celular" value={maskPhone(data.phone)} editing={editing === 'phone'} onEdit={() => setEditing('phone')}>
        <TextField label="Celular" value={phone} onChangeText={t => setPhone(maskPhone(t))} keyboardType="phone-pad" maxLength={16} />
        <SaveButton onPress={() => saveField('phone')} disabled={onlyDigits(phone).length < 10} />
      </Row>

      <Row icon="home-outline" label="Endereço" value={addressLine} editing={false} onEdit={() => navigation.navigate('DriverCep')} />
    </DriverStepLayout>
  );
}

function Row({
  icon, label, value, editing, onEdit, children,
}: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string;
  editing: boolean; onEdit: () => void; children?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {!editing && <Text style={styles.rowValue}>{value}</Text>}
        </View>
        {!editing && (
          <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
            <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
      {editing && <View style={styles.editBox}>{children}</View>}
    </View>
  );
}

function SaveButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[styles.saveBtn, disabled && styles.saveBtnDisabled]} onPress={onPress} disabled={disabled} activeOpacity={0.85}>
      <Text style={styles.saveBtnText}>Salvar</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  row: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 14 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
  rowValue: { fontSize: 15, color: COLORS.text, marginTop: 2 },
  editBtn: { padding: 6 },
  editBox: { marginTop: 10, gap: 10 },
  saveBtn: { alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
