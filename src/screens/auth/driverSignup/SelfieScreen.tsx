import React from 'react';
import { View, Text, Image, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../../utils/constants';
import { DriverStepLayout, PrimaryButton } from '../../../components/registration/DriverStepLayout';
import { useDriverSignup } from '../../../contexts/DriverSignupContext';
import { progressFor } from './steps';

export function DriverSelfieScreen({ navigation }: any) {
  const { data, update } = useDriverSignup();

  async function takeSelfie() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7, base64: true, cameraType: ImagePicker.CameraType.front, allowsEditing: true, aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    update({ selfieDoc: { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType, name: 'selfie.jpg' } });
  }

  function handleContinue() {
    if (!data.selfieDoc) {
      takeSelfie();
      return;
    }
    navigation.navigate('DriverPassword');
  }

  return (
    <DriverStepLayout
      onBack={() => navigation.goBack()}
      progress={progressFor('selfie')}
      footer={<PrimaryButton label={data.selfieDoc ? 'Continuar' : 'Tirar foto'} onPress={handleContinue} />}
    >
      <Text style={styles.title}>Hora da sua foto</Text>
      <Text style={styles.subtitle}>Dicas para uma boa selfie:</Text>

      <View style={styles.checklist}>
        <ChecklistItem text="Esteja em um lugar iluminado" />
        <ChecklistItem text="Retire óculos, boné e máscara" />
        <ChecklistItem text="Centralize seu rosto na tela" />
      </View>

      {data.selfieDoc && (
        <View style={styles.preview}>
          <Image source={{ uri: data.selfieDoc.uri }} style={styles.previewImage} />
          <Text style={styles.changeLink} onPress={takeSelfie}>Tirar novamente</Text>
        </View>
      )}
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
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: -8 },
  checklist: { gap: 10 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistText: { fontSize: 14, color: COLORS.textSecondary },
  preview: { alignItems: 'center', gap: 8 },
  previewImage: { width: 160, height: 160, borderRadius: 80 },
  changeLink: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});
