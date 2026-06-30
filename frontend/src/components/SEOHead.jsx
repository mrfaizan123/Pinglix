import { Helmet } from 'react-helmet-async';

/**
 * SEOHead - Dynamic per-page SEO meta tags
 * Supports title, description, og image, canonical, and noindex
 */
const SEOHead = ({
  title = 'Pinglix – Free Website Uptime Monitor | Keep Servers Always Online',
  description = 'Pinglix is a free website uptime monitoring tool trusted by 1,000+ developers. Track real-time latency, prevent cold starts on Render & Heroku, and get 99.9% uptime. Start monitoring in 60 seconds.',
  canonical = 'https://pinglix.onrender.com/',
  ogImage = 'https://pinglix.onrender.com/og-image.png',
  noIndex = false,
  ogType = 'website',
  jsonLd = null,
}) => {
  const fullTitle = title.includes('Pinglix') ? title : `${title} | Pinglix`;

  return (
    <Helmet>
      {/* ─── Primary ────────────────────────────────────── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ─── Open Graph ─────────────────────────────────── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${fullTitle} – Screenshot`} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Pinglix" />

      {/* ─── Twitter ────────────────────────────────────── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* ─── JSON-LD Structured Data ─────────────────────── */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
