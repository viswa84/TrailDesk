import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { io as socketIO } from 'socket.io-client';
import { MANUAL_PAYMENTS } from '../graphql/queries';
import { APPROVE_MANUAL_PAYMENT, REJECT_MANUAL_PAYMENT } from '../graphql/mutations';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck, Loader2, Check, X, ExternalLink, AlertTriangle,
  Copy, Phone, Users, Calendar, RefreshCw, Inbox,
} from 'lucide-react';

const TABS = [
  { key: 'submitted', label: 'Awaiting review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function money(n) {
  if (n == null) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

function when(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dateOnly(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ProofCard({ item, onApprove, onReject, busy }) {
  const toast = useToast();
  const [amount, setAmount] = useState(item.amountExpected ?? item.amountClaimed ?? 0);
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [zoom, setZoom] = useState(false);

  const isPending = item.state === 'submitted';
  // Approving consumes seats only on the first payment; a balance top-up on an
  // already-partial booking had its seats counted when the advance was approved.
  const needsSeats = item.bookingStatus !== 'partial';
  const notEnoughSeats = needsSeats && item.seatsAvailable != null && item.peopleCount > item.seatsAvailable;
  const amountMismatch = item.amountClaimed != null && item.amountExpected != null
    && Number(item.amountClaimed) !== Number(item.amountExpected);

  const copy = (text, label) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied.`);
  };

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-0">
        {/* Screenshot */}
        <div className="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-3 flex items-center justify-center">
          {item.screenshotUrl ? (
            <button type="button" onClick={() => setZoom(true)} className="block w-full">
              <img
                src={item.screenshotUrl}
                alt="Payment proof"
                className="w-full max-h-44 object-contain rounded-lg hover:opacity-90 transition-opacity"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Tap to enlarge</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 text-center py-8">No screenshot</div>
          )}
        </div>

        {/* Details */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">
                {item.customerName || 'Unnamed customer'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{item.trekName || 'Trek booking'}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-900">{money(item.amountExpected)}</div>
              <div className="text-[11px] text-slate-400">
                {item.paymentType === 'partial' ? 'advance requested' : 'requested'}
              </div>
            </div>
          </div>

          {/* Facts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-3 text-xs">
            <div>
              <span className="text-slate-400 block">UTR / Reference</span>
              {item.utr ? (
                <button
                  type="button"
                  onClick={() => copy(item.utr, 'UTR')}
                  className="font-mono text-slate-800 hover:text-primary-600 flex items-center gap-1"
                >
                  {item.utr}
                  <Copy className="w-3 h-3" />
                </button>
              ) : <span className="text-slate-400">not provided</span>}
            </div>
            <div>
              <span className="text-slate-400 block">Customer says paid</span>
              <span className={amountMismatch ? 'text-amber-700 font-semibold' : 'text-slate-800'}>
                {money(item.amountClaimed)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Booking ref</span>
              <span className="font-mono text-slate-800">{item.txnid}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Phone className="w-3 h-3 text-slate-400" />
              {item.phone || '—'}
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Users className="w-3 h-3 text-slate-400" />
              {item.peopleCount} {item.peopleCount === 1 ? 'person' : 'people'}
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Calendar className="w-3 h-3 text-slate-400" />
              {dateOnly(item.departureDate)}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2">
            Submitted {when(item.submittedAt)}
            {item.submitCount > 1 && ` · attempt ${item.submitCount}`}
            {item.bookingStatus === 'partial' && ' · balance payment (advance already paid)'}
          </div>

          {/* Warnings */}
          {amountMismatch && (
            <div className="mt-3 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Customer claims {money(item.amountClaimed)} but {money(item.amountExpected)} was
                requested. Confirm the real figure against your bank statement before approving.
              </span>
            </div>
          )}
          {notEnoughSeats && (
            <div className="mt-2 text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg px-3 py-2 flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Only {item.seatsAvailable} seat(s) left but this booking needs {item.peopleCount}.
                Approving will be blocked — reject and arrange a refund, or raise the departure capacity.
              </span>
            </div>
          )}

          {/* Review outcome (history tabs) */}
          {!isPending && (
            <div className={`mt-3 text-xs rounded-lg px-3 py-2 ${
              item.state === 'approved'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <strong>{item.state === 'approved' ? 'Approved' : 'Rejected'}</strong>
              {item.reviewedByName && ` by ${item.reviewedByName}`}
              {item.reviewedAt && ` · ${when(item.reviewedAt)}`}
              {item.reviewNote && <div className="mt-0.5">{item.reviewNote}</div>}
            </div>
          )}

          {/* Actions */}
          {isPending && !rejecting && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-end gap-2 flex-wrap">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Amount actually received
                </label>
                <input
                  type="number"
                  value={amount}
                  min="1"
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field text-sm !py-1.5 w-32"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Note <span className="text-slate-400">(internal)</span>
                </label>
                <input
                  type="text"
                  value={note}
                  placeholder="e.g. matched HDFC stmt 04 Aug"
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field text-sm !py-1.5"
                />
              </div>
              <button
                type="button"
                disabled={busy || notEnoughSeats}
                onClick={() => onApprove(item.bookingId, Number(amount), note)}
                className="btn-primary flex items-center gap-1.5 text-xs px-3 py-2 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejecting(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}

          {isPending && rejecting && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Reason — the customer is shown this on WhatsApp
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={reason}
                  autoFocus
                  placeholder="e.g. No matching payment found in our bank statement."
                  onChange={(e) => setReason(e.target.value)}
                  className="input-field text-sm !py-1.5 flex-1 min-w-[200px]"
                />
                <button
                  type="button"
                  disabled={busy || !reason.trim()}
                  onClick={() => onReject(item.bookingId, reason.trim())}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                  Confirm rejection
                </button>
                <button
                  type="button"
                  onClick={() => { setRejecting(false); setReason(''); }}
                  className="text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setZoom(false)}
        >
          <img src={item.screenshotUrl} alt="Payment proof" className="max-w-full max-h-full rounded-lg" />
          <a
            href={item.screenshotUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 flex items-center gap-1.5 text-white/90 hover:text-white text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open original
          </a>
        </div>
      )}
    </div>
  );
}

export default function PaymentVerificationPage() {
  const toast = useToast();
  const [tab, setTab] = useState('submitted');
  const [busyId, setBusyId] = useState(null);

  const { data, loading, refetch } = useQuery(MANUAL_PAYMENTS, {
    variables: { state: tab, limit: 100, offset: 0 },
    fetchPolicy: 'cache-and-network',
  });

  const [approve] = useMutation(APPROVE_MANUAL_PAYMENT);
  const [reject] = useMutation(REJECT_MANUAL_PAYMENT);

  // New proofs arrive while the queue is open — refetch rather than patch the
  // cache, so seat counts and booking status stay authoritative.
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = socketIO(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('trekops_token') },
    });
    socket.on('manualPaymentSubmitted', () => refetch());
    socket.on('manualPaymentReviewed', () => refetch());
    socket.on('connect_error', () => {
      socket.auth = { token: localStorage.getItem('trekops_token') };
    });
    return () => socket.disconnect();
  }, [refetch]);

  const handleApprove = useCallback(async (bookingId, amountReceived, note) => {
    setBusyId(bookingId);
    try {
      const res = await approve({ variables: { bookingId, amountReceived, note: note || null } });
      toast.success(res.data?.approveManualPayment?.message || 'Payment approved.');
      await refetch();
    } catch (err) {
      toast.error(err.message || 'Approval failed.');
    } finally {
      setBusyId(null);
    }
  }, [approve, refetch, toast]);

  const handleReject = useCallback(async (bookingId, reason) => {
    setBusyId(bookingId);
    try {
      const res = await reject({ variables: { bookingId, reason } });
      toast.success(res.data?.rejectManualPayment?.message || 'Payment rejected.');
      await refetch();
    } catch (err) {
      toast.error(err.message || 'Rejection failed.');
    } finally {
      setBusyId(null);
    }
  }, [reject, refetch, toast]);

  const queue = data?.manualPayments;
  const items = queue?.items || [];
  const pendingCount = queue?.pendingCount ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-500" />
            Payment Verification
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            UPI / GPay payments land directly in your bank account — approve each one against your
            statement to confirm the booking.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.key === 'submitted' && pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[11px] font-semibold bg-red-100 text-red-700 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && !items.length ? (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-10 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading payments…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {tab === 'submitted' ? 'Nothing awaiting review.' : `No ${tab} payments yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <ProofCard
              key={item.bookingId}
              item={item}
              busy={busyId === item.bookingId}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
