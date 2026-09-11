import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import { getSupabaseAvatarUrl } from '../utils/helpers';

const VERIFICATION_LABEL: Record<string, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending: { label: 'Documentos em análise', color: COLORS.warning, icon: 'time-outline' },
  verified: { label: 'Cadastro verificado', color: COLORS.success, icon: 'checkmark-circle' },
  rejected: { label: 'Cadastro rejeitado — fale com o suporte', color: COLORS.danger, icon: 'close-circle' },
};

export function DriverHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, refreshCompany } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const profile = user?.profile as any;
  const driver = user?.driver;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCompany();
    } finally {
      setRefreshing(false);
    }
  }, [refreshCompany]);

  const verification = VERIFICATION_LABEL[profile?.verification_status] || VERIFICATION_LABEL.pending;
  const avatarUrl = getSupabaseAvatarUrl(profile?.avatar_url);
  const firstName = (profile?.name || '').split(' ')[0] || 'Motorista';

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Olá, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Bem-vindo de volta</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        <View style={[styles.statusCard, { borderColor: verification.color + '55' }]}>
          <Ionicons name={verification.icon} size={22} color={verification.color} />
          <Text style={[styles.statusText, { color: verification.color }]}>{verification.label}</Text>
        </View>

        <TouchableOpacity style={styles.freightsCta} onPress={() => navigation.navigate('FreightsTab')} activeOpacity={0.85}>
          <View style={styles.freightsCtaIcon}>
            <Ionicons name="document-text-outline" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.freightsCtaTitle}>Fretes disponíveis</Text>
            <Text style={styles.freightsCtaText}>Busque fretes por rota e fale direto com quem publicou</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {driver && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meu Veículo</Text>
            <Row label="Placa" value={driver.vehicle_plate || '-'} />
            <Row label="Modelo" value={driver.vehicle_model || '-'} />
            <Row label="Tipo" value={driver.vehicle_type || '-'} />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acesso rápido</Text>
          <QuickLink icon="document-text-outline" label="Fretes disponíveis" onPress={() => navigation.navigate('FreightsTab')} />
          <QuickLink icon="chatbubbles-outline" label="Mensagens" onPress={() => navigation.navigate('ChatTab')} />
          <QuickLink icon="person-outline" label="Meu Perfil" onPress={() => navigation.navigate('ProfileTab')} />
          <QuickLink icon="settings-outline" label="Configurações" onPress={() => navigation.navigate('Settings')} />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function QuickLink({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickLink} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.quickLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  greeting: { fontSize: 17, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 1.5, padding: 14,
  },
  statusText: { fontSize: 13, fontWeight: '700', flex: 1 },
  freightsCta: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 16,
  },
  freightsCtaIcon: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
  },
  freightsCtaTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  freightsCtaText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowLabel: { fontSize: 13, color: COLORS.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  quickLinkText: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
});
