import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  PayoutRequest,
  ReleaseItem,
  RoyaltyTransaction,
} from '../types/distribution';

interface RoyaltiesSplitsViewProps {
  releases: ReleaseItem[];
  transactions: RoyaltyTransaction[];
  payouts: PayoutRequest[];
  onRequestPayout: (
    amountUsd: number,
    method: string,
    destination: string
  ) => Promise<void>;
}

export const RoyaltiesSplitsView: React.FC<RoyaltiesSplitsViewProps> = ({
  releases,
  transactions,
  payouts,
  onRequestPayout,
}) => {
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>(
    releases[0]?.id || ''
  );
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<string>(
    'Stripe Connect Express'
  );
  const [destinationAccount, setDestinationAccount] = useState<string>('');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>('All');

  const grossRoyalties = releases.reduce((acc, r) => acc + r.totalRoyalties, 0);
  const totalWithdrawn = payouts.reduce((acc, p) => acc + p.amountUsd, 0);
  const availableBalance = Math.max(
    0,
    Number((grossRoyalties - totalWithdrawn).toFixed(2))
  );

  const selectedRelease =
    releases.find((r) => r.id === selectedReleaseId) || releases[0];

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0 || amt > availableBalance) return;

    await onRequestPayout(amt, payoutMethod, destinationAccount);
    setPayoutSuccessMsg(
      `Instant settlement of $${amt.toFixed(2)} initiated via ${payoutMethod}.`
    );
    setTimeout(() => setPayoutSuccessMsg(null), 4000);
  };

  const handleExportCsv = () => {
    const headers = [
      'Transaction ID',
      'Reporting Period',
      'Release Title',
      'UPC',
      'DSP Store',
      'Territory',
      'Streams',
      'Gross USD',
      'Net Artist USD (100%)',
      'Status',
    ];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.reportingPeriod,
      `"${tx.releaseTitle}"`,
      tx.upcCode,
      `"${tx.storeName}"`,
      `"${tx.territory}"`,
      tx.streams,
      tx.grossRevenue.toFixed(2),
      tx.netPayout.toFixed(2),
      tx.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Tank_Distribution_Royalty_Statement_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions =
    storeFilter === 'All'
      ? transactions
      : transactions.filter((t) =>
          t.storeName.toLowerCase().includes(storeFilter.toLowerCase())
        );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl bg-[#141720] border border-[#232836]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#F3F4F6]">
            ROYALTIES, SPLITS & PAYOUT LEDGER
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            100% net royalty retention • Automated collaborator split routing •
            Instant multi-currency settlements
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-lg bg-[#1C202B] hover:bg-[#252B3B] border border-[#2E3548] text-xs font-mono-tech font-bold text-[#D4FF00] flex items-center gap-2 self-start sm:self-center cursor-pointer"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Export Official CSV Statement
        </button>
      </div>

      {/* 2-Column Wallet + Collaborator Split Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 cols: Instant Royalty Withdrawal Console */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech uppercase text-[#9CA3AF]">
                AVAILABLE ROYALTY VAULT
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-tech font-bold bg-[#10B981]/15 text-[#10B981]">
                0% COMMISSION • 100% ARTIST
              </span>
            </div>

            <div className="p-5 rounded-xl bg-gradient-to-br from-[#0D131A] to-[#141D28] border border-[#1F2D3D]">
              <div className="text-xs text-[#9CA3AF]">Settled & Ready for Payout</div>
              <div className="text-3xl sm:text-4xl font-mono-tech font-extrabold text-[#10B981] mt-1">
                $
                {availableBalance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="flex items-center justify-between text-xs font-mono-tech text-[#6B7280] mt-3 pt-3 border-t border-[#1E293B]">
                <span>Lifetime Gross: ${grossRoyalties.toLocaleString()}</span>
                <span>Settled Payouts: {payouts.length}</span>
              </div>
            </div>

            {payoutSuccessMsg && (
              <div className="p-3.5 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-xs text-[#10B981] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{payoutSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Withdrawal Amount (USD)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#10B981] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max={availableBalance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full h-11 pl-9 pr-20 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-sm font-bold text-[#F3F4F6] outline-none focus:border-[#D4FF00]"
                  />
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(availableBalance.toFixed(2))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-[#1C202B] text-[10px] font-mono-tech text-[#D4FF00] cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Settlement Rail
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                >
                  <option value="Stripe Connect Express">
                    Stripe Connect Express (Instant USD/EUR)
                  </option>
                  <option value="Wise Multi-Currency (UGX/USD/EUR/GBP)">
                    Wise Multi-Currency (UGX / USD / EUR / GBP)
                  </option>
                  <option value="Bank Wire SWIFT / ACH">
                    Direct Bank Wire (SWIFT / ACH)
                  </option>
                  <option value="USDC On-Chain Treasury">
                    USDC On-Chain Treasury (0s Settlement)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Destination Account / Wallet
                </label>
                <input
                  type="text"
                  value={destinationAccount}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,255,0,0.2)]"
              >
                <Wallet className="w-4 h-4" />
                EXECUTE INSTANT WITHDRAWAL
              </button>
            </form>
          </div>

          {/* Recent Payout History */}
          <div className="pt-4 border-t border-[#232836] space-y-2">
            <div className="text-[11px] font-mono-tech uppercase text-[#6B7280]">
              RECENT PAYOUT DISBURSEMENTS
            </div>
            {payouts.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-lg bg-[#0E1117] border border-[#1E2330] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono-tech font-bold text-[#F3F4F6]">
                    ${p.amountUsd.toFixed(2)} • {p.payoutMethod.split(' ')[0]}
                  </div>
                  <div className="text-[10px] font-mono-tech text-[#6B7280]">
                    Ref: {p.referenceCode}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech bg-[#10B981]/15 text-[#10B981]">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right 7 cols: Automated Collaborator Split Recoupment Engine */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232836] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#D4FF00]" />
                  <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                    Automated Royalty Split Tree
                  </h2>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Inspect per-release collaborator share routing and exact USD
                  earnings
                </p>
              </div>

              <select
                value={selectedRelease?.id || ''}
                onChange={(e) => setSelectedReleaseId(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[#0A0B0E] border border-[#2A3042] text-xs font-mono-tech text-[#D4FF00] outline-none"
              >
                {releases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.catalogNumber})
                  </option>
                ))}
              </select>
            </div>

            {selectedRelease && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0E1117] border border-[#232836] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedRelease.coverArtUrl}
                      alt={selectedRelease.title}
                      className="w-12 h-12 rounded-lg object-cover border border-[#2E3548]"
                    />
                    <div>
                      <div className="text-sm font-bold text-[#F3F4F6]">
                        {selectedRelease.title}
                      </div>
                      <div className="text-xs font-mono-tech text-[#9CA3AF]">
                        UPC: {selectedRelease.upcCode} •{' '}
                        {selectedRelease.totalStreams.toLocaleString()} Streams
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono-tech text-[#9CA3AF]">
                      RELEASE NET POOL
                    </div>
                    <div className="text-xl font-mono-tech font-extrabold text-[#10B981]">
                      ${selectedRelease.totalRoyalties.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Collaborator Breakdown Cards */}
                <div className="space-y-3">
                  {selectedRelease.splits.map((split) => {
                    const earnedUsd =
                      (selectedRelease.totalRoyalties * split.sharePercentage) /
                      100;
                    return (
                      <div
                        key={split.id}
                        className="p-4 rounded-xl bg-[#181B24] border border-[#232836] space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-[#F3F4F6] flex items-center gap-2">
                              {split.collaboratorName}
                              <span className="px-2 py-0.5 text-[10px] font-mono-tech rounded bg-[#232836] text-[#D4FF00]">
                                {split.role}
                              </span>
                            </div>
                            <div className="text-xs font-mono-tech text-[#6B7280]">
                              {split.collaboratorEmail} • {split.payoutMethod}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-mono-tech font-bold text-[#10B981]">
                              ${earnedUsd.toFixed(2)} USD
                            </div>
                            <div className="text-xs font-mono-tech text-[#D4FF00]">
                              {split.sharePercentage.toFixed(1)}% Share
                            </div>
                          </div>
                        </div>

                        <div className="w-full h-1.5 bg-[#0E1117] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#D4FF00] to-[#10B981] rounded-full"
                            style={{ width: `${split.sharePercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-[#0E1117] border border-[#232836] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#10B981]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="font-mono-tech">
                Automated Split Protection: 100.00% of net streaming payouts are
                routed directly to verified collaborators
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#6B7280]" />
          </div>
        </div>
      </div>

      {/* Bottom Statement Ledger Table */}
      <div className="rounded-xl bg-[#141720] border border-[#232836] overflow-hidden">
        <div className="p-5 border-b border-[#232836] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
              DSP Settlement Statement Ledger
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Verified line-item streaming settlements reported via DDEX DSR feeds
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0A0B0E] p-1 rounded-lg border border-[#232836]">
            {['All', 'Spotify', 'Apple', 'Beatport', 'Audiomack', 'TikTok'].map(
              (st) => (
                <button
                  key={st}
                  onClick={() => setStoreFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-mono-tech cursor-pointer ${
                    storeFilter === st
                      ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232836] bg-[#10131B] text-[11px] font-mono-tech uppercase text-[#6B7280]">
                <th className="py-3.5 px-5">Period</th>
                <th className="py-3.5 px-4">Release / UPC</th>
                <th className="py-3.5 px-4">DSP Store</th>
                <th className="py-3.5 px-4">Territory</th>
                <th className="py-3.5 px-4 text-right">Streams</th>
                <th className="py-3.5 px-4 text-right">Net Artist USD</th>
                <th className="py-3.5 px-5 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2330] text-sm">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#191D28]">
                  <td className="py-3.5 px-5 font-mono-tech text-xs text-[#9CA3AF]">
                    {tx.reportingPeriod}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#F3F4F6] text-xs">
                      {tx.releaseTitle}
                    </div>
                    <div className="text-[11px] font-mono-tech text-[#D4FF00]">
                      {tx.upcCode}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-[#F3F4F6]">
                    {tx.storeName}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#9CA3AF]">
                    {tx.territory}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tech text-xs text-[#F3F4F6]">
                    {tx.streams.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono-tech text-xs font-bold text-[#10B981]">
                    ${tx.netPayout.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono-tech ${
                        tx.status === 'Cleared'
                          ? 'bg-[#10B981]/15 text-[#10B981]'
                          : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
