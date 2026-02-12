/**
 * Layout for "my" / settings: left sidebar + content. SSR only.
 */
type SettingsLayoutProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsLayout({
  sidebar,
  children,
}: SettingsLayoutProps) {
  return (
    <div className="flex min-h-full w-full flex-col md:flex-row md:gap-6 max-w-4xl mx-auto pt-4 px-4">
      <div className="hidden md:block shrink-0">{sidebar}</div>
      <main className="min-w-0 flex-1 flex flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
