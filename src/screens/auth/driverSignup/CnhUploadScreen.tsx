import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { UploadSourceSheet } from '../../../components/registration/UploadSourceSheet';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import type { PickedFile } from '../../../utils/registrationUpload';
import { progressFor } from './steps';

export function DriverCnhUploadScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();
  const [showSheet, setShowSheet] = useState(false);

  async function pickFromCamera() {
    setShowSheet(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    update({ cnhDoc: { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType, name: asset.fileName || 'cnh.jpg' } });
  }

  async function pickFromGallery() {
    setShowSheet(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    update({ cnhDoc: { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType, name: asset.fileName || 'cnh.jpg' } });
  }

  async function pickFromDocuments() {
    setShowSheet(false);
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const file: PickedFile = { uri: asset.uri, mimeType: asset.mimeType, name: asset.name };
    update({ cnhDoc: file });
  }

  function handleContinue() {
    if (!data.cnhDoc) {
      setShowSheet(true);
      return;
    }
    navigation.navigate('DriverSelfie');
  }

  const isImage = data.cnhDoc && (data.cnhDoc.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(data.cnhDoc.uri));

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('cnh')}
      footer={<PrimaryButton label="Continuar" onPress={handleContinue} />}
    >
      <Text style={styles.title}>Envie a foto da sua CNH atual</Text>
      <Text style={styles.subtitle}>Siga as instruções de envio:</Text>

      <View style={styles.checklist}>
        <ChecklistItem text="Documento fora do plástico e aberto" />
        <ChecklistItem text="Todos os campos legíveis" />
      </View>

      {data.cnhDoc && (
        <View style={styles.preview}>
          {isImage ? (
            <Image source={{ uri: data.cnhDoc.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewFile}>
              <Ionicons name="document-text-outline" size={22} color={COLORS.primary} />
              <Text style={styles.previewFileName} numberOfLines={1}>{data.cnhDoc.name || 'Arquivo selecionado'}</Text>
            </View>
          )}
          <Text style={styles.changeLink} onPress={() => setShowSheet(true)}>Trocar arquivo</Text>
        </View>
      )}

      <UploadSourceSheet
        visible={showSheet}
        hint="A CNH deve estar aberta para aparecer a frente e o verso ao mesmo tempo."
        onClose={() => setShowSheet(false)}
        onCamera={pickFromCamera}
        onDocuments={pickFromDocuments}
        onGallery={pickFromGallery}
      />
    </DriverStepLayout>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <View style={styles.checklistItem}>
      <Ionicons name="checkmark" size={16} color={COLORS.textSecondary} />
      <Text style={styles.checklistText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: -8 },
  checklist: { gap: 10 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistText: { fontSize: 14, color: COLORS.textSecondary },
  preview: { alignItems: 'flex-start', gap: 8 },
  previewImage: { width: '100%', height: 180, borderRadius: 12 },
  previewFile: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.background, borderRadius: 12, padding: 14, width: '100%' },
  previewFileName: { flex: 1, fontSize: 13, color: COLORS.text },
  changeLink: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
