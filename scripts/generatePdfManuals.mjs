import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';

const MANUALS = [
  {
    category: 'tank_admin',
    roleTitle: 'TANK ADMIN — SYSTEM & OPERATIONS MANUAL',
    subtitle:
      'Complete Guide to Platform Administration, Release QC, User Profiles & Supabase/GitHub Infrastructure',
    pdfFileName: 'Tank_Admin_Navigation_Manual.pdf',
    targetAudience:
      'Platform Administrators, Distribution Operations Engineers & Chief Label Admins',
    accessScopeSummary:
      'Tank Admin is the ONLY profile category on the platform with visibility into technical infrastructure (Supabase PostgreSQL, GitHub CI/CD, SQL schemas, and raw DDEX ERN 4.3 XML manifests). All other profiles see a clean, non-technical music industry workspace.',
    keyCapabilities: [
      'Full visibility into top-bar Supabase & GitHub connection status pills',
      'Exclusive access to the "Supabase & GitHub" sidebar navigation module',
      'Ability to inspect and download raw DDEX ERN 4.3 XML manifests in the Release Inspector',
      'Instant pipeline state control (promote releases between Draft, In Review, and Delivered)',
      'Full User Profile management across all 5 role categories',
    ],
    sections: [
      {
        stepNumber: 'SECTION 01',
        title: 'Navigating the Command Overview & Admin Telemetry',
        navigationPath: 'Left Sidebar -> Command Overview',
        summary:
          'Monitor global platform health, aggregated streams across 150+ DSPs, net royalty pools, and the live store delivery pipeline.',
        actionItems: [
          'Review the 4 KPI summary cards at the top of the dashboard for total catalog streams, net royalty balance, active masters, and delivery SLA.',
          'Use the Telemetry Chart controls to toggle between "Streams" and "Royalty USD" across 7D, 30D, 90D, and 12M windows.',
          'Check the top utility header to verify that the Supabase status badge and GitHub repository pill (kampalanalf-sudo/iuea) are online.',
        ],
        proTip:
          'Click directly on the Supabase or GitHub pill in the top bar from any screen to jump straight to the Cloud Infrastructure Studio.',
      },
      {
        stepNumber: 'SECTION 02',
        title: 'Approving Releases & Inspecting DDEX ERN 4.3 XML',
        navigationPath: 'Left Sidebar -> Catalog & Releases -> Click Any Release -> Inspector Modal',
        summary:
          'Perform quality control (QC) on submitted releases, verify audio loudness, inspect per-store batch IDs, and export DDEX XML.',
        actionItems: [
          'Click any release row or card to open the Release Inspector Modal.',
          'Use the "PIPELINE STATE" buttons (Delivered / In Review / Draft) to promote a release once QC checks pass.',
          'Click the admin-exclusive "DDEX ERN 4.3 XML" tab to inspect the generated XML message or download the .XML file for store ingestion.',
        ],
        proTip:
          'Non-admin users (Artistes, Managers, Producers) cannot see the DDEX XML tab or override pipeline states.',
      },
      {
        stepNumber: 'SECTION 03',
        title: 'Managing Supabase PostgreSQL & GitHub Sync',
        navigationPath: 'Left Sidebar -> Supabase & GitHub (Admin Exclusive)',
        summary:
          'Configure live database credentials, run SQL schema migrations, and synchronize local catalog records to Supabase PostgreSQL.',
        actionItems: [
          'Enter your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and click "Save & Test Supabase Connection".',
          'Copy or download "001_tank_distribution_schema.sql" from the SQL Migration viewer and execute it in your Supabase SQL Editor.',
          'Click "Sync Catalog to Supabase" to upsert all releases, tracks, and splits to your live PostgreSQL database.',
        ],
        proTip:
          'The platform automatically operates in zero-latency Hybrid mode when offline and seamlessly syncs when live credentials are provided.',
      },
      {
        stepNumber: 'SECTION 04',
        title: 'Administering User Profiles & Role Manuals',
        navigationPath: 'Left Sidebar -> Profiles & Manuals',
        summary:
          'Switch between user personas to test role-based views, onboard new artistes or managers, and distribute PDF navigation guides.',
        actionItems: [
          'Use the Role Category tabs to filter accounts by Tank Admin, Artiste, Music Manager, Record Label, or Producer.',
          'Click "Switch to Profile" on any user card to immediately experience the platform from that user’s exact permission scope.',
          'Click "+ Create New Profile" to provision a new account in any category.',
        ],
        proTip:
          'When you switch to a non-admin profile, use the Profile Switcher in the top header at any time to return to Tank Admin.',
      },
    ],
    faq: [
      {
        q: 'Why do Artistes and Music Managers not see the Supabase & GitHub tab?',
        a: 'By design, Tank Distribution isolates all technical and database details strictly to the Tank Admin profile so creators and managers enjoy a distraction-free music business workspace.',
      },
      {
        q: 'How do I export a full royalty audit for all releases?',
        a: 'Navigate to "Royalties & Splits" in the left sidebar and click "Export Official CSV Statement" in the top-right corner.',
      },
    ],
  },
  {
    category: 'artiste',
    roleTitle: 'ARTISTE / RECORDING ARTIST — SITE NAVIGATION MANUAL',
    subtitle:
      'Step-by-Step Creator Guide to Uploading Music, Designing Cover Art, Setting Splits & Collecting 100% Royalties',
    pdfFileName: 'Artiste_Navigation_Manual.pdf',
    targetAudience:
      'Independent Solo Artistes, Vocalists, Bands & Recording Creators',
    accessScopeSummary:
      'Your Artiste Portal is custom-tailored for releasing music and tracking your career growth. All technical server and database settings are hidden so you can focus 100% on your music, artwork, fans, and royalties.',
    keyCapabilities: [
      '4-Step Release Builder Wizard to distribute Singles, EPs, and Albums to 150+ stores',
      'Built-in 3000x3000px Cover Art Studio with 6 visual themes + custom image upload',
      'Automatic free UPC barcode and ISRC track code generation',
      'Automated Collaborator Royalty Split setup so your producers and features get paid automatically',
      'Instant royalty cash-out via Stripe Connect, Wise, Bank Wire, or USDC',
    ],
    sections: [
      {
        stepNumber: 'STEP 01',
        title: 'Checking Your Streams & Earnings on the Artiste Dashboard',
        navigationPath: 'Left Sidebar -> Command Overview',
        summary:
          'Your home screen gives you an instant snapshot of how your music is performing across Spotify, Apple Music, TikTok, Audiomack, and Beatport.',
        actionItems: [
          'Check your 4 top cards: Total Catalog Streams, Net Royalty Balance (100% yours), Active Masters, and Store Delivery status.',
          'Use the interactive chart to switch between "Streams" and "Royalty USD" across the last 7 days, 30 days, 90 days, or 12 months.',
          'Click the Play button on any of your releases in the table to audition your master track in the bottom studio player.',
        ],
        proTip:
          'You can scrub through your song and check your loudness level (-14.0 LUFS) in the persistent bottom audio bar at any time.',
      },
      {
        stepNumber: 'STEP 02',
        title: 'Uploading a New Single, EP, or Album',
        navigationPath: 'Left Sidebar -> Distribute Release (or Top Button "+ New Release")',
        summary:
          'Follow the guided 4-step wizard to prepare and ship your release to global streaming platforms.',
        actionItems: [
          'Step 1 (Metadata & Cover Art): Enter your Release Title, Artist Name, Genre, and Release Date. Upload your own cover image (.PNG/.JPG) or pick one of the 6 Studio Cover Presets.',
          'Step 2 (Audio Masters & ISRCs): Click "Upload Audio File (.WAV / .MP3)" to select audio files from your computer. An official ISRC code (US-TNK-26-XXXXX) is generated automatically for every track.',
          'Step 3 (100% Royalty Splits): Add your producers, featured artists, or co-writers and set their percentage share until the bar turns green at 100.00%.',
          'Step 4 (DSP Stores & Launch): Select your streaming stores, enable YouTube Content ID & TikTok monetization, and click "DEPLOY RELEASE TO DSPs".',
        ],
        proTip:
          'Need to split royalties equally with your producer? Click the "Auto-Balance 100%" button in Step 3!',
      },
      {
        stepNumber: 'STEP 03',
        title: 'Managing Your Catalog & Store Delivery Status',
        navigationPath: 'Left Sidebar -> Catalog & Releases',
        summary:
          'Search your discography, copy your UPC/ISRC codes for playlist pitching, and check which stores have delivered your release.',
        actionItems: [
          'Use the search bar to find any release by title, UPC barcode, or track ISRC code.',
          'Click any release card to open the Release Inspector where you can view your tracklist, store delivery statuses, and verified royalty splits.',
        ],
        proTip:
          'Copy your ISRC code before release day so you can submit your track to Spotify for Artists editorial playlists.',
      },
      {
        stepNumber: 'STEP 04',
        title: 'Withdrawing Your Streaming Royalties',
        navigationPath: 'Left Sidebar -> Royalties & Splits',
        summary:
          'Tank Distribution gives you 100% of your net streaming royalties. Cash out your available balance whenever you want.',
        actionItems: [
          'In the "Available Royalty Vault" panel on the left, enter the USD amount you wish to withdraw (or click "MAX").',
          'Select your preferred payout rail: Stripe Connect, Wise Multi-Currency (UGX/USD/EUR/GBP), Direct Bank Wire, or USDC.',
          'Click "EXECUTE INSTANT WITHDRAWAL" — your payment is processed and logged immediately under Recent Payout Disbursements.',
        ],
        proTip:
          'Click "Export Official CSV Statement" in the top right to download a spreadsheet of your earnings by store and territory.',
      },
    ],
    faq: [
      {
        q: 'Do I need to buy my own UPC barcode or ISRC codes?',
        a: 'No! Tank Distribution automatically generates official UPC barcodes and US-TNK ISRC codes for every release and track at zero cost.',
      },
      {
        q: 'How do my collaborators get paid?',
        a: 'When you set up Royalty Splits in Step 3 of the Release Builder, Tank Distribution automatically routes each collaborator’s exact percentage share into their account.',
      },
    ],
  },
  {
    category: 'music_manager',
    roleTitle: 'MUSIC MANAGER — ROSTER & COMMISSION NAVIGATION MANUAL',
    subtitle:
      'Complete Guide to Multi-Artist Roster Oversight, Release Scheduling, Split Auditing & Financial Reporting',
    pdfFileName: 'Music_Manager_Navigation_Manual.pdf',
    targetAudience:
      'Artist Managers, Talent Representatives, Booking/Management Agencies & Business Managers',
    accessScopeSummary:
      'The Music Manager profile provides a multi-artist command view across your entire managed roster without exposing raw technical or database administration panels.',
    keyCapabilities: [
      'Unified multi-artist telemetry across all artistes on your management roster',
      'Ability to submit and coordinate new releases on behalf of any managed artiste',
      'Transparent auditing of collaborator splits and management commission shares',
      'One-click CSV royalty statement exports for client accounting and tax reporting',
    ],
    sections: [
      {
        stepNumber: 'SECTION 01',
        title: 'Monitoring Your Artist Roster Performance',
        navigationPath: 'Left Sidebar -> Command Overview',
        summary:
          'Track combined streaming velocity and royalty inflows across all artistes under your management umbrella.',
        actionItems: [
          'Review the active roster banner at the top of the Command Overview showing your managed artistes (e.g., Kampala Nights, Sora Vane, Nyx & The Architect).',
          'Inspect the "Store Delivery Pipeline" panel on the right to verify whether upcoming client releases are "In Review" or "Delivered" to stores.',
          'Use the status filter tabs (All / Delivered / In Review / Draft) in the Catalog Table to spot releases that need attention before release day.',
        ],
        proTip:
          'Use the 30D and 90D Royalty USD chart view to forecast quarterly management commissions accurately.',
      },
      {
        stepNumber: 'SECTION 02',
        title: 'Coordinating & Submitting Releases for Managed Artistes',
        navigationPath: 'Left Sidebar -> Distribute Release',
        summary:
          'Prepare release metadata, upload final masters from your mastering engineer, and lock collaborator splits on behalf of your client.',
        actionItems: [
          'In Step 1, enter the managed artiste’s name under "Primary Artist" and set the target global release date.',
          'In Step 2, upload the final 24-bit WAV masters and verify that songwriter legal names are entered accurately for publishing registration.',
          'In Step 3, include both the Primary Artist share, any Producer/Feature shares, and your Management Commission split if collected at source.',
        ],
        proTip:
          'Always enable YouTube Content ID & TikTok Sound Library in Step 4 to maximize short-form video revenue for your roster.',
      },
      {
        stepNumber: 'SECTION 03',
        title: 'Auditing Royalty Splits & Exporting Client Statements',
        navigationPath: 'Left Sidebar -> Royalties & Splits',
        summary:
          'Verify per-release earnings breakdowns and generate official accounting statements for your artistes.',
        actionItems: [
          'In the "Automated Royalty Split Tree" panel, use the dropdown selector to switch between each release on your roster.',
          'Review the exact USD amount earned by the Primary Artist, Producers, and Featured Artists.',
          'Click "Export Official CSV Statement" to download a full line-item breakdown by DSP store, territory, stream count, and net USD.',
        ],
        proTip:
          'Filter the bottom Statement Ledger by store (Spotify, Apple, Beatport, Audiomack, TikTok) to see which platform drives the highest per-stream payout for each artist.',
      },
    ],
    faq: [
      {
        q: 'Can I manage multiple artistes from a single Music Manager profile?',
        a: 'Yes! Your Music Manager profile aggregates releases, streams, and statements for all artistes assigned to your management roster.',
      },
      {
        q: 'How can I onboard a new artiste to my roster?',
        a: 'Navigate to "Profiles & Manuals" in the sidebar and click "+ Create New Profile" or add their name when submitting a new release.',
      },
    ],
  },
  {
    category: 'label_exec',
    roleTitle: 'RECORD LABEL & A&R EXECUTIVE — NAVIGATION MANUAL',
    subtitle:
      'Executive Guide to Master Catalog Registry, Copyright Lines (P & C), Multi-Artist Rollouts & Label Recoupment',
    pdfFileName: 'Record_Label_AR_Navigation_Manual.pdf',
    targetAudience:
      'Independent Record Label Owners, A&R Directors, Catalog Managers & Distribution Coordinators',
    accessScopeSummary:
      'Designed for record label executives overseeing a multi-artist imprint. Provides complete master catalog, copyright, and financial visibility without low-level database or code clutter.',
    keyCapabilities: [
      'Complete imprint catalog registry with UPC-A barcode and US-TNK ISRC search',
      'Audit Phonographic (P) and Artwork (C) copyright lines across all label releases',
      'Track store delivery footprints across Major Streaming, DJ/Electronic (Beatport), and Pan-African (Audiomack/Boomplay) DSPs',
      'Manage label share splits and treasury withdrawals',
    ],
    sections: [
      {
        stepNumber: 'SECTION 01',
        title: 'Overseeing the Imprint Catalog & Master Registry',
        navigationPath: 'Left Sidebar -> Catalog & Releases',
        summary:
          'Maintain a clean, searchable registry of every Single, EP, and Album released under your label imprint.',
        actionItems: [
          'Toggle between the visual "Studio Grid View" and the high-density "Technical Table View" using the icons in the top-right of the filter bar.',
          'Filter catalog releases by format (Single / EP / Album) or delivery status (Delivered / In Review / Draft).',
          'Click any release to verify its Phonographic and Copyright lines at the bottom of the Release Inspector.',
        ],
        proTip:
          'Use the search bar to look up any release instantly by its 12-digit UPC code or 12-character ISRC code during sync licensing deals.',
      },
      {
        stepNumber: 'SECTION 02',
        title: 'Executing Label Release Rollouts',
        navigationPath: 'Left Sidebar -> Distribute Release',
        summary:
          'Standardize your label’s visual identity, catalog numbering, and store targeting across all signings.',
        actionItems: [
          'Ensure "Record Label Name" in Step 1 is set to your imprint (e.g., Tank Recordings) so all DSPs display the correct label credit.',
          'Configure the Label Share percentage alongside the Primary Artist and Producer splits in Step 3.',
          'Select specialized electronic or regional stores (Beatport, TIDAL HiFi Plus, Audiomack) in Step 4 based on the release genre.',
        ],
        proTip:
          'Each release is automatically assigned a sequential catalog number (e.g., TNK-2026-005) for organized label archiving.',
      },
      {
        stepNumber: 'SECTION 03',
        title: 'Managing the Label Treasury & Statements',
        navigationPath: 'Left Sidebar -> Royalties & Splits',
        summary:
          'Reconcile quarterly and monthly settlement feeds and disburse label funds.',
        actionItems: [
          'Review lifetime gross vs. settled net balance in the Available Royalty Vault.',
          'Execute treasury withdrawals to your corporate Bank Wire (SWIFT/ACH) or Stripe Connect account.',
          'Export CSV statements for quarterly label accounting.',
        ],
        proTip:
          'All collaborator splits are deducted automatically, ensuring zero manual accounting overhead for your finance team.',
      },
    ],
    faq: [
      {
        q: 'Can our label customize the copyright lines?',
        a: 'Yes, every release stores dedicated P-Line and C-Line metadata tied to your Record Label Name and release year.',
      },
    ],
  },
  {
    category: 'producer_collab',
    roleTitle: 'PRODUCER, SONGWRITER & COLLABORATOR — NAVIGATION MANUAL',
    subtitle:
      'Guide to Auditing Master Audio Loudness, Verifying Royalty Split Shares & Cashing Out Producer Earnings',
    pdfFileName: 'Producer_Collaborator_Navigation_Manual.pdf',
    targetAudience:
      'Music Producers, Beatmakers, Featured Vocalists, Songwriters & Mixing/Mastering Engineers',
    accessScopeSummary:
      'A focused, creator-friendly workspace for collaborators credited on Tank Distribution releases to audition master audio, confirm their split percentage, and withdraw royalties directly.',
    keyCapabilities: [
      'Instant visibility into every release and track where you are credited as a Producer, Featured Artist, Songwriter, or Engineer',
      'Built-in studio audio transport bar with real-time LUFS loudness, True Peak (dBTP), and 24-bit WAV sample rate metering',
      'Transparent verification of your locked royalty percentage share',
      'Direct independent withdrawal of your split earnings without waiting on the primary artist',
    ],
    sections: [
      {
        stepNumber: 'SECTION 01',
        title: 'Auditioning Credited Masters & Checking Loudness Specs',
        navigationPath: 'Left Sidebar -> Catalog & Releases -> Click Play on Any Credited Track',
        summary:
          'Verify that the final master uploaded for distribution matches your studio mix and loudness target.',
        actionItems: [
          'Click the Play icon on any release or track to launch the persistent bottom studio player.',
          'Observe the real-time frequency visualizer and the right-hand loudness meter displaying Integrated LUFS (e.g., -13.8 LUFS) and True Peak (-0.2 dBTP).',
          'Open the Release Inspector Modal to confirm your legal songwriter or producer credit on each track.',
        ],
        proTip:
          'Tank Distribution preserves lossless 24-bit / 48kHz-96kHz WAV masters for Apple Music ALAC and TIDAL HiFi Plus.',
      },
      {
        stepNumber: 'SECTION 02',
        title: 'Verifying Your Royalty Split Percentage',
        navigationPath: 'Left Sidebar -> Royalties & Splits -> Automated Royalty Split Tree',
        summary:
          'Confirm that your agreed producer or feature points are locked into the release’s automated split contract.',
        actionItems: [
          'Select the release you contributed to from the dropdown in the "Automated Royalty Split Tree" panel.',
          'Locate your name, role badge (e.g., Producer, Featured Artist, Mixing / Mastering), and verified percentage share.',
          'View your exact USD earnings calculated automatically from the release’s net royalty pool.',
        ],
        proTip:
          'Once a release split is locked at 100%, your share is routed directly to you on every DSP settlement cycle.',
      },
      {
        stepNumber: 'SECTION 03',
        title: 'Withdrawing Your Producer / Collaborator Royalties',
        navigationPath: 'Left Sidebar -> Royalties & Splits -> Available Royalty Vault',
        summary:
          'Cash out your earned royalties directly to your preferred bank or digital wallet.',
        actionItems: [
          'Enter your withdrawal amount in the Available Royalty Vault.',
          'Choose Stripe Connect, Wise Multi-Currency, Bank Wire (SWIFT), or USDC Treasury.',
          'Click "EXECUTE INSTANT WITHDRAWAL" to receive your payout.',
        ],
        proTip:
          'You never have to chase artists or labels for paper checks — your split share settles directly into your account.',
      },
    ],
    faq: [
      {
        q: 'Can a primary artist change my split without a record?',
        a: 'All splits must sum to 100.00% and display a Verified or Pending badge visible to all participants on the release.',
      },
    ],
  },
];

