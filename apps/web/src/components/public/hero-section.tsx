'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative mb-16 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 px-6 py-20 sm:px-12 sm:py-28 text-white">
      {/* Decorative orbs with floating animation */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"
        animate={{
          y: [0, 20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      <div className="relative max-w-2xl">
        {/* Badge with slide-in animation */}
        <motion.span
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          🇳🇬 Nigeria's Event Platform
        </motion.span>

        {/* Main heading with staggered text animation */}
        <motion.h1 
          className="display-xl mb-6 leading-none"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
              },
            },
          }}
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="block"
          >
            Your next
          </motion.span>
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="block text-accent-300"
          >
            great experience
          </motion.span>
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="block"
          >
            starts here.
          </motion.span>
        </motion.h1>

        {/* Description with fade-up animation */}
        <motion.p
          className="body-lg mb-8 text-white/80 max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        >
          Discover concerts, tech summits, art exhibitions, comedy shows and more happening across
          Nigeria. Book in seconds, get your QR ticket instantly.
        </motion.p>

        {/* Buttons with staggered entrance */}
        <motion.div 
          className="flex flex-wrap gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.6,
              },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Link href="/events" className="btn btn-xl bg-white text-primary-900 hover:bg-primary-50 group">
              Browse Events
              <motion.span
                className="inline-block"
                animate={{ x: [0, 5, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                  ease: "easeInOut",
                }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Link
              href="/become-an-organizer"
              className="btn btn-xl bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              Host an Event
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}