import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { mapSupabaseFreight, fetchPublisherProfiles } from '../utils/helpers';

const PAGE_SIZE = 20;

async function fetchFreightsPage(publisherId: string | null, cursor: string | null) {
  if (!publisherId) return { items: [], nextCursor: null };

  let query = supabase
    .from('freights')
    .select('*')
    .eq('publisher_id', publisherId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return { items: [], nextCursor: null };

  const profiles = await fetchPublisherProfiles(supabase, rows);
  const items = rows.map(row => mapSupabaseFreight(row, profiles.get(row.publisher_id)));
  const nextCursor = rows.length === PAGE_SIZE ? rows[rows.length - 1].created_at : null;

  return { items, nextCursor };
}

async function fetchAllFreightsPage(cursor: string | null) {
  let query = supabase
    .from('freights')
    .select('*')
    .in('status', ['active', 'scheduled'])
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return { items: [], nextCursor: null };

  const profiles = await fetchPublisherProfiles(supabase, rows);
  const items = rows.map(row => mapSupabaseFreight(row, profiles.get(row.publisher_id)));
  const nextCursor = rows.length === PAGE_SIZE ? rows[rows.length - 1].created_at : null;

  return { items, nextCursor };
}

// Assina mudanças em `freights` no Supabase Realtime e invalida a query do
// React Query correspondente, pra refletir sem precisar recarregar a tela —
// tanto os fretes do próprio publisher quanto a listagem geral.
function useFreightsRealtimeSync(queryKey: (string | null)[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`freights-realtime-${queryKey.join(':')}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freights' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey.join(':')]);
}

export function useFreights(publisherId: string | null) {
  useFreightsRealtimeSync(['freights', publisherId]);

  return useInfiniteQuery({
    queryKey: ['freights', publisherId],
    queryFn: ({ pageParam }) => fetchFreightsPage(publisherId, pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
}

export function useAllFreights() {
  useFreightsRealtimeSync(['freights', 'all']);

  return useInfiniteQuery({
    queryKey: ['freights', 'all'],
    queryFn: ({ pageParam }) => fetchAllFreightsPage(pageParam as string | null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60_000,
  });
}
