import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  LIST_SUPPORTED_PROVIDERS,
  LIST_PAYMENT_GATEWAYS,
} from '../graphql/queries';
import {
  UPSERT_PAYMENT_GATEWAY,
  DELETE_PAYMENT_GATEWAY,
  SET_DEFAULT_PAYMENT_GATEWAY,
} from '../graphql/mutations';
import { uploadFile } from '../utils/fileUpload';
import { useToast } from '../context/ToastContext';
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Trash2,
  Star,
  QrCode,
  Upload,
  X,
} from 'lucide-react';

const ENV_OPTIONS = [
  { value: 'test', label: 'Test / Sandbox' },
  { value: 'live', label: 'Live / Production' },
];

/**
 * Credentials form — for gateway providers (PayU, Easebuzz).
 * Values are write-only: the server returns them masked and never in the clear.
 */
function CredentialsForm({ provider, masked, credValues, setCredValues }) {
  const [showFields, setShowFields] = useState({});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {provider.requiredFields.map((field) => {
        const isPasswordField = field.type === 'password';
        const isVisible = showFields[field.key];
        const existingMasked = masked[field.key];
        const currentVal = credValues[field.key] ?? '';

        return (
          <div key={field.key}>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
              <input
                type={isPasswordField && !isVisible ? 'password' : 'text'}
                value={currentVal}
                placeholder={existingMasked || `Enter ${field.label}`}
                onChange={(e) => setCredValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="input-field pr-10 text-sm"
              />
              {isPasswordField && (
                <button
                  type="button"
                  onClick={() => setShowFields((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
            </div>
            {existingMasked && !currentVal && (
              <p className="text-xs text-slate-400 mt-0.5">Saved: {existingMasked}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Settings form — for manual providers (UPI / GPay QR).
 * Nothing here is secret, so values round-trip in the clear and the QR image is
 * uploaded to R2 exactly like a logo or signature.
 */
function ManualSettingsForm({ settings, setSettings }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    setUploading(true);
    setUploadPct(0);
    try {
      const res = await uploadFile(
        file,
        { folder: 'payment-qr', oldUrl: settings.qrImageUrl || '' },
        setUploadPct,
      );
      set('qrImageUrl', res.url);
      toast.success('QR image uploaded.');
    } catch (err) {
      toast.error(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const hasUpiId = !!(settings.upiId || '').trim();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            UPI ID (VPA)<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={settings.upiId || ''}
            placeholder="yourcompany@okhdfcbank"
            onChange={(e) => set('upiId', e.target.value.trim())}
            className="input-field text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Payee Name<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={settings.payeeName || ''}
            placeholder="Shown in the customer's UPI app"
            onChange={(e) => set('payeeName', e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </div>

      {!hasUpiId && (
        <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
          <strong>Add a UPI ID.</strong> An uploaded QR image alone is a static code — it cannot
          carry the amount or the booking reference, so customers must type the amount by hand and
          payments can't be matched to bookings automatically. With a UPI ID we generate a QR with
          both filled in.
        </div>
      )}

      {/* QR image */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          QR / Scanner Image <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        {settings.qrImageUrl ? (
          <div className="flex items-start gap-3">
            <img
              src={settings.qrImageUrl}
              alt="Payment QR"
              className="w-28 h-28 object-contain rounded-lg border border-slate-200 bg-white p-1"
            />
            <button
              type="button"
              onClick={() => set('qrImageUrl', '')}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg py-5 cursor-pointer hover:border-primary-400 hover:text-primary-600 text-slate-500 text-sm transition-colors">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading… {uploadPct}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload your GPay / UPI scanner image
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} disabled={uploading} />
          </label>
        )}
        <p className="text-xs text-slate-400 mt-1">
          Used for brand recognition and as a fallback when no UPI ID is set.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Payment Instructions <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={settings.instructions || ''}
          placeholder="e.g. After paying, enter the UTR number shown in your UPI app."
          onChange={(e) => set('instructions', e.target.value)}
          className="input-field text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireUtr !== false}
            onChange={(e) => set('requireUtr', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700">
            Require UTR / reference number
            <span className="text-slate-400 text-xs ml-1">— the only field you can match against your bank statement</span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requireScreenshot !== false}
            onChange={(e) => set('requireScreenshot', e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700">Require payment screenshot</span>
        </label>
      </div>

      <div className="text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-lg p-3">
        Bookings paid this way are <strong>not confirmed automatically</strong>. Each payment lands in
        <strong> Payment Verification</strong> for your team to approve against the bank statement.
      </div>
    </div>
  );
}

function ProviderCard({ provider, existingConfig }) {
  const toast = useToast();
  const isManual = provider.kind === 'manual';

  const [expanded, setExpanded] = useState(!!existingConfig?.enabled);
  const [enabled, setEnabled] = useState(existingConfig?.enabled ?? false);
  const [env, setEnv] = useState(existingConfig?.env ?? 'test');
  const [credValues, setCredValues] = useState({});
  const [settings, setSettings] = useState(existingConfig?.settings ?? {});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refetchOpts = { refetchQueries: [{ query: LIST_PAYMENT_GATEWAYS }] };
  const [upsertGateway] = useMutation(UPSERT_PAYMENT_GATEWAY, refetchOpts);
  const [deleteGateway] = useMutation(DELETE_PAYMENT_GATEWAY, refetchOpts);
  const [setDefault] = useMutation(SET_DEFAULT_PAYMENT_GATEWAY, refetchOpts);

  const masked = existingConfig?.maskedCredentials || {};
  const isDefault = existingConfig?.isDefault ?? false;

  // A manual provider needs a payable target, not credentials.
  const canSave = isManual
    ? !!((settings.upiId || '').trim() || (settings.qrImageUrl || '').trim())
    : provider.requiredFields
        .filter((f) => f.required)
        .every((f) => (credValues[f.key] && credValues[f.key].trim()) || masked[f.key]);

  const handleToggle = (checked) => {
    setEnabled(checked);
    if (checked) setExpanded(true);
  };

  const handleSave = async () => {
    if (enabled && !canSave) {
      toast.error(isManual ? 'Add a UPI ID or upload a QR image.' : 'Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const input = { provider: provider.name, enabled, env };
      if (isManual) {
        input.settings = settings;
      } else if (Object.keys(credValues).length > 0) {
        input.credentials = credValues;
      }
      await upsertGateway({ variables: { input } });
      toast.success(`${provider.displayName} settings saved.`);
      setCredValues({});
    } catch (err) {
      toast.error(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${provider.displayName} configuration?`)) return;
    setDeleting(true);
    try {
      await deleteGateway({ variables: { provider: provider.name } });
      toast.success(`${provider.displayName} configuration removed.`);
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    try {
      await setDefault({ variables: { provider: provider.name } });
      toast.success(`${provider.displayName} set as default payment gateway.`);
    } catch (err) {
      toast.error(err.message || 'Failed to set as default.');
    }
  };

  return (
    <div className={`border rounded-xl transition-all ${enabled ? 'border-primary-300 bg-primary-50/30' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3 p-4">
        <input
          type="checkbox"
          id={`pg-enable-${provider.name}`}
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor={`pg-enable-${provider.name}`} className="flex-1 font-semibold text-slate-900 text-sm cursor-pointer flex items-center gap-2">
          {isManual && <QrCode className="w-4 h-4 text-slate-400" />}
          {provider.displayName}
          {isManual && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              Manual approval
            </span>
          )}
          {isDefault && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              Default
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
          {isManual ? (
            <ManualSettingsForm settings={settings} setSettings={setSettings} />
          ) : (
            <>
              <CredentialsForm
                provider={provider}
                masked={masked}
                credValues={credValues}
                setCredValues={setCredValues}
              />
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">Environment</label>
                <div className="flex gap-4">
                  {ENV_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={`pg-env-${provider.name}`}
                        value={opt.value}
                        checked={env === opt.value}
                        onChange={() => setEnv(opt.value)}
                        className="w-3.5 h-3.5 text-primary-600 border-slate-300"
                      />
                      <span className="text-sm text-slate-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || (enabled && !canSave)}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save'}
            </button>

            {existingConfig && enabled && !isDefault && (
              <button
                type="button"
                onClick={handleSetDefault}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <Star className="w-3.5 h-3.5" />
                Set as Default
              </button>
            )}

            {existingConfig && isDefault && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                Current Default
              </span>
            )}

            {existingConfig && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors ml-auto"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentGatewaysSection() {
  const { data: providersData, loading: loadingProviders } = useQuery(LIST_SUPPORTED_PROVIDERS);
  const { data: gatewaysData, loading: loadingGateways } = useQuery(LIST_PAYMENT_GATEWAYS, {
    fetchPolicy: 'cache-and-network',
  });

  const providers = providersData?.listSupportedProviders || [];
  const gateways = gatewaysData?.listPaymentGateways || [];
  const loading = loadingProviders || loadingGateways;

  const configByProvider = {};
  gateways.forEach((gw) => { configByProvider[gw.provider] = gw; });

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900 text-sm">Payment Gateways</h3>
        <span className="text-xs text-slate-400 font-normal">— credentials stored encrypted per tenant</span>
      </div>

      <div className="p-6">
        {loading && !providers.length ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading payment gateway options…
          </div>
        ) : providers.length === 0 ? (
          <p className="text-sm text-slate-500">No payment providers available.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 mb-4">
              Configure payment methods below. The <strong>Default</strong> provider is used for all new
              bookings. Gateways confirm bookings automatically; UPI / GPay QR needs your team to
              approve each payment in <strong>Payment Verification</strong>.
            </p>
            {/* Keys include the config id so a card re-mounts (and re-seeds its
                local state) after a save changes the stored settings. */}
            {providers.map((provider) => {
              const cfg = configByProvider[provider.name] || null;
              return (
                <ProviderCard
                  key={`${provider.name}:${cfg?.updatedAt || 'new'}`}
                  provider={provider}
                  existingConfig={cfg}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
