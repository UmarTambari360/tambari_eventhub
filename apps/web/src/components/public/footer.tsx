import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold text-violet-600">EventHub</span>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Nigeria&apos;s premier event ticketing and management platform.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Discover
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/events" className="hover:text-violet-600 transition-colors">
                  Browse Events
                </Link>
              </li>
              <li>
                <Link
                  href="/events?category=Music"
                  className="hover:text-violet-600 transition-colors"
                >
                  Music
                </Link>
              </li>
              <li>
                <Link
                  href="/events?category=Tech"
                  className="hover:text-violet-600 transition-colors"
                >
                  Tech
                </Link>
              </li>
              <li>
                <Link
                  href="/events?isFree=true"
                  className="hover:text-violet-600 transition-colors"
                >
                  Free Events
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Organizers
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link
                  href="/become-an-organizer"
                  className="hover:text-violet-600 transition-colors"
                >
                  Host an Event
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-violet-600 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Support
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a
                  href="mailto:support@eventhub.ng"
                  className="hover:text-violet-600 transition-colors"
                >
                  support@eventhub.ng
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">Built for Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}
