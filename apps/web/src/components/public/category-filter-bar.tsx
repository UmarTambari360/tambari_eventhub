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
    params.delete('page'); // reset page on filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => handleSelect(null)}
        className={cn(
          'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
          !currentCategory
            ? 'bg-violet-600 border-violet-600 text-white'
            : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700'
        )}
      >
        All Events
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => handleSelect(cat)}
          className={cn(
            'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
            currentCategory === cat
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700'
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
