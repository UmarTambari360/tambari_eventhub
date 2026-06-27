'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  getAdminSettingsAction,
  updateSettingAction,
  type PlatformSettingsDTO,
} from '@/actions/admin/settings.actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SettingsSection } from '@/components/admin/settings-section';
import { CategoriesManager } from '@/components/admin/categories-manager';
import { SaveButton } from '@/components/admin/save-button';

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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="heading-xl text-text-primary">Platform Settings</h1>
        <p className="text-text-secondary text-sm">
          Configure platform-wide behaviour. Changes take effect immediately.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-success-light border-success-200 text-success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Service Fee */}
      <SettingsSection
        title="Service Fee"
        description="Percentage charged on every paid ticket. Applied via Paystack split on checkout."
        currentValue={`${settings?.service_fee_percent}%`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              type="number"
              min={0.1}
              max={15}
              step={0.1}
              value={feePercent}
              onChange={(e) => setFeePercent(e.target.value)}
              className="w-32 pr-8 border-border bg-surface text-text-primary focus:ring-primary-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs">
              %
            </span>
          </div>
          <SaveButton
            loading={saving === 'service_fee_percent'}
            onClick={() => void save('service_fee_percent', feePercent, 'Service fee')}
          />
        </div>
      </SettingsSection>

      {/* Max Featured Events */}
      <SettingsSection
        title="Max Featured Events"
        description="Maximum events shown in the homepage featured carousel."
      >
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={1}
            max={20}
            step={1}
            value={maxFeatured}
            onChange={(e) => setMaxFeatured(e.target.value)}
            className="w-24 border-border bg-surface text-text-primary focus:ring-primary-500"
          />
          <SaveButton
            loading={saving === 'max_featured_events'}
            onClick={() => void save('max_featured_events', maxFeatured, 'Max featured events')}
          />
        </div>
      </SettingsSection>

      {/* Platform Name */}
      <SettingsSection title="Platform Name" description="Shown in email templates and UI.">
        <div className="flex items-center gap-3">
          <Input
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            className="w-64 border-border bg-surface text-text-primary focus:ring-primary-500"
          />
          <SaveButton
            loading={saving === 'platform_name'}
            onClick={() => void save('platform_name', platformName, 'Platform name')}
          />
        </div>
      </SettingsSection>

      {/* Support Email */}
      <SettingsSection
        title="Support Email"
        description="Displayed in email footers and the public site."
      >
        <div className="flex items-center gap-3">
          <Input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            className="w-72 border-border bg-surface text-text-primary focus:ring-primary-500"
          />
          <SaveButton
            loading={saving === 'support_email'}
            onClick={() => void save('support_email', supportEmail, 'Support email')}
          />
        </div>
      </SettingsSection>

      {/* Event Categories */}
      <CategoriesManager
        categories={categories}
        newCategory={newCategory}
        onNewCategoryChange={setNewCategory}
        onAddCategory={addCategory}
        onRemoveCategory={removeCategory}
        onSaveCategories={saveCategories}
        isSaving={saving === 'event_categories'}
      />
    </div>
  );
}