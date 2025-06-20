
// Web scraping functionality
export interface ScrapeOptions {
  timeout: number;
  waitFor: number;
}

export const defaultScrapeOptions: ScrapeOptions = {
  timeout: 30000,
  waitFor: 2000
};

export async function scrapeContent(url: string, apiKey: string, options: ScrapeOptions) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        pageOptions: {
          onlyMainContent: true,
          includeHtml: false,
          waitFor: options.waitFor,
          screenshot: false
        },
        extractorOptions: {
          mode: 'llm-extraction',
          extractionPrompt: 'Extract recipe name, ingredients, instructions, and drink details from this social media post. Ignore app download prompts and navigation elements.'
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return { response, controller };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
