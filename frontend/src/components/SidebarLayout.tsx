type SidebarLayoutProps = {
  /** Sidebar (desktop) and list (mobile) - same component with different variants. */
  sidebar: React.ReactNode;
  /** Mobile list shown above content when sidebar is visible. */
  mobileList: React.ReactNode;
  /** When true, sidebar/list is visible. */
  showSidebar: boolean;
  children: React.ReactNode;
};

/**
 * Layout with left sidebar (desktop) or top list (mobile).
 * No drawer - list is always visible above content on mobile.
 */
export function SidebarLayout({
  sidebar,
  mobileList,
  showSidebar,
  children,
}: SidebarLayoutProps) {
  return (
    <div className="flex min-h-full w-full flex-col md:flex-row md:gap-6">
      {showSidebar && (
        <>
          <div className="hidden md:block shrink-0">{sidebar}</div>
          <div className="md:hidden w-full">{mobileList}</div>
        </>
      )}
      <main className="min-w-0 flex-1 flex flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
