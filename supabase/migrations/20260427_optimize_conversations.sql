-- 
-- 20260427_optimize_conversations.sql
-- Auditoria MooveFretes: Itens #16 (Soft Delete) e #20 (N+1 Optimization)
--

-- 1. Adicionar colunas para Soft Delete
-- Permite que um participante apague a conversa sem sumir para o outro
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_by_participant1 boolean DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_by_participant2 boolean DEFAULT false;

-- 2. Adicionar colunas para Otimização (Item #20)
-- Evita queries N+1 ao buscar a última mensagem na lista de chats
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_content text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_sender_id uuid REFERENCES auth.users(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_read boolean DEFAULT false;

-- 3. Atualizar dados existentes
UPDATE conversations c
SET 
  last_message_content = m.content,
  last_message_sender_id = m.sender_id,
  last_message_read = m.is_read,
  last_message_at = m.created_at
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, content, sender_id, is_read, created_at
  FROM messages
  ORDER BY conversation_id, created_at DESC
) m
WHERE c.id = m.conversation_id;

-- 4. Trigger para manter os dados atualizados automaticamente
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_content = NEW.content,
    last_message_sender_id = NEW.sender_id,
    last_message_read = false, -- Nova mensagem começa como não lida
    last_message_at = NEW.created_at,
    -- Resetar soft delete quando chegar mensagem nova
    deleted_by_participant1 = false,
    deleted_by_participant2 = false
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_insert_update_conv ON messages;
CREATE TRIGGER on_message_insert_update_conv
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- 5. Trigger para atualizar status de leitura na conversa
CREATE OR REPLACE FUNCTION update_conversation_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    -- Se a mensagem que ficou lida for a última, atualiza o status na conversa
    UPDATE conversations
    SET last_message_read = true
    WHERE id = NEW.conversation_id 
    AND last_message_at = NEW.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_read_update_conv ON messages;
CREATE TRIGGER on_message_read_update_conv
AFTER UPDATE OF is_read ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_read_status();
