import {
  INITIAL_ARTIST_PROFILE,
  INITIAL_PAYOUT_REQUESTS,
  INITIAL_RELEASES,
  INITIAL_ROYALTY_TRANSACTIONS,
} from '../data/seedCatalog';
import { getSupabaseClient } from '../lib/supabase';
import {
  ArtistProfile,
  DeliveryStatus,
  PayoutRequest,
  ReleaseItem,
  RoyaltyTransaction,
} from '../types/distribution';

const LS_RELEASES = 'tank_dist_releases_v2';
const LS_TRANSACTIONS = 'tank_dist_transactions_v2';
const LS_PAYOUTS = 'tank_dist_payouts_v2';
const LS_PROFILE = 'tank_dist_profile_v2';

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export async function fetchAllDistributionData(): Promise<{
  releases: ReleaseItem[];
  transactions: RoyaltyTransaction[];
  payouts: PayoutRequest[];
  profile: ArtistProfile;
  source: 'supabase' | 'local';
}> {
  const localReleases = loadFromStorage<ReleaseItem[]>(LS_RELEASES, INITIAL_RELEASES);
  const localTransactions = loadFromStorage<RoyaltyTransaction[]>(
    LS_TRANSACTIONS,
    INITIAL_ROYALTY_TRANSACTIONS
  );
  const localPayouts = loadFromStorage<PayoutRequest[]>(LS_PAYOUTS, INITIAL_PAYOUT_REQUESTS);
  const localProfile = loadFromStorage<ArtistProfile>(LS_PROFILE, INITIAL_ARTIST_PROFILE);

  const client = getSupabaseClient();
  if (!client) {
    return {
      releases: localReleases,
      transactions: localTransactions,
      payouts: localPayouts,
      profile: localProfile,
      source: 'local',
    };
  }

  try {
    const { data: relRows, error: relErr } = await client
      .from('releases')
      .select('*, tracks(*), royalty_splits(*), dsp_deliveries(*)')
      .order('created_at', { ascending: false });

    if (relErr || !relRows || relRows.length === 0) {
      return {
        releases: localReleases,
        transactions: localTransactions,
        payouts: localPayouts,
        profile: localProfile,
        source: 'local',
      };
    }

    const mappedReleases: ReleaseItem[] = relRows.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      title: String(row.title || ''),
      primaryArtist: String(row.primary_artist || ''),
      featuredArtists: String(row.featured_artists || ''),
      releaseType: (row.release_type as ReleaseItem['releaseType']) || 'Single',
      primaryGenre: String(row.primary_genre || 'Electronic'),
      subgenre: String(row.subgenre || ''),
      labelName: String(row.label_name || 'Tank Recordings'),
      upcCode: String(row.upc_code || ''),
      catalogNumber: String(row.catalog_number || ''),
      releaseDate: String(row.release_date || ''),
      originalReleaseDate: String(row.original_release_date || row.release_date || ''),
      pLine: String(row.p_line || ''),
      cLine: String(row.c_line || ''),
      coverArtUrl: String(row.cover_art_url || ''),
      status: (row.status as DeliveryStatus) || 'In Review',
      explicit: Boolean(row.explicit),
      storesSelected: Array.isArray(row.stores_selected)
        ? (row.stores_selected as string[])
        : ['Spotify', 'Apple Music & iTunes'],
      storesDelivered: Number(row.stores_delivered || 0),
      totalStreams: Number(row.total_streams || 0),
      totalRoyalties: Number(row.total_royalties || 0),
      ddexVersion: String(row.ddex_version || 'ERN-4.3'),
      createdAt: String(row.created_at || new Date().toISOString()),
      tracks: Array.isArray(row.tracks)
        ? (row.tracks as Record<string, unknown>[]).map((t) => ({
            id: String(t.id),
            releaseId: String(t.release_id),
            trackNumber: Number(t.track_number || 1),
            title: String(t.title || ''),
            version: String(t.version || 'Original Mix'),
            primaryArtist: String(t.primary_artist || ''),
            featuredArtists: String(t.featured_artists || ''),
            isrcCode: String(t.isrc_code || ''),
            songwriterLegalName: String(t.songwriter_legal_name || ''),
            explicitLyrics: Boolean(t.explicit_lyrics),
            language: String(t.language || 'English'),
            durationSeconds: Number(t.duration_seconds || 210),
            sampleRate: String(t.sample_rate || '24-bit / 48.0 kHz WAV'),
            integratedLufs: Number(t.integrated_lufs || -14.0),
            truePeakDbtp: Number(t.true_peak_dbtp || -0.2),
            audioUrl: t.audio_url ? String(t.audio_url) : undefined,
            synthPreset:
              (t.synth_preset as ReleaseItem['tracks'][0]['synthPreset']) || 'cyber-bass',
            streams: Number(t.streams || 0),
          }))
        : [],
      splits: Array.isArray(row.royalty_splits)
        ? (row.royalty_splits as Record<string, unknown>[]).map((s) => ({
            id: String(s.id),
            releaseId: String(s.release_id),
            collaboratorName: String(s.collaborator_name || ''),
            collaboratorEmail: String(s.collaborator_email || ''),
            role: (s.role as ReleaseItem['splits'][0]['role']) || 'Primary Artist',
            sharePercentage: Number(s.share_percentage || 100),
            status: (s.status as 'Verified' | 'Pending') || 'Verified',
            payoutMethod:
              (s.payout_method as ReleaseItem['splits'][0]['payoutMethod']) || 'Stripe Connect',
          }))
        : [],
      deliveries: Array.isArray(row.dsp_deliveries)
        ? (row.dsp_deliveries as Record<string, unknown>[]).map((d) => ({
            id: String(d.id),
            releaseId: String(d.release_id),
            storeId: String(d.store_id || ''),
            storeName: String(d.store_name || ''),
            deliveryStatus:
              (d.delivery_status as ReleaseItem['deliveries'][0]['deliveryStatus']) ||
              'Delivered',
            ddexBatchId: String(d.ddex_batch_id || ''),
            streams: Number(d.streams || 0),
            revenueUsd: Number(d.revenue_usd || 0),
            deliveredAt: String(d.delivered_at || new Date().toISOString()),
          }))
        : [],
    }));

    saveToStorage(LS_RELEASES, mappedReleases);
    return {
      releases: mappedReleases,
      transactions: localTransactions,
      payouts: localPayouts,
      profile: localProfile,
      source: 'supabase',
    };
  } catch {
    return {
      releases: localReleases,
      transactions: localTransactions,
      payouts: localPayouts,
      profile: localProfile,
      source: 'local',
    };
  }
}

