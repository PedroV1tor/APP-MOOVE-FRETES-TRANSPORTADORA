import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { CheckboxRow } from './DriverStepLayout';
import { TermsModal } from './TermsModal';

/**
 * Bottom sheet de aceite de termos exibido logo após o CPF, antes de seguir
 * para o restante do cadastro — mesmo ponto do fluxo do Fretebras.
 */
export function TermsAcceptSheet({
  visible, onCancel, onAccept,
}: { visible: boolean; onCancel: () => void; onAccept: () => void }) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedData, setAcceptedData] = useState(false);
  const [showTermsText, setShowTermsText] = useState(false);
  const canContinue = acceptedTerms && acceptedData;

  function handleCancel() {
    setAcceptedTerms(false);
    setAcceptedData(false);
    onCancel();
  }

  function handleAccept() {
    if (!canContinue) return;
    setAcceptedTerms(false);
    setAcceptedData(false);
    onAccept();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Para se cadastrar, leia e aceite os termos.</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <CheckboxRow checked={acceptedTerms} onToggle={() => setAcceptedTerms(!acceptedTerms)}>
            Eu li e aceito os <Text style={styles.link} onPress={() => setShowTermsText(true)}>Termos de Uso</Text> e a{' '}
            <Text style={styles.link} onPress={() => setShowTermsText(true)}>Política de Privacidade</Text> do MooveFretes.
          </CheckboxRow>

          <CheckboxRow checked={acceptedData} onToggle={() => setAcceptedData(!acceptedData)}>
            Aceito o compartilhamento dos meus dados pessoais conforme a Política de Privacidade, para os fins previstos em lei.
          </CheckboxRow>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
              onPress={handleAccept}
              disabled={!canContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TermsModal visible={showTermsText} onClose={() => setShowTermsText(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 18,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: COLORS.text, lineHeight: 25 },
  closeBtn: { padding: 2 },
  link: { color: COLORS.primary, fontWeight: '700', textDecorationLine: 'underline' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  continueBtn: { backgroundColor: COLORS.primary, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 28 },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
