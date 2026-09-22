import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/** Bottom sheet "Selecione como deseja enviar" (Câmera / Documentos / Galeria). */
export function UploadSourceSheet({
  visible, hint, onClose, onCamera, onDocuments, onGallery,
}: {
  visible: boolean;
  hint?: string;
  onClose: () => void;
  onCamera: () => void;
  onDocuments: () => void;
  onGallery: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Selecione como deseja enviar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {!!hint && (
            <View style={styles.hintRow}>
              <View style={styles.hintIcon}>
                <Ionicons name="document-text-outline" size={26} color={COLORS.textSecondary} />
              </View>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.optionBtn} onPress={onCamera} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={18} color={COLORS.text} />
            <Text style={styles.optionText}>Câmera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} onPress={onDocuments} activeOpacity={0.8}>
            <Ionicons name="document-outline" size={18} color={COLORS.text} />
            <Text style={styles.optionText}>Documentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} onPress={onGallery} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={18} color={COLORS.text} />
            <Text style={styles.optionText}>Galeria</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  closeBtn: { padding: 2 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.background, borderRadius: 14, padding: 12, marginBottom: 4 },
  hintIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  hintText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.background, borderRadius: 14, height: 52, paddingHorizontal: 16,
  },
  optionText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
});
