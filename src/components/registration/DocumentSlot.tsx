import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../../utils/constants';
import type { PickedFile } from '../../utils/registrationUpload';

interface DocumentSlotProps {
  label: string;
  required?: boolean;
  value: PickedFile | null;
  onChange: (file: PickedFile | null) => void;
  /** Esconde a opção "Escolher arquivo (PDF)" — usado pra foto de perfil. */
  imageOnly?: boolean;
  /** Preview circular (foto de perfil) em vez de quadrado (documento). */
  round?: boolean;
}

/**
 * Campo de envio de documento (RG, CNH, CRLV, CNPJ, comprovante, selfie...).
 * Deixa escolher câmera, galeria ou arquivo (PDF) — mesma cobertura do
 * `type="file" accept="image/*,.pdf"` do formulário web.
 */
export function DocumentSlot({ label, required, value, onChange, imageOnly, round }: DocumentSlotProps) {
  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    onChange({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType, name: asset.fileName || 'foto.jpg' });
  }

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    onChange({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType, name: asset.fileName || 'foto.jpg' });
  }

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    onChange({ uri: asset.uri, mimeType: asset.mimeType, name: asset.name });
  }

  function handlePress() {
    const options = [
      { text: 'Tirar foto', onPress: pickFromCamera },
      { text: 'Escolher da galeria', onPress: pickFromGallery },
      ...(imageOnly ? [] : [{ text: 'Escolher arquivo (PDF)', onPress: pickFile }]),
      { text: 'Cancelar', style: 'cancel' as const },
    ];
    Alert.alert(label, 'Como você quer enviar?', options);
  }

  const isImage = value && (value.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(value.uri));

  return (
    <TouchableOpacity style={[styles.slot, value && styles.slotFilled]} onPress={handlePress} activeOpacity={0.7}>
      {value && isImage ? (
        <Image source={{ uri: value.uri }} style={[styles.thumb, round && styles.thumbRound]} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder, round && styles.thumbRound]}>
          <Ionicons
            name={value ? 'document-text' : (round ? 'camera-outline' : 'cloud-upload-outline')}
            size={22}
            color={value ? COLORS.primary : COLORS.textLight}
          />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>
          {label}{required ? ' *' : ''}
        </Text>
        <Text style={value ? styles.statusOk : styles.statusPending} numberOfLines={1}>
          {value ? (value.name || 'Arquivo selecionado') : 'Toque para enviar'}
        </Text>
      </View>
      {value ? (
        <Ionicons name="checkmark-circle" size={20} color={COLORS.success || '#16A34A'} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed',
    borderRadius: 12, padding: 10, backgroundColor: COLORS.background,
  },
  slotFilled: { borderStyle: 'solid', borderColor: COLORS.primary + '55' },
  thumb: { width: 44, height: 44, borderRadius: 8 },
  thumbRound: { borderRadius: 22 },
  thumbPlaceholder: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  statusOk: { fontSize: 12, color: COLORS.primary, marginTop: 2 },
  statusPending: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
});
