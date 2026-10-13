export type ReleaseFormat = 'Single' | 'EP' | 'Album';
export type DeliveryStatus = 'Delivered' | 'In Review' | 'Processing' | 'Draft';

export type ProfileCategory =
  | 'tank_admin'
  | 'artiste'
  | 'music_manager'
  | 'label_exec'
  | 'producer_collab';

export interface UserProfileAccount {
  id: string;
  name: string;
  displayRole: string;
  category: ProfileCategory;
  email: string;
  avatarBadge: string;
  accentColor: string;
  organization: string;
  location: string;
  associatedArtists: string[];
  commissionOrShareNote: string;
  bio: string;
  permissions: string[];
  canSeeTechDetails: boolean; // Strictly true ONLY for 'tank_admin'
  lastLoginAt?: string;
}

export interface ProfileManualSection {
  stepNumber: string;
  title: string;
  navigationPath: string;
  summary: string;
  actionItems: string[];
  proTip: string;
}

export interface ProfileNavigationManual {
  category: ProfileCategory;
  roleTitle: string;
  subtitle: string;
  pdfFileName: string;
  targetAudience: string;
  accessScopeSummary: string;
  keyCapabilities: string[];
  sections: ProfileManualSection[];
  faq: { q: string; a: string }[];
}

export interface TrackItem {
  id: string;
  releaseId: string;
  trackNumber: number;
  title: string;
  version: string;
  primaryArtist: string;
  featuredArtists: string;
  isrcCode: string;
  songwriterLegalName: string;
  explicitLyrics: boolean;
  language: string;
  durationSeconds: number;
  sampleRate: string;
  integratedLufs: number;
  truePeakDbtp: number;
  audioUrl?: string;
  synthPreset: 'cyber-bass' | 'afro-pulse' | 'berlin-techno' | 'neon-drift' | 'sub-heavy' | 'analog-horizon';
  streams: number;
}

export interface RoyaltySplitItem {
  id: string;
  releaseId: string;
  collaboratorName: string;
  collaboratorEmail: string;
  role: 'Primary Artist' | 'Producer' | 'Featured Artist' | 'Mixing / Mastering' | 'Label Share' | 'Songwriter';
  sharePercentage: number;
  status: 'Verified' | 'Pending';
  payoutMethod: 'Stripe Connect' | 'Wise Multi-Currency' | 'Bank Wire (SWIFT)' | 'USDC Vault';
}

export interface DspDeliveryItem {
  id: string;
  releaseId: string;
  storeId: string;
  storeName: string;
  deliveryStatus: 'Delivered' | 'In Review' | 'Processing' | 'Queued';
  ddexBatchId: string;
  streams: number;
  revenueUsd: number;
  deliveredAt: string;
}

export interface ReleaseItem {
  id: string;
  title: string;
  primaryArtist: string;
  featuredArtists: string;
  releaseType: ReleaseFormat;
  primaryGenre: string;
  subgenre: string;
  labelName: string;
  upcCode: string;
  catalogNumber: string;
  releaseDate: string;
  originalReleaseDate: string;
  pLine: string;
  cLine: string;
  coverArtUrl: string;
  status: DeliveryStatus;
  explicit: boolean;
  storesSelected: string[];
  storesDelivered: number;
  totalStreams: number;
  totalRoyalties: number;
  ddexVersion: string;
  createdAt: string;
  tracks: TrackItem[];
  splits: RoyaltySplitItem[];
  deliveries: DspDeliveryItem[];
}

export interface RoyaltyTransaction {
  id: string;
  releaseId: string;
  releaseTitle: string;
  upcCode: string;
  storeName: string;
  territory: string;
  reportingPeriod: string;
  streams: number;
  grossRevenue: number;
  netPayout: number;
  status: 'Cleared' | 'Pending Settlement';
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  amountUsd: number;
  payoutMethod: string;
  destinationAccount: string;
  referenceCode: string;
  status: 'Completed' | 'Processing' | 'Scheduled';
  createdAt: string;
}

export interface ArtistProfile {
  id: string;
  artistName: string;
  legalName: string;
  labelName: string;
  email: string;
  githubHandle: string;
  ipiNumber: string;
  proAffiliation: string;
  country: string;
  planTier: string;
  verified: boolean;
}

export interface DspStoreConfig {
  id: string;
  name: string;
  category: 'Major Streaming' | 'Social & Short Video' | 'DJ & Electronic' | 'Regional & Hi-Res';
  avgRatePerStream: number;
  deliverySla: string;
  color: string;
  badge: string;
  contentIdSupported: boolean;
}

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  mode: 'live-supabase' | 'hybrid-local';
  lastSyncedAt: string | null;
  connectedTables: number;
  errorMessage: string | null;
}
