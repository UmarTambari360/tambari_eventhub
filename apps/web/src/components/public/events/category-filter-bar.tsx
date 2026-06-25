'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Music',
  'Tech',
  'Business',
  'Arts',
  'Food',
  'Sports',
  'Fashion',
  'Culture',
  'Comedy',
  'Religion',
];

export function CategoryFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  function handleSelect(category: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {[null, ...CATEGORIES].map((cat) => {
        const active = cat === null ? !currentCategory : currentCategory === cat;
        return (
          <button
            key={cat ?? 'all'}
            onClick={() => handleSelect(cat)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all whitespace-nowrap border',
              active
                ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                : 'bg-surface text-text-secondary border-border hover:border-primary-300 hover:text-primary-600'
            )}
          >
            {cat ?? 'All Events'}
          </button>
        );
      })}
    </div>
  );
}
