import Link from 'next/link';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-(--surface-raised)">
      <div className="text-center max-w-md">
        {/* Big 404 numeral */}
        <p className="text-[8rem] font-black leading-none text-(--border-strong) select-none mb-4">
          404
        </p>

        <div className="flex justify-center mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
            <SearchX className="h-7 w-7" />
          </div>
        </div>

        <h1 className="heading-xl text-(--text-primary) mb-3">Page not found</h1>
        <p className="body-md text-(--text-muted) mb-8">
          The page you're looking for doesn't exist, or may have been moved. Check the URL or head
          back to discover events.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary btn-lg w-full sm:w-auto">
            Back to EventHub
          </Link>
          <Link href="/events" className="btn btn-ghost btn-lg w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4" />
            Browse Events
          </Link>
        </div>
      </div>
    </main>
  );
}
