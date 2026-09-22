import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

/**
 * Primeira tela do cadastro: escolher o tipo de conta.
 * Espelha o UserTypeSelection.tsx do painel web.
 */
export function UserTypeSelectionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  function choose(userType: 'caminhoneiro' | 'transportadora') {
    if (userType === 'caminhoneiro') {
      navigation.navigate('DriverSignup');
      return;
    }
    navigation.navigate('SignUp', { userType });
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Como você vai usar o MooveFretes?</Text>
        <Text style={styles.subtitle}>Escolha o tipo de conta para continuar o cadastro</Text>

        <TouchableOpacity style={styles.card} onPress={() => choose('caminhoneiro')} activeOpacity={0.85}>
          <View style={[styles.cardIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="car-outline" size={28} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Sou Motorista</Text>
            <Text style={styles.cardText}>Quero encontrar e transportar fretes</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => choose('transportadora')} activeOpacity={0.85}>
          <View style={[styles.cardIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="business-outline" size={28} color={COLORS.info} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Sou Transportadora</Text>
            <Text style={styles.cardText}>Quero publicar fretes e gerenciar motoristas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>Já tem uma conta? <Text style={{ fontWeight: '700', color: COLORS.primary }}>Entrar</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 24, gap: 14 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 180, height: 44, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, padding: 16,
    backgroundColor: COLORS.background,
  },
  cardIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cardText: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 },
  loginLink: { alignSelf: 'center', marginTop: 8, paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: COLORS.textSecondary },
});
