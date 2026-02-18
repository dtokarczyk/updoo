/**
 * Layout for "my" / settings / admin: left sidebar + content. SSR only.
 */
type SettingsLayoutProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  /** Max width of the content area. Default 4xl; use 7xl for admin. */
  maxWidth?: '4xl' | '7xl';
};

export function SettingsLayout({
  sidebar,
  children,
  maxWidth = '4xl',
}: SettingsLayoutProps) {
  const maxWidthClass = maxWidth === '7xl' ? 'max-w-7xl' : 'max-w-4xl';
  return (
    <div
      className={`flex min-h-full w-full flex-col md:flex-row md:gap-6 ${maxWidthClass} mx-auto pt-4 px-4`}
    >
      <div className="hidden md:block shrink-0">{sidebar}</div>
      <main className="min-w-0 flex-1 flex flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