function renderManualToDoc(doc, manual, startOnNewPage) {
  if (startOnNewPage) doc.addPage();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const drawHeaderBar = (pageTitle) => {
    doc.setFillColor(10, 11, 14);
    doc.rect(0, 0, pageWidth, 26, 'F');
    doc.setFillColor(212, 255, 0);
    doc.rect(0, 26, pageWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(212, 255, 0);
    doc.text('TANK DISTRIBUTION // OFFICIAL NAVIGATION MANUAL', margin, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(200, 205, 215);
    doc.text(pageTitle, margin, 18.5);
  };

  const drawFooter = () => {
    doc.setDrawColor(210, 215, 225);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 118, 135);
    doc.text(`Tank Distribution Platform • ${manual.roleTitle}`, margin, pageHeight - 8);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 14, pageHeight - 8);
  };

  drawHeaderBar(manual.roleTitle);
  let y = 36;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 20, 30);
  const titleLines = doc.splitTextToSize(manual.roleTitle, contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 105);
  const subLines = doc.splitTextToSize(manual.subtitle, contentWidth);
  doc.text(subLines, margin, y);
  y += subLines.length * 5 + 4;

  doc.setFillColor(244, 246, 250);
  doc.setDrawColor(210, 218, 230);
  const scopeLines = doc.splitTextToSize(
    `ROLE ACCESS & VISIBILITY SCOPE: ${manual.accessScopeSummary}`,
    contentWidth - 8
  );
  const targetLines = doc.splitTextToSize(
    `TARGET AUDIENCE: ${manual.targetAudience}`,
    contentWidth - 8
  );
  const boxHeight = (scopeLines.length + targetLines.length) * 4.6 + 10;
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 28, 45);
  doc.text(targetLines, margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(45, 55, 75);
  doc.text(scopeLines, margin + 4, y + 6 + targetLines.length * 4.8 + 2);
  y += boxHeight + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 20, 30);
  doc.text('KEY ROLE CAPABILITIES & PERMISSIONS', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40, 48, 64);
  manual.keyCapabilities.forEach((cap) => {
    const lines = doc.splitTextToSize(`•  ${cap}`, contentWidth - 4);
    if (y + lines.length * 4.5 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.5 + 1.5;
  });

  y += 4;

  manual.sections.forEach((sec) => {
    if (y + 38 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }

    doc.setFillColor(18, 22, 32);
    doc.roundedRect(margin, y, contentWidth, 8.5, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(212, 255, 0);
    doc.text(`${sec.stepNumber}: ${sec.title.toUpperCase()}`, margin + 3, y + 5.7);
    y += 12.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(16, 140, 95);
    doc.text(`SITE NAVIGATION PATH:  ${sec.navigationPath}`, margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(45, 55, 72);
    const sumLines = doc.splitTextToSize(sec.summary, contentWidth);
    doc.text(sumLines, margin, y);
    y += sumLines.length * 4.5 + 2.5;

    sec.actionItems.forEach((act, idx) => {
      const actLines = doc.splitTextToSize(`${idx + 1}. ${act}`, contentWidth - 6);
      if (y + actLines.length * 4.5 > pageHeight - 22) {
        drawFooter();
        doc.addPage();
        drawHeaderBar(manual.roleTitle);
        y = 36;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(25, 32, 48);
      doc.text(actLines, margin + 3, y);
      y += actLines.length * 4.5 + 1.5;
    });

    const tipLines = doc.splitTextToSize(`PRO TIP: ${sec.proTip}`, contentWidth - 6);
    if (y + tipLines.length * 4.5 + 6 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(90, 100, 120);
    doc.text(tipLines, margin + 3, y + 1);
    y += tipLines.length * 4.5 + 6;
  });

  if (manual.faq.length > 0) {
    if (y + 28 > pageHeight - 22) {
      drawFooter();
      doc.addPage();
      drawHeaderBar(manual.roleTitle);
      y = 36;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 20, 30);
    doc.text('FREQUENTLY ASKED QUESTIONS (FAQ)', margin, y);
    y += 5.5;

    manual.faq.forEach((item) => {
      const qLines = doc.splitTextToSize(`Q: ${item.q}`, contentWidth - 4);
      const aLines = doc.splitTextToSize(`A: ${item.a}`, contentWidth - 4);
      if (y + (qLines.length + aLines.length) * 4.5 + 4 > pageHeight - 22) {
        drawFooter();
        doc.addPage();
        drawHeaderBar(manual.roleTitle);
        y = 36;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(20, 28, 45);
      doc.text(qLines, margin + 2, y);
      y += qLines.length * 4.5 + 1;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.6);
      doc.setTextColor(55, 65, 85);
      doc.text(aLines, margin + 2, y);
      y += aLines.length * 4.5 + 3.5;
    });
  }

  drawFooter();
}

const outDirs = [
  path.resolve('public/manuals'),
  path.resolve('manuals'),
];

for (const dir of outDirs) {
  fs.mkdirSync(dir, { recursive: true });
}

for (const manual of MANUALS) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  renderManualToDoc(doc, manual, false);
  const buffer = Buffer.from(doc.output('arraybuffer'));
  for (const dir of outDirs) {
    fs.writeFileSync(path.join(dir, manual.pdfFileName), buffer);
  }
}

const combinedDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
MANUALS.forEach((manual, idx) => {
  renderManualToDoc(combinedDoc, manual, idx > 0);
});
const combinedBuffer = Buffer.from(combinedDoc.output('arraybuffer'));
for (const dir of outDirs) {
  fs.writeFileSync(
    path.join(dir, 'Tank_Distribution_Complete_User_Manuals.pdf'),
    combinedBuffer
  );
}

console.log('Generated 6 PDF manuals in public/manuals/ and manuals/');
