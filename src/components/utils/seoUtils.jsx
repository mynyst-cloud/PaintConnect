import { SeoSettings } from '@/api/entities';
import { globalCache } from './performanceOptimizer';

/**
 * Helper to set or create a meta tag in the document head.
 * @param {string} name - The name or property attribute of the meta tag.
 * @param {string} content - The content of the meta tag.
 */
function setMetaTag(name, content) {
  if (!content) return;
  
  const attribute = name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name';
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Sets the canonical URL for the page.
 * @param {string} url - The canonical URL.
 */
function setCanonicalUrl(url) {
    if (!url) return;
    let element = document.querySelector('link[rel="canonical"]');
    if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
    }
    element.setAttribute('href', url);
}

/**
 * Fetches SEO settings from the database and applies them to the document head.
 * Uses a cache to avoid redundant database calls.
 * @param {string} pageIdentifier - The identifier for the page SEO settings (e.g., 'landing', 'default').
 */
export async function setupPageSeo(pageIdentifier) {
  try {
    const cacheKey = `seo_${pageIdentifier}`;
    let settings = globalCache.get(cacheKey);

    if (!settings) {
      const results = await SeoSettings.filter({ page_identifier: pageIdentifier });
      if (results && results.length > 0) {
        settings = results[0];
        globalCache.set(cacheKey, settings, 300000); // Cache for 5 minutes
      }
    }
    
    if (settings) {
      const pageUrl = window.location.href;
      document.title = settings.meta_title;
      setMetaTag('description', settings.meta_description);
      setMetaTag('keywords', settings.meta_keywords);
      
      // Open Graph (for Facebook, LinkedIn, etc.)
      setMetaTag('og:title', settings.meta_title);
      setMetaTag('og:description', settings.meta_description);
      setMetaTag('og:image', settings.og_image_url);
      setMetaTag('og:url', pageUrl);
      setMetaTag('og:type', 'website');
      
      // Twitter Card
      setMetaTag('twitter:card', 'summary_large_image');
      setMetaTag('twitter:title', settings.meta_title);
      setMetaTag('twitter:description', settings.meta_description);
      setMetaTag('twitter:image', settings.og_image_url);

      setCanonicalUrl(pageUrl);
    }
  } catch (error) {
    console.error(`Failed to setup SEO for ${pageIdentifier}:`, error);
  }
}