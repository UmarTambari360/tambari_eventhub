'use client';

import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaveButtonProps {
  loading: boolean;
  onClick: () => void;
  label?: string;
}

export function SaveButton({
  loading,
  onClick,
  label = 'Save',
}: SaveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className="btn-primary min-w-[80px]"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {label}
    </Button>
  );
}