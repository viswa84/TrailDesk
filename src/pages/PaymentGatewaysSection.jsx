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
} from 'lucide-react';

const ENV_OPTIONS = [
  { value: 'test', label: 'Test / Sandbox' },
  { value: 'live', label: 'Live / Production' },
];

function ProviderCard({ provider, existingConfig }) {
  const { addToast } = useToast();
  const [expanded, setExpanded] = useState(!!existingConfig?.enabled);
  const [enabled, setEnabled] = useState(existingConfig?.enabled ?? false);
  const [env, setEnv] = useState(existingConfig?.env ?? 'test');
  const [credValues, setCredValues] = useState({});
  const [showFields, setShowFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const refetchOpts = { refetchQueries: [{ query: LIST_PAYMENT_GATEWAYS }] };
  const [upsertGateway] = useMutation(UPSERT_PAYMENT_GATEWAY, refetchOpts);
  const [deleteGateway] = useMutation(DELETE_PAYMENT_GATEWAY, refetchOpts);
  const [setDefault] = useMutation(SET_DEFAULT_PAYMENT_GATEWAY, refetchOpts);

  const masked = existingConfig?.maskedCredentials || {};
  const isDefault = existingConfig?.isDefault ?? false;

  const canSave = provider.requiredFields
    .filter((f) => f.required)
    .every((f) => (credValues[f.key] && credValues[f.key].trim()) || masked[f.key]);

  const handleToggle = (checked) => {
    setEnabled(checked);
    if (checked) setExpanded(true);
  };

  const handleSave = async () => {
    if (enabled && !canSave) {
      addToast({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    setSaving(true);
    try {
      const credsToSend = Object.keys(credValues).length > 0 ? credValues : undefined;
      await upsertGateway({
        variables: { input: { provider: provider.name, enabled, env, credentials: credsToSend } },
      });
      addToast({ type: 'success', message: `${provider.displayName} settings saved.` });
      setCredValues({});
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${provider.displayName} configuration?`)) return;
    setDeleting(true);
    try {
      await deleteGateway({ variables: { provider: provider.name } });
      addToast({ type: 'success', message: `${provider.displayName} configuration removed.` });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Delete failed.' });
    } finally {
      setDeleting(false);
    }
  };

  const handleSetDefault = async () => {
    try {
      await setDefault({ variables: { provider: provider.name } });
      addToast({ type: 'success', message: `${provider.displayName} set as default payment gateway.` });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to set as default.' });
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
        <label htmlFor={`pg-enable-${provider.name}`} className="flex-1 font-semibold text-slate-900 text-sm cursor-pointer">
          {provider.displayName}
          {isDefault && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
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
              Configure payment gateways below. The <strong>Default</strong> provider is used for all new bookings.
              If no gateway is configured, the system falls back to env-var PayU credentials automatically.
            </p>
            {providers.map((provider) => (
              <ProviderCard
                key={provider.name}
                provider={provider}
                existingConfig={configByProvider[provider.name] || null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
