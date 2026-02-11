/**
 * Main layout with two sidebars (left and right). Used for home and jobs list.
 * SSR only.
 */
export function HomeLayout({
  left,
  right,
  children,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        {left}
        {children}
        {right}
      </div>
    </div>
  );
}
