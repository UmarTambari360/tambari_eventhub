// app/admin/settings/components/categories-manager.tsx
'use client';

import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SaveButton } from './save-button';

interface CategoriesManagerProps {
  categories: string[];
  newCategory: string;
  onNewCategoryChange: (value: string) => void;
  onAddCategory: () => void;
  onRemoveCategory: (category: string) => void;
  onSaveCategories: () => void;
  isSaving: boolean;
}

export function CategoriesManager({
  categories,
  newCategory,
  onNewCategoryChange,
  onAddCategory,
  onRemoveCategory,
  onSaveCategories,
  isSaving,
}: CategoriesManagerProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddCategory();
    }
  };

  return (
    <Card className="border-border bg-surface-overlay">
      <CardHeader>
        <CardTitle className="text-text-primary heading-sm">Event Categories</CardTitle>
        <p className="text-text-secondary text-sm">
          Available categories organizers can assign to events.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Tags */}
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {categories.length === 0 ? (
            <p className="text-text-muted text-sm italic">No categories defined yet.</p>
          ) : (
            categories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-50 text-primary-700 border-primary-200"
              >
                {cat}
                <button
                  onClick={() => onRemoveCategory(cat)}
                  className="ml-0.5 hover:text-danger transition-colors rounded-full hover:bg-primary-100 p-0.5"
                  aria-label={`Remove category ${cat}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        {/* Add Category Input */}
        <div className="flex items-center gap-2">
          <Input
            value={newCategory}
            onChange={(e) => onNewCategoryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-48 border-border bg-surface text-text-primary placeholder:text-text-muted focus:ring-primary-500"
            placeholder="New category…"
            maxLength={30}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCategory}
            disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
            className="border-border text-text-secondary hover:bg-surface-raised"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <SaveButton loading={isSaving} onClick={onSaveCategories} label="Save Categories" />
        </div>
      </CardContent>
    </Card>
  );
}