export async function createNewRelease(newRelease: ReleaseItem): Promise<ReleaseItem[]> {
  const existing = loadFromStorage<ReleaseItem[]>(LS_RELEASES, INITIAL_RELEASES);
  const updated = [newRelease, ...existing];
  saveToStorage(LS_RELEASES, updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: insertedRel, error: relErr } = await client
        .from('releases')
        .insert({
          title: newRelease.title,
          primary_artist: newRelease.primaryArtist,
          featured_artists: newRelease.featuredArtists,
          release_type: newRelease.releaseType,
          primary_genre: newRelease.primaryGenre,
          subgenre: newRelease.subgenre,
          label_name: newRelease.labelName,
          upc_code: newRelease.upcCode,
          catalog_number: newRelease.catalogNumber,
          release_date: newRelease.releaseDate,
          original_release_date: newRelease.originalReleaseDate,
          p_line: newRelease.pLine,
          c_line: newRelease.cLine,
          cover_art_url: newRelease.coverArtUrl,
          status: newRelease.status,
          explicit: newRelease.explicit,
          stores_selected: newRelease.storesSelected,
          stores_delivered: newRelease.storesDelivered,
          total_streams: newRelease.totalStreams,
          total_royalties: newRelease.totalRoyalties,
          ddex_version: newRelease.ddexVersion,
        })
        .select('id')
        .single();

      if (!relErr && insertedRel?.id) {
        const dbRelId = insertedRel.id;
        if (newRelease.tracks.length > 0) {
          await client.from('tracks').insert(
            newRelease.tracks.map((t) => ({
              release_id: dbRelId,
              track_number: t.trackNumber,
              title: t.title,
              version: t.version,
              primary_artist: t.primaryArtist,
              featured_artists: t.featuredArtists,
              isrc_code: t.isrcCode,
              songwriter_legal_name: t.songwriterLegalName,
              explicit_lyrics: t.explicitLyrics,
              language: t.language,
              duration_seconds: t.durationSeconds,
              sample_rate: t.sampleRate,
              integrated_lufs: t.integratedLufs,
              true_peak_dbtp: t.truePeakDbtp,
              synth_preset: t.synthPreset,
              streams: t.streams,
            }))
          );
        }
        if (newRelease.splits.length > 0) {
          await client.from('royalty_splits').insert(
            newRelease.splits.map((s) => ({
              release_id: dbRelId,
              collaborator_name: s.collaboratorName,
              collaborator_email: s.collaboratorEmail,
              role: s.role,
              share_percentage: s.sharePercentage,
              status: s.status,
              payout_method: s.payoutMethod,
            }))
          );
        }
      }
    } catch {
      // Fallback already persisted locally
    }
  }

  return updated;
}

