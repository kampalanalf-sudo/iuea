import { ReleaseItem } from '../types/distribution';

export interface ArtworkTheme {
  id: string;
  name: string;
  bgStart: string;
  bgEnd: string;
  accentPrimary: string;
  accentSecondary: string;
  gridColor: string;
  patternType: 'waveform' | 'radar' | 'monolith' | 'grid-matrix' | 'prism' | 'turbine';
}

export const ARTWORK_THEMES: ArtworkTheme[] = [
  {
    id: 'volt-matrix',
    name: 'TANK VOLT MATRIX',
    bgStart: '#08090C',
    bgEnd: '#141923',
    accentPrimary: '#D4FF00',
    accentSecondary: '#10B981',
    gridColor: '#232836',
    patternType: 'waveform',
  },
  {
    id: 'berlin-sub',
    name: 'BERLIN SUB-BASS',
    bgStart: '#0D090A',
    bgEnd: '#1C1116',
    accentPrimary: '#FF6B2C',
    accentSecondary: '#F59E0B',
    gridColor: '#2F1D22',
    patternType: 'radar',
  },
  {
    id: 'afro-cyber',
    name: 'KAMPALA NEON PULSE',
    bgStart: '#070D12',
    bgEnd: '#0E1F2A',
    accentPrimary: '#00F5D4',
    accentSecondary: '#D4FF00',
    gridColor: '#193242',
    patternType: 'prism',
  },
  {
    id: 'chrome-horizon',
    name: 'CHROME MASTERING LAB',
    bgStart: '#0A0B10',
    bgEnd: '#1B1F2E',
    accentPrimary: '#38BDF8',
    accentSecondary: '#818CF8',
    gridColor: '#262C40',
    patternType: 'grid-matrix',
  },
  {
    id: 'solar-overdrive',
    name: 'ANALOG OVERDRIVE',
    bgStart: '#100C06',
    bgEnd: '#241909',
    accentPrimary: '#FACC15',
    accentSecondary: '#FF6B2C',
    gridColor: '#332612',
    patternType: 'turbine',
  },
  {
    id: 'monolith-noir',
    name: 'OBSIDIAN MONOLITH',
    bgStart: '#060608',
    bgEnd: '#15161E',
    accentPrimary: '#E2E8F0',
    accentSecondary: '#D4FF00',
    gridColor: '#252736',
    patternType: 'monolith',
  },
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateCoverArtDataUri(options: {
  title: string;
  artist: string;
  catalogNumber?: string;
  themeId?: string;
  explicit?: boolean;
}): string {
  const theme =
    ARTWORK_THEMES.find((t) => t.id === options.themeId) || ARTWORK_THEMES[0];
  const cleanTitle = escapeXml((options.title || 'UNTITLED MASTER').toUpperCase().slice(0, 28));
  const cleanArtist = escapeXml((options.artist || 'TANK ARTIST').toUpperCase().slice(0, 32));
  const cleanCat = escapeXml((options.catalogNumber || 'TNK-2026-001').toUpperCase());

  let centerGraphic = '';
  if (theme.patternType === 'waveform') {
    centerGraphic = `
      <g opacity="0.88">
        <circle cx="300" cy="290" r="145" fill="none" stroke="${theme.accentPrimary}" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.45" />
        <circle cx="300" cy="290" r="105" fill="none" stroke="${theme.accentSecondary}" stroke-width="1" opacity="0.35" />
        <path d="M 90 290 L 145 290 L 165 210 L 185 370 L 205 160 L 225 410 L 245 190 L 265 360 L 285 120 L 305 440 L 325 150 L 345 390 L 365 200 L 385 350 L 405 230 L 425 320 L 450 290 L 510 290"
          fill="none" stroke="${theme.accentPrimary}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
        <path d="M 90 290 L 510 290" stroke="${theme.accentSecondary}" stroke-width="1" opacity="0.5" />
      </g>
    `;
  } else if (theme.patternType === 'radar') {
    centerGraphic = `
      <g opacity="0.9">
        <circle cx="300" cy="290" r="155" fill="none" stroke="${theme.accentPrimary}" stroke-width="2" opacity="0.3" />
        <circle cx="300" cy="290" r="115" fill="none" stroke="${theme.accentPrimary}" stroke-width="2.5" opacity="0.55" />
        <circle cx="300" cy="290" r="75" fill="none" stroke="${theme.accentSecondary}" stroke-width="2" opacity="0.75" />
        <circle cx="300" cy="290" r="32" fill="${theme.accentPrimary}" opacity="0.85" />
        <line x1="120" y1="290" x2="480" y2="290" stroke="${theme.accentPrimary}" stroke-width="1.2" opacity="0.4" />
        <line x1="300" y1="110" x2="300" y2="470" stroke="${theme.accentPrimary}" stroke-width="1.2" opacity="0.4" />
        <polygon points="300,135 440,365 160,365" fill="none" stroke="${theme.accentSecondary}" stroke-width="2" opacity="0.65" />
      </g>
    `;
  } else if (theme.patternType === 'prism') {
    centerGraphic = `
      <g opacity="0.9">
        <polygon points="300,130 460,390 140,390" fill="none" stroke="${theme.accentPrimary}" stroke-width="3.5" />
        <polygon points="300,165 425,370 175,370" fill="none" stroke="${theme.accentSecondary}" stroke-width="1.8" opacity="0.7" />
        <polygon points="300,430 460,170 140,170" fill="none" stroke="${theme.accentSecondary}" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.45" />
        <circle cx="300" cy="290" r="46" fill="${theme.accentPrimary}" opacity="0.2" />
        <circle cx="300" cy="290" r="16" fill="${theme.accentPrimary}" />
      </g>
    `;
  } else if (theme.patternType === 'grid-matrix') {
    centerGraphic = `
      <g opacity="0.9">
        <rect x="155" y="145" width="290" height="290" fill="none" stroke="${theme.accentPrimary}" stroke-width="2.5" />
        <rect x="190" y="180" width="220" height="220" fill="none" stroke="${theme.accentSecondary}" stroke-width="1.5" stroke-dasharray="10 5" />
        <rect x="230" y="220" width="140" height="140" fill="${theme.accentPrimary}" opacity="0.14" stroke="${theme.accentPrimary}" stroke-width="2" />
        <line x1="155" y1="145" x2="445" y2="435" stroke="${theme.accentPrimary}" stroke-width="1.5" opacity="0.5" />
        <line x1="445" y1="145" x2="155" y2="435" stroke="${theme.accentSecondary}" stroke-width="1.5" opacity="0.5" />
      </g>
    `;
  } else if (theme.patternType === 'turbine') {
    centerGraphic = `
      <g opacity="0.9">
        <circle cx="300" cy="290" r="150" fill="none" stroke="${theme.accentPrimary}" stroke-width="3" stroke-dasharray="22 12" />
        <circle cx="300" cy="290" r="110" fill="none" stroke="${theme.accentSecondary}" stroke-width="2" />
        <path d="M210,200 L390,380 M390,200 L210,380" stroke="${theme.accentPrimary}" stroke-width="3" />
        <rect x="260" y="250" width="80" height="80" transform="rotate(45 300 290)" fill="${theme.bgStart}" stroke="${theme.accentPrimary}" stroke-width="3" />
      </g>
    `;
  } else {
    centerGraphic = `
      <g opacity="0.92">
        <rect x="215" y="135" width="170" height="310" fill="${theme.bgStart}" stroke="${theme.accentPrimary}" stroke-width="3" />
        <rect x="235" y="155" width="130" height="270" fill="none" stroke="${theme.accentSecondary}" stroke-width="1.2" opacity="0.7" />
        <line x1="140" y1="290" x2="460" y2="290" stroke="${theme.accentSecondary}" stroke-width="2.5" />
        <circle cx="300" cy="290" r="38" fill="${theme.accentPrimary}" />
      </g>
    `;
  }

  const explicitBadge = options.explicit
    ? `<g transform="translate(455, 518)">
        <rect x="0" y="0" width="105" height="38" rx="3" fill="#F3F4F6" />
        <text x="52.5" y="14" text-anchor="middle" fill="#0A0B0E" font-family=" monospace" font-size="8.5" font-weight="700" letter-spacing="1.2">PARENTAL</text>
        <text x="52.5" y="25" text-anchor="middle" fill="#0A0B0E" font-family=" monospace" font-size="9.5" font-weight="800" letter-spacing="1.5">ADVISORY</text>
        <text x="52.5" y="34" text-anchor="middle" fill="#0A0B0E" font-family=" monospace" font-size="7.5" font-weight="700" letter-spacing="0.8">EXPLICIT CONTENT</text>
      </g>`
    : `<g transform="translate(465, 522)">
        <rect x="0" y="0" width="95" height="32" rx="3" fill="none" stroke="${theme.accentPrimary}" stroke-width="1.5" opacity="0.7" />
        <text x="47.5" y="14" text-anchor="middle" fill="${theme.accentPrimary}" font-family="monospace" font-size="8.5" font-weight="700" letter-spacing="1.2">DDEX ERN 4.3</text>
        <text x="47.5" y="25" text-anchor="middle" fill="#F3F4F6" font-family="monospace" font-size="8" font-weight="600" letter-spacing="1">24-BIT MASTER</text>
      </g>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${theme.bgStart}" />
        <stop offset="100%" stop-color="${theme.bgEnd}" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${theme.gridColor}" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="600" height="600" fill="url(#bgGrad)" />
    <rect width="600" height="600" fill="url(#grid)" opacity="0.65" />
    <rect x="24" y="24" width="552" height="552" fill="none" stroke="${theme.accentPrimary}" stroke-width="1.5" opacity="0.35" />

    <!-- Top Technical Header -->
    <text x="44" y="56" fill="${theme.accentPrimary}" font-family="monospace" font-size="12" font-weight="700" letter-spacing="2.5">TANK DISTRIBUTION // MASTER</text>
    <text x="556" y="56" text-anchor="end" fill="#9CA3AF" font-family="monospace" font-size="12" font-weight="600" letter-spacing="1.5">${cleanCat}</text>
    <line x1="44" y1="70" x2="556" y2="70" stroke="${theme.gridColor}" stroke-width="1.5" />

    <!-- Center Visualizer Art -->
    ${centerGraphic}

    <!-- Bottom Metadata Block -->
    <line x1="44" y1="478" x2="556" y2="478" stroke="${theme.gridColor}" stroke-width="1.5" />
    <text x="44" y="514" fill="#F3F4F6" font-family="sans-serif" font-size="26" font-weight="800" letter-spacing="1">${cleanTitle}</text>
    <text x="44" y="542" fill="${theme.accentPrimary}" font-family="monospace" font-size="14" font-weight="700" letter-spacing="2">${cleanArtist}</text>
    <text x="44" y="560" fill="#6B7280" font-family="monospace" font-size="10" letter-spacing="1.5">3000x3000 PX • RGB 300DPI • LOSSLESS AUDIO</text>
    ${explicitBadge}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getRegisteredPrefixes(): {
  gs1Prefix: string;
  isrcCountry: string;
  isrcRegistrant: string;
  ddexPartyId: string;
} {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('tank_dist_dsp_integrations_v1');
      if (raw) {
        const parsed = JSON.parse(raw) as {
          gs1UpcPrefix?: string;
          isrcCountryCode?: string;
          isrcRegistrantCode?: string;
          ddexPartyId?: string;
        };
        const cleanGs1 = (parsed.gs1UpcPrefix || '').replace(/\D/g, '').slice(0, 10);
        const cleanCountry = (parsed.isrcCountryCode || '')
          .replace(/[^A-Za-z]/g, '')
          .toUpperCase()
          .slice(0, 2);
        const cleanReg = (parsed.isrcRegistrantCode || '')
          .replace(/[^A-Za-z0-9]/g, '')
          .toUpperCase()
          .slice(0, 3);
        return {
          gs1Prefix: cleanGs1.length >= 4 ? cleanGs1 : '8597',
          isrcCountry: cleanCountry.length === 2 ? cleanCountry : 'US',
          isrcRegistrant: cleanReg.length === 3 ? cleanReg : 'TNK',
          ddexPartyId: (parsed.ddexPartyId || '').trim() || 'PADPIDA2026TANK01',
        };
      }
    } catch {
      // ignore
    }
  }
  return {
    gs1Prefix: '8597',
    isrcCountry: 'US',
    isrcRegistrant: 'TNK',
    ddexPartyId: 'PADPIDA2026TANK01',
  };
}

export function generateUpcCode(): string {
  const { gs1Prefix } = getRegisteredPrefixes();
  let body = gs1Prefix;
  while (body.length < 11) {
    body += Math.floor(Math.random() * 10).toString();
  }
  body = body.slice(0, 11);
  // Standard UPC-A Modulo-10 check digit calculation
  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(body[i], 10);
    if (i % 2 === 0) oddSum += digit;
    else evenSum += digit;
  }
  const total = oddSum * 3 + evenSum;
  const checkDigit = (10 - (total % 10)) % 10;
  return `${body}${checkDigit}`;
}

export function generateIsrcCode(sequence?: number): string {
  const { isrcCountry, isrcRegistrant } = getRegisteredPrefixes();
  const year = new Date().getFullYear().toString().slice(-2);
  const serial = sequence
    ? String(sequence).padStart(5, '0')
    : String(Math.floor(10000 + Math.random() * 89999));
  return `${isrcCountry}-${isrcRegistrant}-${year}-${serial}`;
}

export function generateDdexXmlManifest(release: ReleaseItem): string {
  const { ddexPartyId } = getRegisteredPrefixes();
  const tracksXml = release.tracks
    .map(
      (t) => `    <SoundRecording>
      <SoundRecordingType>MusicalWorkSoundRecording</SoundRecordingType>
      <SoundRecordingId>
        <ISRC>${t.isrcCode}</ISRC>
      </SoundRecordingId>
      <ReferenceTitle>
        <TitleText>${escapeXml(t.title)}</TitleText>
        <SubTitle>${escapeXml(t.version)}</SubTitle>
      </ReferenceTitle>
      <Duration>PT${Math.floor(t.durationSeconds / 60)}M${t.durationSeconds % 60}S</Duration>
      <TechnicalSoundRecordingDetails>
        <AudioCodecType>PCM_WAV</AudioCodecType>
        <SamplingRate>48000</SamplingRate>
        <BitsPerSample>24</BitsPerSample>
        <IntegratedLoudnessLUFS>${t.integratedLufs}</IntegratedLoudnessLUFS>
      </TechnicalSoundRecordingDetails>
      <ParentalWarningType>${t.explicitLyrics ? 'Explicit' : 'NotExplicit'}</ParentalWarningType>
    </SoundRecording>`
    )
    .join('\n');

  const splitsXml = release.splits
    .map(
      (s) => `    <RoyaltySplit>
      <CollaboratorName>${escapeXml(s.collaboratorName)}</CollaboratorName>
      <CollaboratorEmail>${escapeXml(s.collaboratorEmail)}</CollaboratorEmail>
      <Role>${escapeXml(s.role)}</Role>
      <RightSharePercentage>${s.sharePercentage.toFixed(2)}</RightSharePercentage>
    </RoyaltySplit>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ern:NewReleaseMessage xmlns:ern="http://ddex.net/xml/ern/43" ReleaseProfileVersionId="CommonReleaseTypes/14/AudioSingle" LanguageAndScriptCode="en">
  <MessageHeader>
    <MessageThreadId>TANK-DDEX-${release.catalogNumber}</MessageThreadId>
    <MessageId>MSG-${Date.now()}</MessageId>
    <MessageSender>
      <PartyId>${escapeXml(ddexPartyId)}</PartyId>
      <PartyName><FullName>Tank Distribution Global Operations</FullName></PartyName>
    </MessageSender>
    <MessageCreatedDateTime>${new Date().toISOString()}</MessageCreatedDateTime>
  </MessageHeader>
  <ResourceList>
${tracksXml}
  </ResourceList>
  <ReleaseList>
    <Release IsMainRelease="true">
      <ReleaseId>
        <ICPN IsEan="false">${release.upcCode}</ICPN>
        <CatalogNumber Namespace="DPID:${escapeXml(ddexPartyId)}">${escapeXml(release.catalogNumber)}</CatalogNumber>
      </ReleaseId>
      <ReferenceTitle>
        <TitleText>${escapeXml(release.title)}</TitleText>
      </ReferenceTitle>
      <DisplayArtistName>${escapeXml(release.primaryArtist)}</DisplayArtistName>
      <ReleaseType>${release.releaseType}</ReleaseType>
      <Genre><GenreText>${escapeXml(release.primaryGenre)}</GenreText></Genre>
      <PLine><Year>${release.releaseDate.slice(0, 4)}</Year><PLineText>${escapeXml(release.pLine)}</PLineText></PLine>
      <CLine><Year>${release.releaseDate.slice(0, 4)}</Year><CLineText>${escapeXml(release.cLine)}</CLineText></CLine>
    </Release>
  </ReleaseList>
  <TankRoyaltySplitExtension>
${splitsXml}
  </TankRoyaltySplitExtension>
</ern:NewReleaseMessage>`;
}
