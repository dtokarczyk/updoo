/**
 * Inline script that runs before paint to set theme class on <html>,
 * so the correct theme is applied immediately and no flash occurs.
 */
export function ThemeScript() {
  const script = `
(function() {
  var k = 'oferi-theme';
  var stored = localStorage.getItem(k);
  var theme = (stored === 'dark' || stored === 'light')
    ? stored
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.add(theme);
})();
  `.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
