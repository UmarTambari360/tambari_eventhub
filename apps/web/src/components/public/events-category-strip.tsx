import Link from 'next/link';
import {
  Music,
  Monitor,
  Palette,
  Mic,
  Briefcase,
  Utensils,
  Trophy,
  Sparkles,
} from 'lucide-react';

export function CategoryStrip() {
  const categories = [
    {
      label: 'Music',
      icon: Music,
      href: '/events?category=Music',
    },
    {
      label: 'Tech',
      icon: Monitor,
      href: '/events?category=Tech',
    },
    {
      label: 'Arts & Culture',
      icon: Palette,
      href: '/events?category=Arts',
    },
    {
      label: 'Comedy',
      icon: Mic,
      href: '/events?category=Comedy',
    },
    {
      label: 'Business',
      icon: Briefcase,
      href: '/events?category=Business',
    },
    {
      label: 'Food & Drink',
      icon: Utensils,
      href: '/events?category=Food',
    },
    {
      label: 'Sports',
      icon: Trophy,
      href: '/events?category=Sports',
    }
  ];

  return (
    <section className="mb-16">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-text-muted" />
          <div className="flex items-center gap-6">
            <p className="overline text-text-muted tracking-widest">BROWSE BY CATEGORY</p>
          </div>
        </div>
        <span className="text-xs text-text-muted font-medium">{categories.length} Categories</span>
      </div>

      {/* Category Strip */}
      <div className="flex gap-2 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="group shrink-0 w-40 pt-4 snap-start transition-all duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
            >
              <div className="h-28 border border-border bg-surface-raised hover:bg-surface-overlay hover:border-primary/30 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-card-md group-hover:shadow-card-lg">
                {/* Icon */}
                <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
                  <Icon
                    className="h-9 w-9 text-text-muted group-hover:text-primary transition-colors duration-300"
                    strokeWidth={1.8}
                  />
                </div>

                {/* Label */}
                <span className="text-sm font-semibold text-text-secondary group-hover:text-primary transition-colors duration-200 tracking-tight">
                  {cat.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
