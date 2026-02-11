/**
 * Layout with main content on the left and sidebar on the right (e.g. profile).
 * SSR only.
 */
type ContentLayoutProps = {
  sidebar: React.ReactNode;
  mobileList: React.ReactNode;
  showSidebar: boolean;
  children: React.ReactNode;
};

export function ContentLayout({
  sidebar,
  mobileList,
  showSidebar,
  children,
}: ContentLayoutProps) {
  return (
    <div className="flex min-h-full w-full flex-col md:flex-row md:gap-6 max-w-4xl mx-auto pt-4 px-4">
      <main className="min-w-0 flex-1 flex flex-col justify-center order-2 md:order-1">
        {children}
      </main>
      {showSidebar && (
        <>
          <div className="hidden md:block shrink-0 order-2">{sidebar}</div>
          <div className="md:hidden w-full order-1">{mobileList}</div>
        </>
      )}
    </div>
  );
}
