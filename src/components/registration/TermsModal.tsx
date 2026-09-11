import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { TERMS_CONTENT } from '../../utils/termsContent';

export function TermsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.header}>
          <Text style={styles.title}>Termos e Condições de Uso</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.text}>{TERMS_CONTENT}</Text>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.acceptBtn} onPress={onClose}>
            <Text style={styles.acceptBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  text: { fontSize: 13, lineHeight: 20, color: COLORS.text },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  acceptBtn: { backgroundColor: COLORS.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
