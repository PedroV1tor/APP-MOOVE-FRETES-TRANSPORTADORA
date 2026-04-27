import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../utils/constants';

type SettingsPage = 'notifications' | 'privacy' | 'help' | 'about';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const page: SettingsPage = route.params?.page || 'about';

  const titles: Record<SettingsPage, string> = {
    notifications: 'Notificações',
    privacy: 'Privacidade',
    help: 'Ajuda e Suporte',
    about: 'Sobre o App',
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{titles[page]}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {page === 'notifications' && <NotificationsPage />}
        {page === 'privacy' && <PrivacyPage />}
        {page === 'help' && <HelpPage />}
        {page === 'about' && <AboutPage />}
      </ScrollView>
    </View>
  );
}

function NotificationsPage() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [freightAlerts, setFreightAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [ratingAlerts, setRatingAlerts] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  return (
    <View style={styles.sections}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificações Push</Text>
        <ToggleRow label="Ativar notificações push" value={pushEnabled} onChange={setPushEnabled} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipos de Alerta</Text>
        <ToggleRow label="Novos fretes disponíveis" value={freightAlerts} onChange={setFreightAlerts} />
        <ToggleRow label="Mensagens recebidas" value={messageAlerts} onChange={setMessageAlerts} />
        <ToggleRow label="Avaliações recebidas" value={ratingAlerts} onChange={setRatingAlerts} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferências</Text>
        <ToggleRow label="Som de notificação" value={soundEnabled} onChange={setSoundEnabled} />
        <ToggleRow label="Vibração" value={vibrationEnabled} onChange={setVibrationEnabled} />
      </View>
    </View>
  );
}

function PrivacyPage() {
  const [shareLocation, setShareLocation] = useState(false);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);

  return (
    <View style={styles.sections}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visibilidade</Text>
        <ToggleRow label="Compartilhar localização" value={shareLocation} onChange={setShareLocation} />
        <ToggleRow label="Mostrar telefone no perfil" value={showPhone} onChange={setShowPhone} />
        <ToggleRow label="Mostrar e-mail no perfil" value={showEmail} onChange={setShowEmail} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados</Text>
        <TouchableOpacity style={styles.linkItem} onPress={() => Alert.alert('Termos de Uso', 'Os termos de uso e política de privacidade da MooveFretes regem o uso do aplicativo. Para mais informações, entre em contato pelo suporte.')}>
          <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
          <Text style={styles.linkText}>Termos de Uso</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem} onPress={() => Alert.alert('Política de Privacidade', 'A MooveFretes valoriza sua privacidade. Seus dados são protegidos e utilizados apenas para fins do serviço de transporte.')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
          <Text style={styles.linkText}>Política de Privacidade</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HelpPage() {
  return (
    <View style={styles.sections}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Central de Ajuda</Text>

        <TouchableOpacity style={styles.helpCard} onPress={() => Linking.openURL('https://wa.me/5500000000000?text=Olá, preciso de ajuda com o app MooveFretes Transportadora')}>
          <View style={[styles.helpIcon, { backgroundColor: '#25D366' + '15' }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </View>
          <View style={styles.helpInfo}>
            <Text style={styles.helpTitle}>WhatsApp</Text>
            <Text style={styles.helpDesc}>Fale conosco pelo WhatsApp</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpCard} onPress={() => Linking.openURL('mailto:suporte@moovefretes.com.br')}>
          <View style={[styles.helpIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.helpInfo}>
            <Text style={styles.helpTitle}>E-mail</Text>
            <Text style={styles.helpDesc}>suporte@moovefretes.com.br</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>
        <FAQItem question="Como criar um frete?" answer="Na aba Fretes, toque no botão '+' no canto inferior direito. Preencha todas as informações da carga, rota e pagamento." />
        <FAQItem question="Como encontrar motoristas?" answer="Na aba Motoristas, você pode filtrar por tipo de veículo, cidade, disponibilidade e avaliação." />
        <FAQItem question="Como funciona o chat?" answer="Você pode iniciar uma conversa com motoristas a partir do perfil deles ou de um frete. As mensagens são em tempo real." />
        <FAQItem question="Como editar meu perfil?" answer="Na aba Perfil, toque no ícone de edição no canto superior direito para alterar os dados da empresa." />
      </View>
    </View>
  );
}

function AboutPage() {
  const appVersion = '1.0.0';

  return (
    <View style={styles.sections}>
      <View style={[styles.section, { alignItems: 'center', gap: 12 }]}>
        <View style={styles.aboutLogo}>
          <Ionicons name="bus" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.aboutName}>MooveFretes</Text>
        <Text style={styles.aboutTagline}>Transportadora</Text>
        <Text style={styles.aboutVersion}>Versão {appVersion}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações</Text>
        <InfoRowStatic label="Desenvolvido por" value="Amplie Marketing" />
        <InfoRowStatic label="Plataforma" value="React Native + Expo" />
        <InfoRowStatic label="Backend" value="Supabase" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Links</Text>
        <TouchableOpacity style={styles.linkItem} onPress={() => Linking.openURL('https://moovefretes.com.br')}>
          <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
          <Text style={styles.linkText}>Site oficial</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkItem} onPress={() => Linking.openURL('https://instagram.com/moovefretes')}>
          <Ionicons name="logo-instagram" size={20} color={COLORS.primary} />
          <Text style={styles.linkText}>Instagram</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <Text style={styles.copyright}>
        © 2026 MooveFretes. Todos os direitos reservados.{'\n'}
        Desenvolvido por Amplie Marketing.
      </Text>
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
        thumbColor={value ? COLORS.primary : '#f4f3f4'}
      />
    </View>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={styles.faqItem} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
}

function InfoRowStatic({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  sections: { gap: 16 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  toggleLabel: { fontSize: 14, color: COLORS.text, flex: 1, marginRight: 12 },

  linkItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  linkText: { flex: 1, fontSize: 14, color: COLORS.text },

  helpCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  helpIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  helpInfo: { flex: 1, gap: 2 },
  helpTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  helpDesc: { fontSize: 12, color: COLORS.textSecondary },

  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, marginRight: 8 },
  faqAnswer: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginTop: 8 },

  aboutLogo: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  aboutName: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  aboutTagline: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  aboutVersion: { fontSize: 13, color: COLORS.textLight },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },

  copyright: {
    textAlign: 'center', fontSize: 11, color: COLORS.textLight, lineHeight: 18,
    marginTop: 8,
  },
});
