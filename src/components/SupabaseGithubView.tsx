import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  CloudUpload,
  Code2,
  Copy,
  Database,
  Download,
  GitBranch,
  KeyRound,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import {
  getSavedSupabaseCredentials,
  saveSupabaseCredentials,
  signInWithGitHubOAuth,
  testSupabaseConnection,
} from '../lib/supabase';
import { syncLocalCatalogToSupabase } from '../services/distributionService';
import {
  ArtistProfile,
  ReleaseItem,
  SupabaseConfigState,
} from '../types/distribution';
import { DspApiWebhookPanel } from './DspApiWebhookPanel';

interface SupabaseGithubViewProps {
  supabaseState: SupabaseConfigState;
  onSupabaseStateChange: (next: SupabaseConfigState) => void;
  profile: ArtistProfile;
  onUpdateProfile: (profile: ArtistProfile) => void;
  onRefreshData: () => Promise<void>;
  releases: ReleaseItem[];
}

const SQL_SCHEMA_PREVIEW = `-- TANK DISTRIBUTION — SUPABASE POSTGRESQL SCHEMA (supabase/migrations/001_tank_distribution_schema.sql)
create extension if not exists "uuid-ossp";

create table if not exists public.releases (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  primary_artist text not null,
  featured_artists text default '',
  release_type text not null check (release_type in ('Single', 'EP', 'Album')),
  primary_genre text not null,
  subgenre text default 'Electronic / Alternative',
  label_name text not null default 'Tank Recordings',
  upc_code text not null unique,
  catalog_number text not null,
  release_date date not null,
  original_release_date date,
  p_line text not null,
  c_line text not null,
  cover_art_url text not null,
  status text not null check (status in ('Delivered', 'In Review', 'Processing', 'Draft')) default 'In Review',
  explicit boolean not null default false,
  stores_selected text[] not null default array['Spotify','Apple Music','TikTok','YouTube Music','Beatport'],
  stores_delivered integer not null default 0,
  total_streams bigint not null default 0,
  total_royalties numeric(12,2) not null default 0.00,
  ddex_version text not null default 'ERN-4.3',
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default uuid_generate_v4(),
  release_id uuid not null references public.releases(id) on delete cascade,
  track_number integer not null default 1,
  title text not null,
  version text not null default 'Original Mix',
  primary_artist text not null,
  featured_artists text default '',
  isrc_code text not null unique,
  songwriter_legal_name text not null,
  explicit_lyrics boolean not null default false,
  language text not null default 'English',
  duration_seconds integer not null default 214,
  sample_rate text not null default '24-bit / 48.0 kHz WAV',
  integrated_lufs numeric(4,1) not null default -14.0,
  true_peak_dbtp numeric(4,1) not null default -0.3,
  synth_preset text not null default 'cyber-bass',
  streams bigint not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.royalty_splits (
  id uuid primary key default uuid_generate_v4(),
  release_id uuid not null references public.releases(id) on delete cascade,
  collaborator_name text not null,
  collaborator_email text not null,
  role text not null,
  share_percentage numeric(5,2) not null check (share_percentage > 0 and share_percentage <= 100),
  status text not null default 'Verified',
  payout_method text not null default 'Stripe Connect'
);

create table if not exists public.dsp_integrations (
  id text primary key default 'global_dsp_config',
  gs1_upc_prefix text default '',
  isrc_country_code text default '',
  isrc_registrant_code text default '',
  ddex_party_id text default '',
  spotify_client_id text default '',
  spotify_client_secret text default '',
  spotify_connected boolean default false,
  youtube_api_key text default '',
  youtube_cms_partner_id text default '',
  youtube_connected boolean default false,
  tiktok_client_key text default '',
  tiktok_client_secret text default '',
  aggregator_provider text default 'revelator',
  delivery_webhook_url text default '',
  delivery_api_key text default '',
  webhook_signing_secret text default '',
  auto_dispatch_on_release boolean default true,
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('cover-art', 'cover-art', true), ('master-audio', 'master-audio', true)
on conflict (id) do nothing;`;

