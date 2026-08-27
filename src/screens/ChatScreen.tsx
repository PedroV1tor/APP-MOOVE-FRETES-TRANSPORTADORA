import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Vibration, Alert, Modal, Image, AppState,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { COLORS } from '../utils/constants';
import { uuidv4 } from '../utils/uuid';
import { CachedAvatar } from '../components/CachedAvatar';
import { UserProfileModal } from '../components/UserProfileModal';
import type { Message } from '../types';

/** Quantas mensagens carregar por página (load inicial + "carregar anteriores"). */
const PAGE_SIZE = 30;
/** Validade da URL assinada de anexo (bucket chat-attachments é privado). */
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 dias

type SendStatus = 'sending' | 'sent' | 'failed';

/** Mensagem como usada localmente: a linha do banco + estado de envio + campos de anexo. */
type ChatMessage = Message & {
  status?: SendStatus;
  read_at?: string | null;
  message_type?: string;
  attachments?: Array<{ type: string; url?: string; path?: string; filename?: string; name?: string; size?: number }>;
};

const byCreatedAt = (a: ChatMessage, b: ChatMessage) =>
  String(a.created_at).localeCompare(String(b.created_at));

/** Um insert que falhou por PK duplicada = a mensagem já está no banco (retry após timeout). */
const isDuplicateKey = (error: any) =>
  error?.code === '23505' || /duplicate key/i.test(error?.message || '');

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const {
    userId: otherUserId, userName, conversationId: initialConvId, userAvatar,
    source: pSource, sourceId, originCity: pOriginCity, originState: pOriginState,
    destinationCity: pDestinationCity, destinationState: pDestinationState,
    initialMessage,
  } = route.params || {};

  const [convData, setConvData] = useState({
    source: pSource,
    originCity: pOriginCity,
    originState: pOriginState,
    destinationCity: pDestinationCity,
    destinationState: pDestinationState,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(initialConvId || null);
  const [text, setText] = useState<string>(initialMessage || '');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showAttachOptions, setShowAttachOptions] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const firstUnreadIndexRef = useRef<number>(-1);
  const initialScrollDoneRef = useRef<boolean>(false);
  const lastMsgIdRef = useRef<string | null>(null);
  /** Timestamp da mensagem mais recente que já temos — âncora do sync incremental. */
  const newestAtRef = useRef<string | null>(null);
  const realtimeConnectedRef = useRef(false);

  // Guard against concurrent calls that could create duplicate conversations
  const isCreatingConversationRef = useRef(false);

  const getOrCreateConversation = useCallback(async (): Promise<string | null> => {
    if (!user || !otherUserId) return null;
    if (conversationId) return conversationId;
    if (isCreatingConversationRef.current) return null;

    isCreatingConversationRef.current = true;
    try {
      const participantsFilter =
        `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`;

      const { data: existingChats } = await supabase
        .from('conversations')
        .select('id, is_pinned, source, origin_city, origin_state, destination_city, destination_state, metadata')
        .or(participantsFilter)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingChats && existingChats.length > 0) {
        const conv = existingChats[0];
        setConversationId(conv.id);
        setIsPinned(conv.is_pinned || false);

        // Update local metadata state from DB if not already provided in params
        setConvData(prev => ({
          source: prev.source || (conv.source === 'direct' ? conv.metadata?.original_source : conv.source),
          originCity: prev.originCity || conv.origin_city,
          originState: prev.originState || conv.origin_state,
          destinationCity: prev.destinationCity || conv.destination_city,
          destinationState: prev.destinationState || conv.destination_state,
        }));

        if (pSource === 'freight' || pSource === 'route') {
          await supabase.from('conversations').update({
            source: pSource,
            source_id: sourceId || null,
            freight_id: pSource === 'freight' ? sourceId : null,
            origin_city: pOriginCity || null,
            origin_state: pOriginState || null,
            destination_city: pDestinationCity || null,
            destination_state: pDestinationState || null,
            metadata: { original_source: pSource },
          }).eq('id', conv.id);
        }

        return conv.id;
      }

      const { data: created, error } = await supabase
        .from('conversations')
        .insert({
          participant1_id: user.id,
          participant2_id: otherUserId,
          source: pSource || 'direct',
          source_id: sourceId || null,
          freight_id: pSource === 'freight' ? sourceId : null,
          origin_city: pOriginCity || null,
          origin_state: pOriginState || null,
          destination_city: pDestinationCity || null,
          destination_state: pDestinationState || null,
          metadata: { original_source: pSource || 'direct' },
        })
        .select('id')
        .single();

      if (error) {
        // Corrida: a outra ponta criou a conversa entre o SELECT e o INSERT.
        // Com o índice único uq_conversations_participant_pair (migration 0019)
        // isso vira erro 23505 — basta reconsultar.
        if (isDuplicateKey(error)) {
          const { data: retry } = await supabase
            .from('conversations')
            .select('id')
            .or(participantsFilter)
            .order('created_at', { ascending: false })
            .limit(1);
          if (retry && retry.length > 0) {
            setConversationId(retry[0].id);
            return retry[0].id;
          }
        }
        console.error('[ChatScreen] Failed to create conversation:', error);
        return null;
      }

      if (created) {
        setConversationId(created.id);
        return created.id;
      }

      return null;
    } finally {
      isCreatingConversationRef.current = false;
    }
  }, [user, otherUserId, conversationId, pSource, sourceId, pOriginCity, pOriginState, pDestinationCity, pDestinationState]);

  async function handlePinConversation() {
    if (!conversationId) return;
    setShowOptionsModal(false);
    const newVal = !isPinned;
    setIsPinned(newVal);
    const { error } = await supabase.from('conversations').update({ is_pinned: newVal }).eq('id', conversationId);
    if (error) {
      setIsPinned(!newVal);
    }
  }

  async function handleDeleteConversation() {
    if (!conversationId) return;
    setShowOptionsModal(false);
    setTimeout(() => {
      Alert.alert(
        'Apagar Conversa',
        'Deseja ocultar esta conversa? Você não a verá mais, mas o histórico continuará disponível para o outro participante.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Apagar',
            style: 'destructive',
            onPress: async () => {
              // Soft delete: nunca apagamos as mensagens do banco — só escondemos
              // a conversa para o participante atual (igual ao ChatListScreen).
              const { data: convRow } = await supabase
                .from('conversations')
                .select('participant1_id')
                .eq('id', conversationId)
                .single();

              const isP1 = convRow?.participant1_id === user?.id;
              const column = isP1 ? 'deleted_by_participant1' : 'deleted_by_participant2';

              const { error } = await supabase
                .from('conversations')
                .update({ [column]: true })
                .eq('id', conversationId);

              if (error) {
                Alert.alert('Erro', 'Não foi possível apagar a conversa.');
              } else {
                navigation.goBack();
              }
            },
          },
        ]
      );
    }, 100);
  }

  const load = useCallback(async () => {
    if (!user || !otherUserId) return;
    const convId = await getOrCreateConversation();
    if (!convId) { setLoading(false); return; }

    // Página inicial: as PAGE_SIZE mensagens mais recentes (não a conversa toda).
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    const msgs = ((data as ChatMessage[]) || []).slice().reverse();
    setHasMore((data?.length || 0) === PAGE_SIZE);

    // Determine the index of the first unread message (from the other user)
    // BEFORE marking them as read, so we can scroll to it on open.
    const firstUnread = msgs.findIndex(m => m.sender_id !== user.id && !m.is_read);
    firstUnreadIndexRef.current = firstUnread;
    initialScrollDoneRef.current = false;

    newestAtRef.current = msgs.length ? String(msgs[msgs.length - 1].created_at) : null;
    setMessages(msgs);
    setLoading(false);

    const { error: updateError } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (updateError && __DEV__) console.warn('Failed to update messages read status:', updateError);
  }, [user, otherUserId, getOrCreateConversation]);

  useEffect(() => { load(); }, [load]);

  const loadOlder = useCallback(async () => {
    if (loadingOlder || !hasMore || !conversationId || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = String(messages[0].created_at);
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .lt('created_at', oldest)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      const older = ((data as ChatMessage[]) || []).slice().reverse();
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id));
        return [...older.filter(m => !ids.has(m.id)), ...prev];
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMore, conversationId, messages]);

  /**
   * Sincronização incremental: busca tudo que entrou depois da nossa mensagem
   * mais recente. Chamado quando o Realtime (re)conecta, ao voltar do
   * background e pelo polling de fallback — garante que nenhuma mensagem
   * "somе" da tela quando o websocket cai (4G instável na estrada).
   */
  const syncMissed = useCallback(async () => {
    if (!conversationId || !user) return;
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (newestAtRef.current) query = query.gt('created_at', newestAtRef.current);
    else query = query.limit(PAGE_SIZE);

    const { data } = await query;
    const incoming = (data as ChatMessage[]) || [];
    if (incoming.length === 0) return;

    setMessages(prev => {
      const ids = new Set(prev.map(m => m.id));
      const merged = [...prev];
      for (const m of incoming) if (!ids.has(m.id)) merged.push(m);
      merged.sort(byCreatedAt);
      return merged;
    });

    const toMarkRead = incoming.filter(m => m.sender_id !== user.id && !m.is_read).map(m => m.id);
    if (toMarkRead.length > 0) {
      await supabase.from('messages').update({ is_read: true }).in('id', toMarkRead);
    }
  }, [conversationId, user]);

  // ── Realtime com reconexão + fallback de polling + resync ao voltar do background
  useEffect(() => {
    if (!conversationId || !user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let backoff = 1000;

    const setConnected = (v: boolean) => {
      realtimeConnectedRef.current = v;
      setRealtimeConnected(v);
    };

    const connect = () => {
      if (cancelled) return;
      // Nome único evita o erro "cannot add postgres_changes callbacks after subscribe()"
      // quando mais de uma instância desta tela está montada na stack.
      const channelName = `chat-conv-${conversationId}-${Math.random().toString(36).slice(2)}`;

      channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) {
              // Já existe (era a nossa mensagem otimista) — só confirma o status.
              return prev.map(m => (m.id === msg.id ? { ...m, ...msg, status: 'sent' } : m));
            }
            const next = [...prev, msg];
            next.sort(byCreatedAt);
            return next;
          });
          if (msg.sender_id !== user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, (payload) => {
          // Recibo de leitura em tempo real: o outro leu, atualiza o ✓✓ aqui.
          const msg = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => (
            m.id === msg.id ? { ...m, is_read: msg.is_read, read_at: msg.read_at } : m
          )));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setConnected(true);
            backoff = 1000;
            syncMissed(); // pega o que perdeu enquanto (re)conectava
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            setConnected(false);
            if (!cancelled && !reconnectTimer) {
              reconnectTimer = setTimeout(() => {
                reconnectTimer = null;
                try { if (channel) supabase.removeChannel(channel); } catch {}
                connect();
              }, backoff);
              backoff = Math.min(backoff * 2, 30000);
            }
          }
        });
    };

    connect();

    // Fallback: enquanto o Realtime está fora, puxa mensagens a cada 8s.
    const fastPoll = setInterval(() => {
      if (!cancelled && !realtimeConnectedRef.current) syncMissed();
    }, 8000);
    // Rede de segurança: resync a cada 45s mesmo com o Realtime "conectado".
    const slowPoll = setInterval(() => {
      if (!cancelled) syncMissed();
    }, 45000);

    const appStateSub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && !cancelled) syncMissed();
    });

    return () => {
      cancelled = true;
      setConnected(false);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      clearInterval(fastPoll);
      clearInterval(slowPoll);
      appStateSub.remove();
      try { if (channel) supabase.removeChannel(channel); } catch {}
    };
  }, [conversationId, user, syncMissed]);

  // Mantém a âncora do sync incremental sempre no timestamp mais recente exibido.
  useEffect(() => {
    if (messages.length === 0) return;
    const newest = messages.reduce((acc, m) => (
      String(m.created_at) > acc ? String(m.created_at) : acc
    ), newestAtRef.current || '');
    if (newest) newestAtRef.current = newest;
  }, [messages]);

  // Resolve URLs assinadas dos anexos (o bucket chat-attachments é privado).
  useEffect(() => {
    const missing = new Set<string>();
    for (const m of messages) {
      const atts = m.attachments;
      if (Array.isArray(atts)) {
        for (const a of atts) {
          if (a?.path && !signedUrls[a.path]) missing.add(a.path);
        }
      }
    }
    if (missing.size === 0) return;

    let cancelled = false;
    (async () => {
      const paths = [...missing];
      const { data } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrls(paths, SIGNED_URL_TTL);
      if (cancelled || !data) return;
      setSignedUrls(prev => {
        const next = { ...prev };
        for (const d of data) {
          if (d.signedUrl && d.path) next[d.path] = d.signedUrl;
        }
        return next;
      });
    })();
    return () => { cancelled = true; };
  }, [messages, signedUrls]);

  useEffect(() => {
    if (messages.length === 0) return;
    const lastId = messages[messages.length - 1].id;

    if (!initialScrollDoneRef.current) {
      // Initial load: scroll to first unread or to the end
      initialScrollDoneRef.current = true;
      lastMsgIdRef.current = lastId;
      const unreadIndex = firstUnreadIndexRef.current;

      let groupedUnreadIndex = -1;
      if (unreadIndex >= 0) {
        let sepCount = 0;
        let lastDay = '';
        for (let i = 0; i <= unreadIndex; i++) {
          const day = new Date(messages[i].created_at).toDateString();
          if (day !== lastDay) { sepCount++; lastDay = day; }
        }
        groupedUnreadIndex = unreadIndex + sepCount;
      }

      setTimeout(() => {
        if (groupedUnreadIndex >= 0) {
          flatListRef.current?.scrollToIndex({ index: groupedUnreadIndex, animated: false, viewPosition: 0 });
        } else {
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }, 150);
      return;
    }

    // Só rola pro fim quando chega mensagem NOVA no fim — não ao carregar anteriores.
    if (lastId !== lastMsgIdRef.current) {
      lastMsgIdRef.current = lastId;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  /** Persiste (ou re-persiste, no retry) uma mensagem já presente na lista como otimista. */
  const persistMessage = useCallback(async (msg: ChatMessage) => {
    if (!user) return;
    setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, status: 'sending' } : m)));

    const { data, error } = await supabase
      .from('messages')
      .insert({
        id: msg.id, // id gerado no cliente => retry é idempotente
        conversation_id: msg.conversation_id,
        sender_id: user.id,
        content: msg.content,
        message_type: msg.message_type || 'text',
        attachments: msg.attachments || [],
        is_read: false,
        // created_at é responsabilidade do banco (trigger enforce_messages_created_at)
      })
      .select()
      .single();

    if (error && !isDuplicateKey(error)) {
      setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, status: 'failed' } : m)));
      return;
    }

    const saved = (data as ChatMessage) || {};
    setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, ...saved, status: 'sent' } : m)));
    // last_message_at da conversa é atualizado pelo trigger on_message_insert_update_conv.
    // Notificação in-app é criada pelo trigger on_message_insert_notification.
  }, [user]);

  const retryMessage = useCallback((id: string) => {
    const msg = messages.find(m => m.id === id);
    if (msg) persistMessage(msg);
  }, [messages, persistMessage]);

  async function handleSend() {
    if (!text.trim() || !user || !otherUserId) return;
    Vibration.vibrate(50);
    const content = text.trim();
    setSending(true);
    setText('');

    let convId = conversationId;
    if (!convId) convId = await getOrCreateConversation();
    if (!convId) {
      setText(content); // devolve o texto pro input — não perdemos a mensagem
      setSending(false);
      return;
    }

    const optimistic: ChatMessage = {
      id: uuidv4(),
      conversation_id: convId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      status: 'sending',
    };
    setMessages(prev => [...prev, optimistic]);
    setSending(false);
    await persistMessage(optimistic);
  }

  const processAttachment = async (uri: string, name: string, mimeType: string) => {
    setSending(true);
    try {
      let convId = conversationId;
      if (!convId) convId = await getOrCreateConversation();
      if (!convId) { setSending(false); return; }

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const buffer = decode(base64);

      const ext = (name.split('.').pop() || 'bin').toLowerCase();
      // Path exigido pelas policies do bucket privado: 1ª pasta = conversation_id.
      const filePath = `${convId}/${uuidv4()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, buffer, {
          contentType: mimeType || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        Alert.alert('Erro no Upload', `Detalhes: ${uploadError.message}`);
        return;
      }

      const { data: signed } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(filePath, SIGNED_URL_TTL);

      const isImage = (mimeType || '').startsWith('image/');
      const messageType = isImage ? 'image' : 'file';
      const attachment = {
        type: isImage ? 'image' : 'document',
        path: filePath,               // fonte da verdade — URL assinada é resolvida na hora de exibir
        url: signed?.signedUrl,       // conveniência (expira)
        filename: name,
        name,
      };
      if (signed?.signedUrl && attachment.path) {
        setSignedUrls(prev => ({ ...prev, [attachment.path]: signed.signedUrl }));
      }

      const optimistic: ChatMessage = {
        id: uuidv4(),
        conversation_id: convId,
        sender_id: user!.id,
        content: name,
        created_at: new Date().toISOString(),
        is_read: false,
        message_type: messageType,
        attachments: [attachment],
        status: 'sending',
      };
      setMessages(prev => [...prev, optimistic]);
      setPendingAttachment(null);
      await persistMessage(optimistic);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Erro', e?.message || 'Ocorreu um erro ao anexar item.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachDocument = () => {
    if (sending) return;
    setShowAttachOptions(false);
    setTimeout(async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        const asset = result.assets[0];
        setPendingAttachment({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'unknown' });
      } catch(e: any) {
        Alert.alert('Erro no Documento', e?.message || 'Falha ao abrir seletor');
      }
    }, 400);
  };

  const handleAttachGallery = () => {
    if (sending) return;
    setShowAttachOptions(false);
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para enviar fotos.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          // O bucket chat-attachments só aceita imagens e PDF (migration 0017).
          mediaTypes: ['images'],
          quality: 0.8,
        });
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        const asset = result.assets[0];
        const name = asset.fileName || asset.uri.split('/').pop() || 'imagem.jpg';
        let mimeType = asset.mimeType || 'image/jpeg';
        if (!asset.mimeType) {
           if (name.toLowerCase().endsWith('.png')) mimeType = 'image/png';
           else if (name.toLowerCase().endsWith('.gif')) mimeType = 'image/gif';
        }
        setPendingAttachment({ uri: asset.uri, name, mimeType });
      } catch(e: any) {
        console.error(e);
        Alert.alert('Erro na Galeria', e?.message || 'Falha ao abrir galeria');
      }
    }, 400);
  };

  const handleAttachCamera = () => {
    if (sending) return;
    setShowAttachOptions(false);
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para tirar fotos.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
        });
        if (result.canceled || !result.assets || result.assets.length === 0) return;
        const asset = result.assets[0];
        const name = asset.fileName || asset.uri.split('/').pop() || 'foto.jpg';
        let mimeType = asset.mimeType || 'image/jpeg';
        if (!asset.mimeType) {
           if (name.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        }
        setPendingAttachment({ uri: asset.uri, name, mimeType });
      } catch(e: any) {
        console.error(e);
        Alert.alert('Erro na Câmera', e?.message || 'Falha ao abrir câmera');
      }
    }, 400);
  };

  function formatTime(dateString: string) {
    const d = new Date(dateString);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDay(dateString: string) {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  }

  const groupedMessages: (ChatMessage | { type: 'separator'; label: string; key: string })[] = [];
  let lastDay = '';
  messages.forEach(msg => {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      groupedMessages.push({ type: 'separator', label: formatDay(msg.created_at), key: `sep-${day}` });
      lastDay = day;
    }
    groupedMessages.push(msg);
  });

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={[styles.flex, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'ChatTab', params: { screen: 'ChatList' } })} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => setShowProfileModal(true)} activeOpacity={0.8}>
          <CachedAvatar
            uri={userAvatar}
            name={userName}
            size={40}
            borderRadius={20}
          />
          <View style={styles.headerInfoText}>
            {(convData.source === 'freight' || convData.source === 'route') && convData.originCity && convData.destinationCity && (
              <View style={styles.headerRouteRow}>
                <Ionicons
                  name={convData.source === 'freight' ? 'document-text-outline' : 'map-outline'}
                  size={10}
                  color={COLORS.primary}
                />
                <Text style={styles.headerRouteText} numberOfLines={1} ellipsizeMode="tail">
                  {convData.originCity}/{convData.originState}
                </Text>
                <Ionicons name="arrow-forward" size={10} color={COLORS.textSecondary} />
                <Text style={styles.headerRouteText} numberOfLines={1} ellipsizeMode="tail">
                  {convData.destinationCity}/{convData.destinationState}
                </Text>
              </View>
            )}
            <Text style={styles.headerName}>{userName || 'Conversa'}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerOptionsBtn} onPress={() => setShowOptionsModal(true)}>
          <Ionicons name="ellipsis-vertical" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {!realtimeConnected && !loading && (
        <View style={styles.connBanner}>
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
          <Text style={styles.connBannerText}>Reconectando… as mensagens continuam sendo sincronizadas</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          keyExtractor={(item, i) => ('key' in item ? item.key : item.id) || String(i)}
          contentContainerStyle={styles.messages}
          maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
          onScrollToIndexFailed={() => {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
          }}
          ListHeaderComponent={
            hasMore ? (
              <TouchableOpacity
                style={styles.loadOlderBtn}
                onPress={loadOlder}
                disabled={loadingOlder}
                activeOpacity={0.7}
              >
                {loadingOlder
                  ? <ActivityIndicator size="small" color={COLORS.primary} />
                  : <Text style={styles.loadOlderText}>Carregar mensagens anteriores</Text>}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => {
            if ('type' in item) {
              return (
                <View style={styles.daySeparator}>
                  <View style={styles.dayLine} />
                  <Text style={styles.dayLabel}>{item.label}</Text>
                  <View style={styles.dayLine} />
                </View>
              );
            }
            const isMine = item.sender_id === user?.id;

            const msgType = item.message_type;
            const attachments = item.attachments;
            const hasAttachment = (msgType === 'image' || msgType === 'file') && attachments && attachments.length > 0;

            // Fallback legado [FILE]
            const isLegacyFile = !hasAttachment && item.content.startsWith('[FILE]');
            let legacyFileUrl = '';
            let legacyFileName = '';
            let legacyFileType = '';
            if (isLegacyFile) {
              const parts = item.content.replace('[FILE]', '').split('|');
              legacyFileUrl = parts[0]?.trim();
              legacyFileName = parts[1]?.trim() || 'Arquivo Anexado';
              legacyFileType = parts[2]?.trim() || 'unknown';
            }

            const att = hasAttachment ? attachments![0] : null;
            const attUrl = (att?.path && signedUrls[att.path]) || att?.url || legacyFileUrl;
            const attName = att?.filename || att?.name || legacyFileName;
            const attIsImage = hasAttachment ? msgType === 'image' : legacyFileType.startsWith('image/');
            const isFile = hasAttachment || isLegacyFile;
            const failed = item.status === 'failed';
            const pending = item.status === 'sending';

            return (
              <View style={[styles.msgWrap, isMine ? styles.msgWrapRight : styles.msgWrapLeft]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther, attIsImage && isFile && { paddingHorizontal: 4, paddingVertical: 4 }, failed && styles.bubbleFailed]}>
                  {isFile ? (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => attUrl && Linking.openURL(attUrl)}>
                      {attIsImage ? (
                         attUrl
                           ? <Image source={{ uri: attUrl }} style={styles.chatImage} resizeMode="cover" />
                           : <View style={[styles.chatImage, styles.chatImageLoading]}><ActivityIndicator size="small" color={COLORS.primary} /></View>
                      ) : (
                         <View style={styles.fileRow}>
                            <Ionicons name="document-text" size={32} color={isMine ? '#fff' : COLORS.primary} />
                            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine, { textDecorationLine: 'underline', maxWidth: 200 }]} numberOfLines={2}>
                              {attName}
                            </Text>
                         </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                      {item.content}
                    </Text>
                  )}
                  <View style={[styles.bubbleFooter, attIsImage && isFile && { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginTop: 0 }]}>
                    <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine, attIsImage && isFile && { color: '#fff' }]}>
                      {formatTime(item.created_at)}
                    </Text>
                    {isMine && !failed && (
                      <Ionicons
                        name={pending ? 'time-outline' : (item.is_read ? 'checkmark-done' : 'checkmark')}
                        size={12}
                        color={item.is_read ? (attIsImage && isFile ? '#4ade80' : '#fff') : 'rgba(255,255,255,0.6)'}
                      />
                    )}
                  </View>
                  {failed && (
                    <TouchableOpacity style={styles.retryRow} onPress={() => retryMessage(item.id)} activeOpacity={0.7}>
                      <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
                      <Text style={styles.retryText}>Falha ao enviar — tocar para tentar de novo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-outline" size={40} color={COLORS.textLight} />
              <Text style={styles.emptyChatText}>Nenhuma mensagem ainda.{'\n'}Inicie a conversa!</Text>
            </View>
          }
        />
      )}

      <UserProfileModal
        visible={showProfileModal}
        userId={otherUserId || ''}
        onClose={() => setShowProfileModal(false)}
      />

      <Modal visible={showOptionsModal} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsModal(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle} numberOfLines={1}>{userName}</Text>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowOptionsModal(false);
                setTimeout(() => setShowProfileModal(true), 100);
              }}
            >
              <Ionicons name="person-outline" size={22} color={COLORS.text} />
              <Text style={styles.actionOptionText}>Ver perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handlePinConversation}
            >
              <Ionicons name={isPinned ? "pin" : "pin-outline"} size={22} color={COLORS.text} />
              <Text style={styles.actionOptionText}>
                {isPinned ? 'Desfixar conversa' : 'Fixar conversa'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeleteConversation}
            >
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.actionOptionText, { color: COLORS.danger }]}>Apagar conversa</Text>
            </TouchableOpacity>

            <View style={[styles.actionSheetFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity style={styles.actionCancelBtn} onPress={() => setShowOptionsModal(false)}>
                <Text style={styles.actionCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>


      {pendingAttachment && (
        <View style={styles.previewBar}>
          {pendingAttachment.mimeType.startsWith('image/') ? (
            <Image source={{ uri: pendingAttachment.uri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.previewDoc}>
              <Ionicons name="document-text" size={28} color={COLORS.primary} />
              <Text style={styles.previewDocName} numberOfLines={2}>{pendingAttachment.name}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.previewCancel} onPress={() => setPendingAttachment(null)}>
            <Ionicons name="close-circle" size={22} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.attachBtn} onPress={() => setShowAttachOptions(true)} disabled={sending}>
          <Ionicons name="attach" size={26} color={COLORS.textLight} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder={pendingAttachment ? 'Adicione uma legenda...' : 'Escreva uma mensagem...'}
          placeholderTextColor={COLORS.textLight}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, ((!text.trim() && !pendingAttachment) || sending) && styles.sendBtnDisabled]}
          onPress={() => {
            if (pendingAttachment) {
              processAttachment(pendingAttachment.uri, pendingAttachment.name, pendingAttachment.mimeType);
            } else {
              handleSend();
            }
          }}
          disabled={(!text.trim() && !pendingAttachment) || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>

    {showAttachOptions && (
      <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAttachOptions(false)}>
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHeader}>
              <Text style={styles.actionSheetTitle}>Adicionar Anexo</Text>
            </View>

            <TouchableOpacity style={styles.actionOption} onPress={handleAttachCamera}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionOptionText}>Câmera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={handleAttachGallery}>
              <Ionicons name="image-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionOptionText}>Galeria de Fotos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOption} onPress={handleAttachDocument}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionOptionText}>Documento</Text>
            </TouchableOpacity>

            <View style={[styles.actionSheetFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity style={styles.actionCancelBtn} onPress={() => setShowAttachOptions(false)}>
                <Text style={styles.actionCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerInfoText: { gap: 1, flex: 1 },
  headerRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 1 },
  headerRouteText: { fontSize: 10, color: COLORS.primary, fontWeight: '600', flexShrink: 1 },
  headerName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 12, color: COLORS.textSecondary },
  connBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.borderLight,
  },
  connBannerText: { fontSize: 11, color: COLORS.textSecondary },
  loadOlderBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  loadOlderText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  messages: { padding: 12, paddingBottom: 8, gap: 4 },
  daySeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dayLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  dayLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  msgWrap: { flexDirection: 'row', marginVertical: 4 },
  msgWrapRight: { justifyContent: 'flex-end' },
  msgWrapLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleFailed: { borderWidth: 1, borderColor: COLORS.danger },
  bubbleText: { fontSize: 15, color: COLORS.text, lineHeight: 21 },
  bubbleTextMine: { color: '#fff' },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 2 },
  bubbleTime: { fontSize: 10, color: COLORS.textSecondary },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.7)' },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  retryText: { fontSize: 10, color: COLORS.danger, fontWeight: '600', flexShrink: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5, backgroundColor: COLORS.border },
  emptyChat: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyChatText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  headerOptionsBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  actionSheetHeader: {
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight, alignItems: 'center',
  },
  actionSheetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  actionOption: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  actionOptionText: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  actionSheetFooter: { padding: 16 },
  actionCancelBtn: {
    backgroundColor: COLORS.background, padding: 14, borderRadius: 8, alignItems: 'center',
  },
  actionCancelText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  chatImage: {
    width: 220,
    height: 280,
    borderRadius: 12,
  },
  chatImageLoading: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.borderLight },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
  },
  attachBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
  },
  previewDoc: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  previewDocName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  previewCancel: {
    padding: 4,
  },
});
