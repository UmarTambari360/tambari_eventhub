'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

export function TrustBar() {
  const stats = [
    { value: 10000, label: 'Tickets sold', suffix: '+' },
    { value: 200, label: 'Events hosted', suffix: '+' },
    { value: 50, label: 'Organizers', suffix: '+' },
    { value: 100, label: 'Secure via Paystack', suffix: '%' },
  ];

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="mb-16 rounded-2xl bg-surface-raised border border-border px-8 py-10 overflow-hidden relative"
    >
      {/* Subtle background decoration */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 20% 50%, var(--brand) 0%, transparent 50%)',
        }}
      />

      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 text-center relative">
        {stats.map((stat, index) => {
          const [count, setCount] = useState(0);

          useEffect(() => {
            if (!isInView) return;

            const duration = 2000;
            const increment = stat.value / (duration / 16.67);
            let current = 0;

            const timer = setInterval(() => {
              current += increment;
              if (current >= stat.value) {
                setCount(stat.value);
                clearInterval(timer);
              } else {
                setCount(Math.floor(current));
              }
            }, 16.67);

            return () => clearInterval(timer);
          }, [isInView, stat.value]);

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="group relative"
            >
              {/* Highlight line on hover */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-brand opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

              <p className="text-3xl sm:text-4xl font-black text-brand mb-1 tabular-nums">
                {count.toLocaleString()}
                {stat.suffix}
              </p>
              <p className="body-sm text-text-muted">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default TrustBar;
