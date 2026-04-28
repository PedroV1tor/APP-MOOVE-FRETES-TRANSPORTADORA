-- 
-- 20260427_dashboard_rpc.sql
-- Auditoria MooveFretes: Item #48 (HomeScreen Optimization)
--

CREATE OR REPLACE FUNCTION get_carrier_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_active_freights BIGINT;
    v_available_drivers BIGINT;
    v_unread_messages BIGINT;
    v_monthly_revenue DECIMAL;
    v_month_start TIMESTAMPTZ;
BEGIN
    -- 1. Fretes Ativos
    SELECT count(*) INTO v_active_freights
    FROM freights
    WHERE publisher_id = p_user_id
    AND status NOT IN ('cancelled', 'inactive', 'completed');

    -- 2. Motoristas Disponíveis
    SELECT count(*) INTO v_available_drivers
    FROM drivers
    WHERE available = true;

    -- 3. Mensagens Não Lidas
    SELECT count(*) INTO v_unread_messages
    FROM messages
    WHERE sender_id != p_user_id
    AND is_read = false
    AND conversation_id IN (
        SELECT id FROM conversations 
        WHERE participant1_id = p_user_id OR participant2_id = p_user_id
    );

    -- 4. Receita Mensal
    v_month_start := date_trunc('month', now());
    SELECT COALESCE(SUM(COALESCE(value_estimate, 0)), 0) INTO v_monthly_revenue
    FROM freights
    WHERE publisher_id = p_user_id
    AND status IN ('completed', 'contracted')
    AND updated_at >= v_month_start;

    RETURN json_build_object(
        'activeFreights', v_active_freights,
        'availableDrivers', v_available_drivers,
        'unreadMessages', v_unread_messages,
        'monthlyRevenue', v_monthly_revenue
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
