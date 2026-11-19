import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export interface WebDocResult {
  url: string;
  title: string;
  byline: string | null;
  excerpt: string | null;
  textContent: string;
  wordCount: number;
  crawledPages?: { url: string; title: string; textContent: string }[];
}

export async function extractWebDoc(
  targetUrl: string,
  maxCrawlPages: number = 1
): Promise<WebDocResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
  } catch (e: any) {
    throw new Error(`Invalid URL: ${targetUrl}`);
  }

  const primaryResult = await fetchAndExtractPage(parsedUrl.toString());

  const crawledPages: { url: string; title: string; textContent: string }[] = [];

  // Crawl same-domain links if requested and available
  if (maxCrawlPages > 1 && primaryResult.internalLinks.length > 0) {
    const visited = new Set<string>([parsedUrl.toString()]);
    const toVisit = primaryResult.internalLinks.slice(0, maxCrawlPages - 1);

    for (const subUrl of toVisit) {
      if (visited.has(subUrl)) continue;
      visited.add(subUrl);
      try {
        const subPage = await fetchAndExtractPage(subUrl);
        if (subPage.textContent.length > 100) {
          crawledPages.push({
            url: subUrl,
            title: subPage.title,
            textContent: subPage.textContent,
          });
        }
      } catch (err) {
        console.warn(`Failed crawling sub-page ${subUrl}:`, err);
      }
    }
  }

  // Combine content
  let fullText = primaryResult.textContent;
  if (crawledPages.length > 0) {
    fullText += '\n\n' + crawledPages.map(p => `--- Page: ${p.title} (${p.url}) ---\n${p.textContent}`).join('\n\n');
  }

  const words = fullText.trim().split(/\s+/).filter(Boolean).length;

  return {
    url: parsedUrl.toString(),
    title: primaryResult.title || parsedUrl.hostname,
    byline: primaryResult.byline,
    excerpt: primaryResult.excerpt,
    textContent: fullText,
    wordCount: words,
    crawledPages,
  };
}

async function fetchAndExtractPage(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} fetching ${url}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Extract internal same-domain links
  const origin = new URL(url).origin;
  const internalLinks: string[] = [];
  const anchors = doc.querySelectorAll('a[href]');
  for (const a of Array.from(anchors)) {
    const href = a.getAttribute('href');
    if (href) {
      try {
        const resolved = new URL(href, url);
        if (
          resolved.origin === origin &&
          !resolved.pathname.match(/\.(png|jpg|jpeg|gif|svg|pdf|zip|tar)$/i) &&
          !resolved.hash
        ) {
          internalLinks.push(resolved.toString());
        }
      } catch {}
    }
  }

  const reader = new Readability(doc);
  const article = reader.parse();

  const title = article?.title || doc.title || url;
  const textContent = article?.textContent ? article.textContent.trim().replace(/\n\s*\n\s*\n/g, '\n\n') : '';

  return {
    title,
    byline: article?.byline || null,
    excerpt: article?.excerpt || null,
    textContent: textContent || 'Could not parse clean article text.',
    internalLinks: Array.from(new Set(internalLinks)),
  };
}