export const SupabaseGithubView: React.FC<SupabaseGithubViewProps> = ({
  supabaseState,
  onSupabaseStateChange,
  profile,
  onRefreshData,
  releases,
}) => {
  const initialCreds = getSavedSupabaseCredentials();
  const [urlInput, setUrlInput] = useState(initialCreds.url);
  const [keyInput, setKeyInput] = useState(initialCreds.anonKey);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveAndTestSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    saveSupabaseCredentials(urlInput, keyInput);
    const result = await testSupabaseConnection();
    onSupabaseStateChange(result);
    await onRefreshData();
    setIsTesting(false);
    setStatusBanner(
      result.mode === 'live-supabase'
        ? result.errorMessage ||
            'Connected live to Supabase PostgreSQL + Storage!'
        : 'Using Hybrid Local Persistence Engine (Ready for live Supabase credentials at any time).'
    );
  };

  const handleSyncCatalog = async () => {
    setIsSyncing(true);
    const res = await syncLocalCatalogToSupabase();
    setStatusBanner(res.message);
    setIsSyncing(false);
  };

  const handleGitHubOAuth = async () => {
    const res = await signInWithGitHubOAuth();
    setStatusBanner(res.message);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_PREVIEW);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SQL_SCHEMA_PREVIEW], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '001_tank_distribution_schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] text-[11px] font-mono-tech font-bold mb-2">
            <Database className="w-3.5 h-3.5" />
            SUPABASE POSTGRESQL + GITHUB REPOSITORY ARCHITECTURE
          </div>
          <h1 className="text-2xl font-extrabold text-[#F3F4F6]">
            SUPABASE & GITHUB CLOUD STUDIO
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Manage your live `@supabase/supabase-js` database connection, SQL
            migrations, Storage buckets, and GitHub CI/CD pipeline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGitHubOAuth}
            className="px-4 py-2.5 rounded-lg bg-[#1C202B] hover:bg-[#262C3C] border border-[#2E3548] text-xs font-semibold text-[#F3F4F6] flex items-center gap-2 cursor-pointer"
          >
            <GitBranch className="w-4 h-4 text-[#D4FF00]" />
            Authenticate GitHub OAuth
          </button>
          <button
            onClick={handleSyncCatalog}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <CloudUpload className="w-4 h-4" />
            {isSyncing ? 'Syncing to Supabase...' : 'Sync Catalog to Supabase'}
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-4 rounded-xl bg-[#181B24] border border-[#D4FF00]/40 text-xs font-mono-tech text-[#D4FF00] flex items-center justify-between">
          <span>{statusBanner}</span>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2-Column: Supabase Connection Config + GitHub Repo Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Supabase Connection Form */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-5">
          <div className="flex items-center justify-between border-b border-[#232836] pb-4">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-[#10B981]" />
              <div>
                <h2 className="text-base font-bold text-[#F3F4F6] uppercase">
                  Supabase Client Configuration (`@supabase/supabase-js`)
                </h2>
                <p className="text-xs text-[#9CA3AF]">
                  Connect any live Supabase project or run in zero-latency Hybrid
                  Local mode
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono-tech font-bold ${
                supabaseState.mode === 'live-supabase'
                  ? 'bg-[#10B981]/15 text-[#10B981]'
                  : 'bg-[#D4FF00]/15 text-[#D4FF00]'
              }`}
            >
              {supabaseState.mode === 'live-supabase'
                ? 'LIVE SUPABASE'
                : 'HYBRID ENGINE READY'}
            </span>
          </div>

          <form onSubmit={handleSaveAndTestSupabase} className="space-y-4">
            <div>
              <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                Supabase Project URL (`VITE_SUPABASE_URL`)
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                Supabase Anon Public Key (`VITE_SUPABASE_ANON_KEY`)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isTesting}
                className="px-5 py-2.5 rounded-lg bg-[#10B981] hover:bg-[#12d193] text-[#0A0B0E] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`}
                />
                {isTesting
                  ? 'Testing Connection...'
                  : 'Save & Test Supabase Connection'}
              </button>

              {urlInput && (
                <button
                  type="button"
                  onClick={async () => {
                    setUrlInput('');
                    setKeyInput('');
                    saveSupabaseCredentials('', '');
                    const st = await testSupabaseConnection();
                    onSupabaseStateChange(st);
                  }}
                  className="px-3.5 py-2.5 rounded-lg bg-[#1C202B] text-xs text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
                >
                  Reset to Hybrid Local Store
                </button>
              )}
            </div>
          </form>

          {/* Table Architecture Status Grid */}
          <div className="pt-4 border-t border-[#232836]">
            <div className="text-xs font-mono-tech uppercase text-[#9CA3AF] mb-3">
              PROVISIONED POSTGRESQL TABLES & STORAGE BUCKETS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { name: 'public.releases', desc: 'UPC & DDEX Catalog' },
                { name: 'public.tracks', desc: 'ISRC & LUFS Masters' },
                { name: 'public.royalty_splits', desc: '100% Share Routing' },
                { name: 'public.dsp_deliveries', desc: 'Store Ingestion Logs' },
                { name: 'public.royalty_transactions', desc: 'DSR Settlement Feed' },
                { name: 'storage.master-audio', desc: 'Lossless WAV/Art Bucket' },
              ].map((tbl) => (
                <div
                  key={tbl.name}
                  className="p-3 rounded-lg bg-[#0E1117] border border-[#1E2330]"
                >
                  <div className="flex items-center gap-1.5 text-xs font-mono-tech font-bold text-[#10B981]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tbl.name}</span>
                  </div>
                  <div className="text-[11px] text-[#6B7280] mt-0.5">
                    {tbl.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 cols: GitHub Repository & CI/CD Status */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#232836] pb-4">
              <div className="flex items-center gap-2.5">
                <GitBranch className="w-5 h-5 text-[#F3F4F6]" />
                <div>
                  <h2 className="text-base font-bold text-[#F3F4F6] uppercase">
                    GitHub Repository & CI/CD
                  </h2>
                  <p className="text-xs text-[#9CA3AF]">
                    Version control, automated build checks & GitHub OAuth identity
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold bg-[#10B981]/15 text-[#10B981]">
                CONNECTED
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0E1117] border border-[#232836] space-y-3 font-mono-tech text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">REPOSITORY:</span>
                <span className="text-[#F3F4F6] font-bold">
                  kampalanalf-sudo/iuea
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">ACTIVE BRANCH:</span>
                <span className="text-[#D4FF00] flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5" />
                  arena/b41594a2-iuea
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">GITHUB HANDLE:</span>
                <span className="text-[#10B981]">@{profile.githubHandle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">CI WORKFLOW:</span>
                <span className="text-[#F3F4F6]">
                  .github/workflows/ci-deploy.yml
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">NETLIFY CONFIG:</span>
                <span className="text-[#10B981] font-bold">
                  netlify.toml (dist • Node 22)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B7280]">SUPABASE MIGRATION:</span>
                <span className="text-[#F3F4F6]">
                  001_tank_distribution_schema.sql
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#181B24] border border-[#232836] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F3F4F6]">
                <Terminal className="w-4 h-4 text-[#D4FF00]" />
                Quick CLI Commands
              </div>
              <pre className="text-[11px] font-mono-tech text-[#9CA3AF] overflow-x-auto leading-relaxed">
{`# Apply Supabase SQL Schema
supabase db push

# Run Tank Distribution Locally
npm install && npm run dev

# Push Updates to GitHub Branch
git push origin arena/b41594a2-iuea`}
              </pre>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0E1117] border border-[#232836] flex items-center gap-2.5 text-xs text-[#10B981]">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              Row Level Security (RLS) policies enabled across all 7 distribution
              tables.
            </span>
          </div>
        </div>
      </div>

      {/* Full SQL Migration Viewer */}
      <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#D4FF00]" />
            <h2 className="text-base font-bold text-[#F3F4F6] uppercase">
              Supabase SQL Migration (`supabase/migrations/001_tank_distribution_schema.sql`)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-3.5 py-1.5 rounded-lg bg-[#1C202B] hover:bg-[#252B3B] text-xs font-mono-tech text-[#F3F4F6] flex items-center gap-1.5 cursor-pointer"
            >
              {copiedSql ? (
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedSql ? 'Copied SQL Schema' : 'Copy SQL Schema'}
            </button>
            <button
              onClick={handleDownloadSql}
              className="px-3.5 py-1.5 rounded-lg bg-[#D4FF00] text-[#0A0B0E] text-xs font-mono-tech font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .SQL
            </button>
          </div>
        </div>

        <pre className="p-4 rounded-xl bg-[#0A0B0E] border border-[#232836] text-xs font-mono-tech text-[#10B981] overflow-x-auto max-h-[340px]">
          {SQL_SCHEMA_PREVIEW}
        </pre>
      </div>

      {/* DSP API & Distribution Webhook Integration Panel */}
      <DspApiWebhookPanel releases={releases} />
    </div>
  );
};
