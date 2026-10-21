import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Code2,
  Globe2,
  KeyRound,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sliders,
  Webhook,
} from 'lucide-react';
import {
  AggregatorProvider,
  dispatchReleaseToWebhook,
  DspIntegrationConfig,
  loadDspIntegrationConfig,
  loadWebhookLogs,
  saveDspIntegrationConfig,
  verifySpotifyApiCredentials,
  verifyYouTubeApiCredentials,
  WebhookDispatchLog,
} from '../services/dspIntegrationService';
import { ReleaseItem } from '../types/distribution';
import { generateIsrcCode, generateUpcCode } from '../utils/artworkGenerator';

interface DspApiWebhookPanelProps {
  releases: ReleaseItem[];
  onConfigSaved?: (config: DspIntegrationConfig) => void;
}

export const DspApiWebhookPanel: React.FC<DspApiWebhookPanelProps> = ({
  releases,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<DspIntegrationConfig>(() =>
    loadDspIntegrationConfig()
  );
  const [webhookLogs, setWebhookLogs] = useState<WebhookDispatchLog[]>(() =>
    loadWebhookLogs()
  );
  const [statusBanner, setStatusBanner] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [testingSpotify, setTestingSpotify] = useState(false);
  const [testingYouTube, setTestingYouTube] = useState(false);
  const [dispatchingWebhook, setDispatchingWebhook] = useState(false);
  const [showSamplePayload, setShowSamplePayload] = useState(false);

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const saved = await saveDspIntegrationConfig(config);
    setConfig(saved);
    if (onConfigSaved) onConfigSaved(saved);
    setStatusBanner({
      ok: true,
      text: 'Saved DSP API keys, official GS1/ISRC prefixes, and delivery webhook configuration.',
    });
  };

  const handleTestSpotify = async () => {
    setTestingSpotify(true);
    const res = await verifySpotifyApiCredentials(
      config.spotifyClientId,
      config.spotifyClientSecret
    );
    const updated: DspIntegrationConfig = {
      ...config,
      spotifyConnected: res.ok,
      spotifyLastChecked: new Date().toISOString(),
    };
    await saveDspIntegrationConfig(updated);
    setConfig(updated);
    setTestingSpotify(false);
    setStatusBanner({ ok: res.ok, text: res.message });
  };

  const handleTestYouTube = async () => {
    setTestingYouTube(true);
    const res = await verifyYouTubeApiCredentials(config.youtubeApiKey);
    const updated: DspIntegrationConfig = {
      ...config,
      youtubeConnected: res.ok,
      youtubeLastChecked: new Date().toISOString(),
    };
    await saveDspIntegrationConfig(updated);
    setConfig(updated);
    setTestingYouTube(false);
    setStatusBanner({ ok: res.ok, text: res.message });
  };

  const handleTestWebhookDispatch = async () => {
    setDispatchingWebhook(true);
    await saveDspIntegrationConfig(config);

    const targetRelease: ReleaseItem =
      releases[0] || {
        id: 'rel-webhook-verify',
        title: 'WEBHOOK VERIFICATION MASTER',
        primaryArtist: 'TANK DISTRIBUTION',
        featuredArtists: '',
        releaseType: 'Single',
        primaryGenre: 'Electronic',
        subgenre: '',
        labelName: 'Tank Distribution',
        upcCode: generateUpcCode(),
        catalogNumber: 'TNK-VERIFY-001',
        releaseDate: new Date().toISOString().slice(0, 10),
        originalReleaseDate: new Date().toISOString().slice(0, 10),
        pLine: `${new Date().getFullYear()} Tank Distribution`,
        cLine: `${new Date().getFullYear()} Tank Distribution`,
        coverArtUrl: '',
        status: 'Delivered',
        explicit: false,
        storesSelected: [
          'Spotify',
          'Apple Music & iTunes',
          'TikTok & CapCut Sound Library',
          'YouTube Music + Content ID',
        ],
        storesDelivered: 4,
        totalStreams: 0,
        totalRoyalties: 0,
        ddexVersion: 'ERN-4.3',
        createdAt: new Date().toISOString(),
        tracks: [
          {
            id: 'trk-verify-1',
            releaseId: 'rel-webhook-verify',
            trackNumber: 1,
            title: 'Verification Master Track',
            version: 'Original Mix',
            primaryArtist: 'TANK DISTRIBUTION',
            featuredArtists: '',
            isrcCode: generateIsrcCode(1),
            songwriterLegalName: 'Tank Operations',
            explicitLyrics: false,
            language: 'English',
            durationSeconds: 180,
            sampleRate: '24-bit / 48.0 kHz WAV',
            integratedLufs: -14.0,
            truePeakDbtp: -0.2,
            synthPreset: 'cyber-bass',
            streams: 0,
          },
        ],
        splits: [
          {
            id: 'spl-verify-1',
            releaseId: 'rel-webhook-verify',
            collaboratorName: 'Primary Rights Holder',
            collaboratorEmail: 'admin@tankdistribution.io',
            role: 'Primary Artist',
            sharePercentage: 100,
            status: 'Verified',
            payoutMethod: 'Stripe Connect',
          },
        ],
        deliveries: [],
      };

    const { log, allLogs } = await dispatchReleaseToWebhook(
      targetRelease,
      config
    );
    setWebhookLogs(allLogs);
    setDispatchingWebhook(false);
    setStatusBanner({
      ok: log.success,
      text: log.responseMessage,
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#D4FF00]/15 text-[#D4FF00] text-[11px] font-mono-tech font-bold mb-2">
            <Webhook className="w-3.5 h-3.5" />
            TANK ADMIN EXCLUSIVE • DSP API KEYS, GS1/ISRC PREFIXES & WEBHOOK RELAY
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F3F4F6]">
            DSP API & DISTRIBUTION WEBHOOK INTEGRATION PANEL
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Connect Spotify Web API, YouTube Data API v3, TikTok SoundOn, official
            GS1/IFPI registry prefixes, and your B2B distribution delivery webhook
            (Revelator, LabelGrid, SonoSuite, or custom DDEX SFTP relay).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => handleSaveAll()}
            className="px-4 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,255,0,0.2)]"
          >
            <Save className="w-4 h-4" />
            Save Integration Settings
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono-tech flex items-center justify-between ${
            statusBanner.ok
              ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
              : 'bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#F59E0B]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusBanner.text}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Row 1: Spotify Web API + YouTube Data API v3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Spotify Web API */}
        <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#232836] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1DB954] text-[#0A0B0E] font-mono-tech font-extrabold text-xs flex items-center justify-center">
                  SP
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F3F4F6] uppercase">
                    Spotify Web API Integration
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF]">
                    OAuth2 Client Credentials for ISRC lookup & artist verification
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold ${
                  config.spotifyConnected
                    ? 'bg-[#10B981]/15 text-[#10B981]'
                    : 'bg-[#232836] text-[#9CA3AF]'
                }`}
              >
                {config.spotifyConnected ? 'AUTHENTICATED' : 'NOT CONNECTED'}
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Spotify Client ID
                </label>
                <input
                  type="text"
                  value={config.spotifyClientId}
                  onChange={(e) =>
                    setConfig({ ...config, spotifyClientId: e.target.value })
                  }
                  className="w-full h-10 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Spotify Client Secret
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={config.spotifyClientSecret}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        spotifyClientSecret: e.target.value,
                      })
                    }
                    className="w-full h-10 pl-9 pr-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#232836] flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono-tech text-[#6B7280]">
              Endpoint: accounts.spotify.com/api/token
            </span>
            <button
              type="button"
              onClick={handleTestSpotify}
              disabled={testingSpotify}
              className="px-3.5 py-2 rounded-lg bg-[#1DB954] hover:bg-[#22d35e] text-[#0A0B0E] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${testingSpotify ? 'animate-spin' : ''}`}
              />
              {testingSpotify ? 'Verifying...' : 'Verify Spotify API'}
            </button>
          </div>
        </div>

        {/* Card 2: YouTube Data API v3 & Content ID */}
        <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#232836] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FF0033] text-[#F3F4F6] font-mono-tech font-extrabold text-xs flex items-center justify-center">
                  YT
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F3F4F6] uppercase">
                    YouTube Data API v3 & Content ID CMS
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF]">
                    Channel telemetry, video claim tracking & CMS Partner linkage
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold ${
                  config.youtubeConnected
                    ? 'bg-[#10B981]/15 text-[#10B981]'
                    : 'bg-[#232836] text-[#9CA3AF]'
                }`}
              >
                {config.youtubeConnected ? 'VERIFIED' : 'NOT CONNECTED'}
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  YouTube Data API v3 Key
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={config.youtubeApiKey}
                    onChange={(e) =>
                      setConfig({ ...config, youtubeApiKey: e.target.value })
                    }
                    className="w-full h-10 pl-9 pr-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  YouTube Content ID CMS Partner ID
                </label>
                <input
                  type="text"
                  value={config.youtubeCmsPartnerId}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      youtubeCmsPartnerId: e.target.value,
                    })
                  }
                  className="w-full h-10 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#232836] flex items-center justify-between gap-3">
            <span className="text-[11px] font-mono-tech text-[#6B7280]">
              Endpoint: googleapis.com/youtube/v3
            </span>
            <button
              type="button"
              onClick={handleTestYouTube}
              disabled={testingYouTube}
              className="px-3.5 py-2 rounded-lg bg-[#FF0033] hover:bg-[#ff244f] text-[#F3F4F6] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${testingYouTube ? 'animate-spin' : ''}`}
              />
              {testingYouTube ? 'Checking...' : 'Verify YouTube API'}
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Distribution Delivery Webhook + Official GS1/ISRC Prefixes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: B2B Distribution Delivery Webhook */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-5">
          <div className="flex items-center justify-between border-b border-[#232836] pb-3.5">
            <div className="flex items-center gap-2.5">
              <Globe2 className="w-5 h-5 text-[#D4FF00]" />
              <div>
                <h3 className="text-sm font-bold text-[#F3F4F6] uppercase">
                  Distribution Delivery Webhook & Aggregator Relay
                </h3>
                <p className="text-[11px] text-[#9CA3AF]">
                  Automatically dispatches DDEX ERN 4.3 XML + JSON master payloads
                  when a release is deployed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowSamplePayload(!showSamplePayload)}
              className="px-2.5 py-1 rounded bg-[#1C202B] text-[11px] font-mono-tech text-[#D4FF00] flex items-center gap-1 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              {showSamplePayload ? 'Hide Payload Spec' : 'Inspect Payload Spec'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                Aggregator / Relay Provider
              </label>
              <select
                value={config.aggregatorProvider}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    aggregatorProvider: e.target.value as AggregatorProvider,
                  })
                }
                className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs font-bold text-[#D4FF00] outline-none"
              >
                <option value="revelator">
                  Revelator Distribution REST API
                </option>
                <option value="labelgrid">
                  LabelGrid Distribution API
                </option>
                <option value="sonosuite">
                  SonoSuite White-Label API
                </option>
                <option value="custom_webhook">
                  Custom DDEX ERN 4.3 Webhook / SFTP Relay
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                Delivery Webhook / API Endpoint URL
              </label>
              <input
                type="url"
                value={config.deliveryWebhookUrl}
                onChange={(e) =>
                  setConfig({ ...config, deliveryWebhookUrl: e.target.value })
                }
                className="w-full h-10 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                Aggregator Bearer Token / API Key
              </label>
              <input
                type="text"
                value={config.deliveryApiKey}
                onChange={(e) =>
                  setConfig({ ...config, deliveryApiKey: e.target.value })
                }
                className="w-full h-10 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                Webhook Signing Secret (X-Tank-Webhook-Secret)
              </label>
              <input
                type="text"
                value={config.webhookSigningSecret}
                onChange={(e) =>
                  setConfig({ ...config, webhookSigningSecret: e.target.value })
                }
                className="w-full h-10 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] font-mono-tech text-xs text-[#F3F4F6] outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#0E1117] border border-[#232836] flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-[#F3F4F6]">
              <input
                type="checkbox"
                checked={config.autoDispatchOnRelease}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    autoDispatchOnRelease: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[#D4FF00] rounded"
              />
              <span>
                Automatically POST DDEX ERN 4.3 + JSON payload to this webhook
                whenever a release is deployed
              </span>
            </label>

            <button
              type="button"
              onClick={handleTestWebhookDispatch}
              disabled={dispatchingWebhook}
              className="px-4 py-2 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {dispatchingWebhook
                ? 'Dispatching...'
                : 'Send Test DDEX Webhook'}
            </button>
          </div>

          {showSamplePayload && (
            <pre className="p-4 rounded-lg bg-[#0A0B0E] border border-[#232836] text-[11px] font-mono-tech text-[#10B981] overflow-x-auto max-h-56">
{`POST ${config.deliveryWebhookUrl || 'https://your-webhook-relay.io/v1/ddex/ingest'}
Headers:
  Content-Type: application/json
  X-Tank-Provider: ${config.aggregatorProvider}
  Authorization: Bearer <DELIVERY_API_KEY>

Body:
{
  "event": "release.distribute.ddex",
  "provider": "${config.aggregatorProvider}",
  "ddexPartyId": "${config.ddexPartyId || 'PADPIDA2026TANK01'}",
  "release": { "upcCode": "...", "tracks": [...], "royaltySplits": [...] },
  "ddexErn43Xml": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?><ern:NewReleaseMessage ...>"
}`}
            </pre>
          )}
        </div>

        {/* Right 5 cols: Official GS1 UPC, IFPI ISRC & TikTok SoundOn Config */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#232836] pb-3.5">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-[#10B981]" />
                <div>
                  <h3 className="text-sm font-bold text-[#F3F4F6] uppercase">
                    Official GS1 UPC, IFPI ISRC & TikTok Keys
                  </h3>
                  <p className="text-[11px] text-[#9CA3AF]">
                    Bind your legal barcode & ISRC registrant prefixes
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  GS1 Company Prefix (UPC)
                </label>
                <input
                  type="text"
                  value={config.gs1UpcPrefix}
                  onChange={(e) =>
                    setConfig({ ...config, gs1UpcPrefix: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#D4FF00] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  DDEX Party ID (DPID)
                </label>
                <input
                  type="text"
                  value={config.ddexPartyId}
                  onChange={(e) =>
                    setConfig({ ...config, ddexPartyId: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  ISRC Country Code (2-Char)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={config.isrcCountryCode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      isrcCountryCode: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#D4FF00] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  ISRC Registrant Code (3-Char)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={config.isrcRegistrantCode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      isrcRegistrantCode: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#D4FF00] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  TikTok / SoundOn Client Key
                </label>
                <input
                  type="text"
                  value={config.tiktokClientKey}
                  onChange={(e) =>
                    setConfig({ ...config, tiktokClientKey: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  TikTok Client Secret
                </label>
                <input
                  type="text"
                  value={config.tiktokClientSecret}
                  onChange={(e) =>
                    setConfig({ ...config, tiktokClientSecret: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0E1117] border border-[#232836] flex items-center justify-between text-[11px] font-mono-tech">
            <span className="text-[#9CA3AF] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              Next Generated ISRC Preview:
            </span>
            <span className="text-[#D4FF00] font-bold">
              {config.isrcCountryCode.length === 2
                ? config.isrcCountryCode
                : 'US'}
              -
              {config.isrcRegistrantCode.length === 3
                ? config.isrcRegistrantCode
                : 'TNK'}
              -26-00001
            </span>
          </div>
        </div>
      </div>

      {/* Live Webhook Delivery Log Table */}
      <div className="rounded-xl bg-[#141720] border border-[#232836] overflow-hidden">
        <div className="p-4 bg-[#10131B] border-b border-[#232836] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#D4FF00]" />
            <h3 className="text-xs font-mono-tech font-bold uppercase text-[#F3F4F6]">
              Outbound DDEX Webhook Delivery Log ({webhookLogs.length})
            </h3>
          </div>
          <span className="text-[11px] font-mono-tech text-[#9CA3AF]">
            Provider: {config.aggregatorProvider.toUpperCase()}
          </span>
        </div>

        {webhookLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#9CA3AF]">
            No outbound webhook dispatches recorded yet. Click &quot;Send Test
            DDEX Webhook&quot; or deploy a new release to log deliveries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232836] text-[10px] font-mono-tech uppercase text-[#6B7280]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Provider</th>
                  <th className="py-2.5 px-4">Release / UPC</th>
                  <th className="py-2.5 px-4">Endpoint</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2330] text-xs font-mono-tech">
                {webhookLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#191D28]">
                    <td className="py-2.5 px-4 text-[#9CA3AF]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 text-[#D4FF00] uppercase">
                      {log.provider}
                    </td>
                    <td className="py-2.5 px-4 text-[#F3F4F6]">
                      {log.releaseTitle} ({log.upcCode})
                    </td>
                    <td className="py-2.5 px-4 text-[#9CA3AF] truncate max-w-[200px]">
                      {log.endpointUrl}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.success
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {log.httpStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#9CA3AF]">
                      {log.responseMessage}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
