'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getAdminSettingsAction,
  updateSettingAction,
  type PlatformSettingsDTO,
} from '@/actions/admin.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function AdminSettingsPage() {
  const auth = useAuth();
  const [settings, setSettings] = useState<PlatformSettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Local editable state
  const [feePercent, setFeePercent] = useState('');
  const [maxFeatured, setMaxFeatured] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (!auth?.accessToken) return;
    void (async () => {
      const result = await getAdminSettingsAction(auth.accessToken!);
      if (result.success && result.data) {
        const s = result.data;
        setSettings(s);
        setFeePercent(String(s.service_fee_percent));
        setMaxFeatured(String(s.max_featured_events));
        setPlatformName(s.platform_name);
        setSupportEmail(s.support_email);
        setCategories(s.event_categories);
      }
      setLoading(false);
    })();
  }, [auth?.accessToken]);

  async function save(key: string, value: string, label: string) {
    if (!auth?.accessToken) return;
    setSaving(key);
    setError(null);
    setSuccess(null);
    const result = await updateSettingAction(key, value, auth.accessToken);
    if (result.success) {
      setSuccess(`${label} updated successfully.`);
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error ?? 'Failed to update');
    }
    setSaving(null);
  }

  async function saveCategories() {
    await save('event_categories', JSON.stringify(categories), 'Categories');
  }

  function addCategory() {
    const cat = newCategory.trim();
    if (!cat || categories.includes(cat)) return;
    setCategories((prev) => [...prev, cat]);
    setNewCategory('');
  }

  function removeCategory(cat: string) {
    setCategories((prev) => prev.filter((c) => c !== cat));
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="heading-xl text-(--text-primary)">Platform Settings</h1>
        <p className="body-sm text-(--text-muted) mt-1">
          Configure platform-wide behaviour. Changes take effect immediately.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Service fee */}
      <div className="card p-5">
        <h2 className="heading-sm text-(--text-primary) mb-1">Service Fee</h2>
        <p className="body-sm text-(--text-muted) mb-4">
          Percentage charged on every paid ticket. Applied via Paystack split on checkout.
        </p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="number"
              min={0.1}
              max={15}
              step={0.1}
              value={feePercent}
              onChange={(e) => setFeePercent(e.target.value)}
              className="input-base w-32 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 caption text-(--text-muted)">
              %
            </span>
          </div>
          <SaveButton
            loading={saving === 'service_fee_percent'}
            onClick={() => void save('service_fee_percent', feePercent, 'Service fee')}
          />
        </div>
        <p className="caption text-(--text-muted) mt-2">
          Current: {settings?.service_fee_percent}%
        </p>
      </div>

      {/* Max featured */}
      <div className="card p-5">
        <h2 className="heading-sm text-(--text-primary) mb-1">Max Featured Events</h2>
        <p className="body-sm text-(--text-muted) mb-4">
          Maximum events shown in the homepage featured carousel.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={20}
            step={1}
            value={maxFeatured}
            onChange={(e) => setMaxFeatured(e.target.value)}
            className="input-base w-24"
          />
          <SaveButton
            loading={saving === 'max_featured_events'}
            onClick={() => void save('max_featured_events', maxFeatured, 'Max featured events')}
          />
        </div>
      </div>

      {/* Platform name */}
      <div className="card p-5">
        <h2 className="heading-sm text-(--text-primary) mb-1">Platform Name</h2>
        <p className="body-sm text-(--text-muted) mb-4">Shown in email templates and UI.</p>
        <div className="flex items-center gap-3">
          <input
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="input-base w-64"
          />
          <SaveButton
            loading={saving === 'platform_name'}
            onClick={() => void save('platform_name', platformName, 'Platform name')}
          />
        </div>
      </div>

      {/* Support email */}
      <div className="card p-5">
        <h2 className="heading-sm text-(--text-primary) mb-1">Support Email</h2>
        <p className="body-sm text-(--text-muted) mb-4">
          Displayed in email footers and the public site.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="input-base w-72"
          />
          <SaveButton
            loading={saving === 'support_email'}
            onClick={() => void save('support_email', supportEmail, 'Support email')}
          />
        </div>
      </div>

      {/* Event categories */}
      <div className="card p-5">
        <h2 className="heading-sm text-(--text-primary) mb-1">Event Categories</h2>
        <p className="body-sm text-(--text-muted) mb-4">
          Available categories organizers can assign to events.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => (
            <span
              key={cat}
              className="flex items-center gap-1.5 badge badge-primary text-sm py-1.5"
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                className="hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCategory();
              }
            }}
            className="input-base w-48"
            placeholder="New category…"
            maxLength={30}
          />
          <button onClick={addCategory} className="flex items-center gap-1.5 btn btn-ghost btn-sm">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>

        <SaveButton
          loading={saving === 'event_categories'}
          onClick={() => void saveCategories()}
          label="Save Categories"
        />
      </div>
    </div>
  );
}

function SaveButton({
  loading,
  onClick,
  label = 'Save',
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 btn btn-primary btn-sm disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}
