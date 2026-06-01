import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  LIST_SUPPORTED_INTEGRATIONS,
  LIST_INTEGRATIONS,
} from '../graphql/queries';
import {
  UPSERT_INTEGRATION,
  DELETE_INTEGRATION,
  TEST_INTEGRATION,
} from '../graphql/mutations';
import { useToast } from '../context/ToastContext';
import {
  MessageSquare,
  Cloud,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Trash2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Contact,
  Copy,
} from 'lucide-react';

// Map provider name to icon
const PROVIDER_ICONS = {
  whatsapp: MessageSquare,
  r2: Cloud,
  google: Contact,
};

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const GOOGLE_REDIRECT_URI = `${API_BASE}/api/contacts/google/callback`;

function GoogleContactsCard({ existingConfig }) {
  const toast = useToast();
  const [clientId, setClientId] = useState(existingConfig?.meta?.clientId || '');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const [upsertIntegration] = useMutation(UPSERT_INTEGRATION, {
    refetchQueries: [{ query: LIST_INTEGRATIONS }],
  });

  const maskedSecret = existingConfig?.maskedCredentials?.clientSecret;
  const isConfigured = Boolean(existingConfig?.hasCredentials && existingConfig?.meta?.clientId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_REDIRECT_URI);
      toast.success('Copied');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const credentials = {};
      if (clientSecret) {
        credentials.clientSecret = clientSecret;
      }
      await upsertIntegration({
        variables: {
          provider: 'google',
          enabled: true,
          meta: { clientId, redirectUri: GOOGLE_REDIRECT_URI },
          credentials,
        },
      });
      toast.success('Google Contacts settings saved.');
      setClientSecret('');
    } catch (err) {
      toast.error(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
            <Contact className="w-4.5 h-4.5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Google Contacts</p>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
              Connect a Google account to sync WhatsApp contacts into Google Contacts. Create an
              OAuth Client ID in Google Cloud Console.
            </p>
          </div>
        </div>
        {isConfigured && (
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
            Configured ✓
          </span>
        )}
      </div>

      {/* Form */}
      <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-5">
        <div className="grid grid-cols-1 gap-3">
          {/* Client ID */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Client ID</label>
            <input
              type="text"
              placeholder="xxxxxxxx.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {/* Client Secret */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Client Secret</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                placeholder={maskedSecret || 'GOCSPX-...'}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="input-field pr-9 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            {maskedSecret && (
              <p className="text-xs text-slate-400 mt-0.5">Leave blank to keep current</p>
            )}
          </div>

          {/* Redirect URI */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Redirect URI</label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={GOOGLE_REDIRECT_URI}
                className="input-field pr-9 text-sm bg-white"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                title="Copy"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Add this exact URI to your Google Cloud OAuth client's Authorized redirect URIs.
            </p>
          </div>
        </div>

        {/* Help list */}
        <ol className="list-decimal list-inside text-xs text-slate-500 space-y-1">
          <li>Google Cloud Console → enable People API</li>
          <li>Create OAuth Client ID (Web application)</li>
          <li>Paste the Redirect URI above</li>
          <li>Copy Client ID / Secret here</li>
          <li>Go to Contacts → Connect Google</li>
        </ol>

        {/* Action button */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function IntegrationCard({ integration, existingConfig }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(!!existingConfig?.enabled);
  const [enabled, setEnabled] = useState(existingConfig?.enabled ?? false);
  const [credValues, setCredValues] = useState({});
  const [metaValues, setMetaValues] = useState(existingConfig?.meta ?? {});
  const [showFields, setShowFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success, message } | null

  const refetchOpts = { refetchQueries: [{ query: LIST_INTEGRATIONS }] };
  const [upsertIntegration] = useMutation(UPSERT_INTEGRATION, refetchOpts);
  const [deleteIntegration] = useMutation(DELETE_INTEGRATION, refetchOpts);
  const [testIntegration] = useMutation(TEST_INTEGRATION);

  const masked = existingConfig?.maskedCredentials || {};
  const hasCreds = existingConfig?.hasCredentials ?? false;

  // Check that all required credential fields are satisfied
  const canSave = integration.requiredFields
    .filter((f) => f.required)
    .every((f) => (credValues[f.key] && credValues[f.key].trim()) || masked[f.key]);

  const handleToggle = (checked) => {
    setEnabled(checked);
    if (checked) setExpanded(true);
  };

  const handleSave = async () => {
    if (enabled && !canSave) {
      toast.error('Please fill in all required credential fields.');
      return;
    }
    setSaving(true);
    setTestResult(null);
    try {
      const credsToSend = Object.keys(credValues).length > 0 ? credValues : undefined;
      // Only send meta keys that have values (merge with existing)
      const metaToSend = Object.keys(metaValues).length > 0 ? metaValues : undefined;
      await upsertIntegration({
        variables: {
          provider: integration.name,
          enabled,
          credentials: credsToSend,
          meta: metaToSend,
        },
      });
      toast.success(`${integration.displayName} settings saved.`);
      setCredValues({});
    } catch (err) {
      toast.error(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Remove ${integration.displayName} configuration?`)) return;
    setDeleting(true);
    setTestResult(null);
    try {
      await deleteIntegration({ variables: { provider: integration.name } });
      toast.success(`${integration.displayName} configuration removed.`);
      setEnabled(false);
      setCredValues({});
      setMetaValues({});
    } catch (err) {
      toast.error(err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await testIntegration({ variables: { provider: integration.name } });
      const result = data?.testIntegration;
      setTestResult(result);
      if (result?.success) {
        toast.success(result.message);
      } else {
        toast.error(result?.message || 'Test failed.');
      }
    } catch (err) {
      const msg = err.message || 'Test failed.';
      setTestResult({ success: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  const Icon = PROVIDER_ICONS[integration.name] || Cloud;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{integration.displayName}</p>
            {integration.description && (
              <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{integration.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasCreds && (
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
              Configured
            </span>
          )}
          {/* Enable toggle */}
          <button
            type="button"
            onClick={() => handleToggle(!enabled)}
            className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
              enabled ? 'bg-primary-600' : 'bg-slate-200'
            }`}
            title={enabled ? 'Disable' : 'Enable'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                enabled ? 'translate-x-4.5' : ''
              }`}
            />
          </button>
          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-5">
          {/* Secret credential fields */}
          {integration.requiredFields.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Credentials (encrypted at rest)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {integration.requiredFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={
                          field.type === 'password' && !showFields[field.key]
                            ? 'password'
                            : 'text'
                        }
                        placeholder={
                          masked[field.key]
                            ? masked[field.key]
                            : field.placeholder || (field.required ? 'Required' : 'Optional')
                        }
                        value={credValues[field.key] || ''}
                        onChange={(e) =>
                          setCredValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="input-field pr-9 text-sm"
                      />
                      {field.type === 'password' && (
                        <button
                          type="button"
                          onClick={() =>
                            setShowFields((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showFields[field.key] ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                    {masked[field.key] && !credValues[field.key] && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Current: {masked[field.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-secret meta fields */}
          {integration.metaFields.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Configuration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {integration.metaFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      placeholder={field.placeholder || (field.required ? 'Required' : 'Optional')}
                      value={metaValues[field.key] || ''}
                      onChange={(e) =>
                        setMetaValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="input-field text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test result banner */}
          {testResult && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {hasCreds && (
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {testing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="w-3.5 h-3.5" />
                  )}
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
              )}
              {hasCreds && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  {deleting ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IntegrationsSection() {
  const {
    data: supportedData,
    loading: supportedLoading,
  } = useQuery(LIST_SUPPORTED_INTEGRATIONS);

  const {
    data: configsData,
    loading: configsLoading,
  } = useQuery(LIST_INTEGRATIONS, { fetchPolicy: 'cache-and-network' });

  const supported = supportedData?.listSupportedIntegrations || [];
  const configs = configsData?.listIntegrations || [];

  function getExistingConfig(providerName) {
    return configs.find((c) => c.provider === providerName) || null;
  }

  if (supportedLoading || configsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Cloud className="w-4 h-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900 text-sm">Integrations</h3>
        <span className="text-xs text-slate-400 font-normal">
          — per-tenant WhatsApp, storage, and more
        </span>
      </div>
      <div className="p-6 space-y-4">
        {supported.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No integrations available.
          </p>
        )}
        {supported.map((integration) => (
          <IntegrationCard
            key={integration.name}
            integration={integration}
            existingConfig={getExistingConfig(integration.name)}
          />
        ))}
        <GoogleContactsCard existingConfig={getExistingConfig('google')} />
      </div>
    </div>
  );
}