export async function updateReleaseStatus(
  releaseId: string,
  newStatus: DeliveryStatus
): Promise<ReleaseItem[]> {
  const existing = loadFromStorage<ReleaseItem[]>(LS_RELEASES, INITIAL_RELEASES);
  const updated = existing.map((rel) => {
    if (rel.id !== releaseId) return rel;
    const isDelivered = newStatus === 'Delivered';
    return {
      ...rel,
      status: newStatus,
      storesDelivered: isDelivered ? rel.storesSelected.length : rel.storesDelivered,
      deliveries: rel.deliveries.map((d) => ({
        ...d,
        deliveryStatus: isDelivered ? 'Delivered' : d.deliveryStatus,
      })),
    };
  });
  saveToStorage(LS_RELEASES, updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('releases').update({ status: newStatus }).eq('id', releaseId);
    } catch {
      // ignore
    }
  }
  return updated;
}

export async function deleteReleaseById(releaseId: string): Promise<ReleaseItem[]> {
  const existing = loadFromStorage<ReleaseItem[]>(LS_RELEASES, INITIAL_RELEASES);
  const updated = existing.filter((r) => r.id !== releaseId);
  saveToStorage(LS_RELEASES, updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('releases').delete().eq('id', releaseId);
    } catch {
      // ignore
    }
  }
  return updated;
}

export async function createPayoutRequest(
  amountUsd: number,
  payoutMethod: string,
  destinationAccount: string
): Promise<PayoutRequest[]> {
  const existing = loadFromStorage<PayoutRequest[]>(LS_PAYOUTS, INITIAL_PAYOUT_REQUESTS);
  const newItem: PayoutRequest = {
    id: `pay-${Date.now()}`,
    amountUsd,
    payoutMethod,
    destinationAccount,
    referenceCode: `TNK-STL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 899)}`,
    status: 'Completed',
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...existing];
  saveToStorage(LS_PAYOUTS, updated);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('payout_requests').insert({
        amount_usd: newItem.amountUsd,
        payout_method: newItem.payoutMethod,
        destination_account: newItem.destinationAccount,
        reference_code: newItem.referenceCode,
        status: newItem.status,
      });
    } catch {
      // ignore
    }
  }
  return updated;
}

export async function updateArtistProfile(profile: ArtistProfile): Promise<ArtistProfile> {
  saveToStorage(LS_PROFILE, profile);
  return profile;
}

export async function syncLocalCatalogToSupabase(): Promise<{
  ok: boolean;
  syncedCount: number;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      syncedCount: 0,
      message: 'Configure a live Supabase Project URL and Anon Key first to sync.',
    };
  }

  const localReleases = loadFromStorage<ReleaseItem[]>(LS_RELEASES, INITIAL_RELEASES);
  let synced = 0;

  try {
    for (const rel of localReleases) {
      const { error } = await client.from('releases').upsert(
        {
          title: rel.title,
          primary_artist: rel.primaryArtist,
          featured_artists: rel.featuredArtists,
          release_type: rel.releaseType,
          primary_genre: rel.primaryGenre,
          subgenre: rel.subgenre,
          label_name: rel.labelName,
          upc_code: rel.upcCode,
          catalog_number: rel.catalogNumber,
          release_date: rel.releaseDate,
          original_release_date: rel.originalReleaseDate,
          p_line: rel.pLine,
          c_line: rel.cLine,
          cover_art_url: rel.coverArtUrl,
          status: rel.status,
          explicit: rel.explicit,
          stores_selected: rel.storesSelected,
          stores_delivered: rel.storesDelivered,
          total_streams: rel.totalStreams,
          total_royalties: rel.totalRoyalties,
          ddex_version: rel.ddexVersion,
        },
        { onConflict: 'upc_code' }
      );
      if (!error) synced++;
    }

    if (synced === 0) {
      return {
        ok: false,
        syncedCount: 0,
        message:
          'Connected to Supabase, but tables were not found. Run supabase/migrations/001_tank_distribution_schema.sql in your Supabase SQL Editor first.',
      };
    }

    return {
      ok: true,
      syncedCount: synced,
      message: `Successfully synced ${synced} releases to live Supabase PostgreSQL database.`,
    };
  } catch (err) {
    return {
      ok: false,
      syncedCount: 0,
      message: err instanceof Error ? err.message : 'Sync failed.',
    };
  }
}
