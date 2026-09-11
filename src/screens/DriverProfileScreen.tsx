import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import { getSupabaseAvatarUrl, formatPhone } from '../utils/helpers';
import { useToast } from '../contexts/ToastContext';
import { maskPhone, maskPlate, onlyDigits } from '../utils/registrationHelpers';

/**
 * Perfil do motorista. Mesma regra do painel web (ProfileEditModal.tsx):
 * CPF, RG, data de nascimento, CNH e RNTRC não são editáveis por aqui —
 * só nome, telefone, endereço e dados do veículo.
 */
export function DriverProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, signOut, refreshCompany } = useAuth();
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshCompany();
    } finally {
      setRefreshing(false);
    }
  }

  const profile = user?.profile as any;
  const driver = user?.driver;
  const avatarUrl = getSupabaseAvatarUrl(profile?.avatar_url || driver?.profile_image);

  async function handleSignOut() {
    Alert.alert('Sair', 'Tem certeza que deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para alterar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    setUploadingAvatar(true);
    try {
      const base64 = result.assets[0].base64;
      const ext = result.assets[0].uri.split('.').pop() || 'jpg';
      const filePath = `${user?.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), { contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`, upsert: true });
      if (uploadError) throw uploadError;

      const [profileUpdate, driverUpdate] = await Promise.all([
        supabase.from('profiles').update({ avatar_url: filePath }).eq('id', user?.id),
        supabase.from('drivers').update({ profile_image: filePath }).eq('user_id', user?.id),
      ]);
      if (profileUpdate.error || driverUpdate.error) throw new Error(profileUpdate.error?.message || driverUpdate.error?.message);

      await refreshCompany();
      showToast('Foto atualizada com sucesso!');
    } catch (err: any) {
      showToast(err.message || 'Falha ao enviar foto.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.title}>Meu Perfil</Text>
          <Text style={styles.subtitle}>Gerencie seus dados de motorista</Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Ionicons name="person" size={36} color={COLORS.primary} />
                </View>
              )}
              <View style={styles.avatarBadge}>
                {uploadingAvatar ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name || driver?.name || 'Motorista'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {profile?.verification_status === 'verified' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '600' }}>Verificado</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Contato</Text>
          </View>
          {!!(driver?.phone || profile?.phone) && <InfoRow label="Telefone" value={formatPhone(driver?.phone || profile?.phone)} />}
          <InfoRow label="E-mail" value={user?.email || '-'} />
          {!!driver?.address?.city && <InfoRow label="Cidade" value={`${driver.address.city} - ${driver.address.state || ''}`} />}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="car-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Veículo</Text>
          </View>
          <InfoRow label="Placa" value={driver?.vehicle_plate || '-'} />
          <InfoRow label="Modelo" value={driver?.vehicle_model || '-'} />
          <InfoRow label="Ano" value={driver?.vehicle_year || '-'} />
          <InfoRow label="Tipo" value={driver?.vehicle_type || '-'} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Documentos</Text>
          </View>
          <InfoRow label="CPF" value={driver?.cpf || '-'} />
          <InfoRow label="RG" value={driver?.rg || '-'} />
          <InfoRow label="CNH" value={driver?.cnh ? `${driver.cnh} (Cat. ${driver.cnh_category || '-'})` : '-'} />
          <InfoRow label="RNTRC" value={driver?.rntrc || '-'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          <SettingItem icon="key-outline" label="Alterar Senha" onPress={() => navigation.navigate('ResetPassword', { fromSettings: true })} />
          <SettingItem icon="notifications-outline" label="Notificações" onPress={() => navigation.navigate('Settings', { page: 'notifications' })} />
          <SettingItem icon="shield-outline" label="Privacidade" onPress={() => navigation.navigate('Settings', { page: 'privacy' })} />
          <SettingItem icon="help-circle-outline" label="Ajuda e Suporte" onPress={() => navigation.navigate('Settings', { page: 'help' })} />
          <SettingItem icon="information-circle-outline" label="Sobre o App" onPress={() => navigation.navigate('Settings', { page: 'about' })} />
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          <Text style={styles.signOutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MooveFretes Motorista v1.0.0</Text>
      </ScrollView>

      <EditDriverModal
        visible={showEditModal}
        driver={driver}
        profile={profile}
        userId={user?.id || ''}
        onClose={() => setShowEditModal(false)}
        onSaved={() => { setShowEditModal(false); refreshCompany(); }}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

function SettingItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={settingStyles.item} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={COLORS.textSecondary} />
      <Text style={settingStyles.label}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

/** Só os campos que o painel web também deixa editar (CPF/RG/CNH/RNTRC ficam travados). */
function EditDriverModal({ visible, driver, profile, userId, onClose, onSaved }: any) {
  const [name, setName] = useState(profile?.name || driver?.name || '');
  const [phone, setPhone] = useState(driver?.phone || profile?.phone || '');
  const [city, setCity] = useState(driver?.address?.city || '');
  const [state, setState] = useState(driver?.address?.state || '');
  const [vehiclePlate, setVehiclePlate] = useState(driver?.vehicle_plate || '');
  const [vehicleModel, setVehicleModel] = useState(driver?.vehicle_model || '');
  const [vehicleYear, setVehicleYear] = useState(driver?.vehicle_year || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const address = { ...(driver?.address || {}), city: city.trim(), state: state.trim().toUpperCase() };
      const [driverUpdate, profileUpdate] = await Promise.all([
        supabase.from('drivers').update({
          name: name.trim(), phone: onlyDigits(phone), address,
          vehicle_plate: vehiclePlate.trim() || null, vehicle_model: vehicleModel.trim() || null, vehicle_year: vehicleYear.trim() || null,
          updated_at: new Date().toISOString(),
        }).eq('user_id', userId),
        supabase.from('profiles').update({
          name: name.trim(), phone: onlyDigits(phone), city: city.trim(), state: state.trim().toUpperCase(),
          updated_at: new Date().toISOString(),
        }).eq('id', userId),
      ]);
      if (driverUpdate.error || profileUpdate.error) {
        throw new Error(driverUpdate.error?.message || profileUpdate.error?.message);
      }
      onSaved();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={editStyles.container} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
        <View style={editStyles.handle} />
        <Text style={editStyles.title}>Editar Perfil</Text>
        <Text style={editStyles.hint}>CPF, RG, CNH e RNTRC não podem ser alterados por aqui.</Text>

        <Text style={editStyles.label}>Nome Completo</Text>
        <TextInput style={editStyles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={COLORS.textLight} maxLength={100} />

        <Text style={editStyles.label}>Telefone</Text>
        <TextInput style={editStyles.input} value={phone} onChangeText={t => setPhone(maskPhone(t))} placeholder="(00) 00000-0000" keyboardType="phone-pad" placeholderTextColor={COLORS.textLight} maxLength={16} />

        <Text style={editStyles.label}>Cidade</Text>
        <TextInput style={editStyles.input} value={city} onChangeText={setCity} placeholder="Cidade" placeholderTextColor={COLORS.textLight} maxLength={100} />

        <Text style={editStyles.label}>Estado (UF)</Text>
        <TextInput style={editStyles.input} value={state} onChangeText={setState} placeholder="SP" maxLength={2} autoCapitalize="characters" placeholderTextColor={COLORS.textLight} />

        <Text style={editStyles.sectionLabel}>Veículo</Text>
        <Text style={editStyles.label}>Placa</Text>
        <TextInput style={editStyles.input} value={vehiclePlate} onChangeText={t => setVehiclePlate(maskPlate(t))} placeholder="ABC1D23" autoCapitalize="characters" placeholderTextColor={COLORS.textLight} maxLength={7} />

        <Text style={editStyles.label}>Modelo</Text>
        <TextInput style={editStyles.input} value={vehicleModel} onChangeText={setVehicleModel} placeholder="Ex: Volvo FH" placeholderTextColor={COLORS.textLight} maxLength={60} />

        <Text style={editStyles.label}>Ano</Text>
        <TextInput style={editStyles.input} value={vehicleYear} onChangeText={t => setVehicleYear(onlyDigits(t).slice(0, 4))} placeholder="2020" keyboardType="numeric" placeholderTextColor={COLORS.textLight} maxLength={4} />

        <View style={editStyles.btnRow}>
          <TouchableOpacity style={editStyles.cancelBtn} onPress={onClose}>
            <Text style={editStyles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={editStyles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={editStyles.saveText}>Salvar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  profileCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 16, borderWidth: 1, borderColor: COLORS.border },
  profileTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary },
  section: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '08' },
  signOutText: { color: COLORS.danger, fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: COLORS.textLight },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { fontSize: 13, color: COLORS.textSecondary },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.text, textAlign: 'right', flex: 1, marginLeft: 12 },
});

const settingStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { flex: 1, fontSize: 14, color: COLORS.text },
});

const editStyles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: COLORS.surface },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  hint: { fontSize: 12, color: COLORS.textLight, marginBottom: 6 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  input: { backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, height: 46, fontSize: 14, color: COLORS.text },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: COLORS.textSecondary },
  saveBtn: { flex: 1, height: 50, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
