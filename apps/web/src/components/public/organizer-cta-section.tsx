'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';

export function OrganizerCTASection() {
  return (
    <section className="mb-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-600 px-8 py-14 sm:px-14 text-white"
      >
        {/* Decorative orbs with floating animation */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          animate={{
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/5 blur-2xl"
          animate={{
            y: [0, 20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, white 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative max-w-xl">
          {/* Icon with pulse animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 rounded-full bg-white/20 blur-xl scale-150 opacity-50" />
            <TrendingUp className="h-10 w-10 mb-4 text-white relative" />
          </motion.div>

          {/* Heading with staggered text animation */}
          <motion.h2
            className="display-md mb-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.08,
                  delayChildren: 0.2,
                },
              },
            }}
          >
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="block"
            >
              Ready to host
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="block"
            >
              your event?
            </motion.span>
          </motion.h2>

          {/* Description with fade-up */}
          <motion.p
            className="body-lg text-white/85 mb-8"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          >
            List your event on Tambari EventHub and sell tickets directly to your audience. Revenue
            lands in your bank account via Paystack — no delays, no middlemen.
          </motion.p>

          {/* Buttons with staggered entrance */}
          <motion.div
            className="flex flex-wrap gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.4,
                },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Link
                href="/become-an-organizer"
                className="btn btn-xl bg-white text-accent-700 hover:bg-amber-50 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Apply to host events
                  <motion.span
                    className="inline-block"
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.span>
                </span>
                {/* Hover shine effect */}
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Link>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Link
                href="/events"
                className="btn btn-xl bg-white/15 text-white hover:bg-white/25 border border-white/20 group"
              >
                Browse first
                <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust indicator - small badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 flex items-center gap-4 text-white/60 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Trusted by 50+ organizers
            </span>
            <span className="w-px h-4 bg-white/20" />
            <span>Free to list</span>
            <span className="w-px h-4 bg-white/20" />
            <span>Paystack secure</span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
