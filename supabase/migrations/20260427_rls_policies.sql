-- 
-- 20260427_rls_policies.sql
-- Auditoria MooveFretes: Item #14 (Row Level Security)
--

-- 1. Habilitar RLS em todas as tabelas principais
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para PROFILES
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Políticas para COMPANIES
CREATE POLICY "Companies viewable by everyone" ON companies FOR SELECT USING (true);
CREATE POLICY "Users can update own company" ON companies FOR UPDATE USING (auth.uid() = user_id);

-- 4. Políticas para FREIGHTS
CREATE POLICY "Public freights viewable by everyone" ON freights FOR SELECT USING (status IN ('active', 'scheduled') OR auth.uid() = publisher_id);
CREATE POLICY "Users can manage own freights" ON freights FOR ALL USING (auth.uid() = publisher_id);

-- 5. Políticas para DRIVERS
CREATE POLICY "Drivers viewable by everyone" ON drivers FOR SELECT USING (true);
CREATE POLICY "Drivers can update own record" ON drivers FOR UPDATE USING (auth.uid() = user_id);

-- 6. Políticas para CONVERSATIONS
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Users can update their conversations" ON conversations FOR UPDATE USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- 7. Políticas para MESSAGES
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
  )
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (conversations.participant1_id = auth.uid() OR conversations.participant2_id = auth.uid())
  )
);

-- 8. Políticas para NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- 9. Políticas para RATINGS
CREATE POLICY "Ratings viewable by everyone" ON ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON ratings FOR INSERT WITH CHECK (auth.uid() = author_id);
