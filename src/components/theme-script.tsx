export function ThemeScript() {
  const code = `
(function() {
  try {
    var pref = document.cookie.split('; ').find(function(c){return c.indexOf('bolao_theme=')===0});
    var theme = pref ? pref.split('=')[1] : null;
    if (!theme || theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {}
})();
  `.trim();
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
