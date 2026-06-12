import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-(--border) bg-(--surface) mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-black">
                E
              </div>
              <span className="text-base font-bold text-(--text-primary)">EventHub</span>
            </div>
            <p className="body-sm text-(--text-muted) leading-relaxed">
              Nigeria&apos;s premier event ticketing and management platform.
            </p>
          </div>

          {[
            {
              title: 'Discover',
              links: [
                { href: '/events', label: 'Browse Events' },
                { href: '/events?category=Music', label: 'Music' },
                { href: '/events?category=Tech', label: 'Tech' },
                { href: '/events?isFree=true', label: 'Free Events' },
              ],
            },
            {
              title: 'Organizers',
              links: [
                { href: '/become-an-organizer', label: 'Host an Event' },
                { href: '/dashboard', label: 'Dashboard' },
              ],
            },
            {
              title: 'Support',
              links: [{ href: 'mailto:support@eventhub.ng', label: 'support@eventhub.ng' }],
            },
          ].map((section) => (
            <div key={section.title}>
              <p className="overline text-(--text-muted) mb-3">{section.title}</p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="body-sm text-(--text-muted) hover:text-(--primary) transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-(--border) pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="caption text-(--text-muted)">
            © {new Date().getFullYear()} EventHub. All rights reserved.
          </p>
          <p className="caption text-(--text-muted)">Built for Nigeria 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}
