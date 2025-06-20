
// Apify integration utilities
export interface ApifyRunOptions {
  timeout: number;
  maxAttempts: number;
}

export const defaultApifyOptions: ApifyRunOptions = {
  timeout: 30000,
  maxAttempts: 30
};

export interface ApifyRunInput {
  directUrls?: string[];
  postURLs?: string[];
  startUrls?: Array<{ url: string }>;
  resultsType?: string;
  resultsLimit?: number;
  searchType?: string;
  searchLimit?: number;
  maxItems?: number;
  maxRequestRetries?: number;
  maxPages?: number;
  waitUntil?: string;
  pageFunction?: string;
}

export async function runApifyActor(actorId: string, runInput: ApifyRunInput, apiToken: string, options: ApifyRunOptions) {
  console.log('Starting Apify actor run with ID:', actorId);
  
  // Start the Apify actor run
  const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(runInput)
  });

  console.log('Apify run response status:', runResponse.status);

  if (!runResponse.ok) {
    const errorText = await runResponse.text();
    console.error('Apify run failed:', errorText);
    throw new Error(`Failed to start Apify run: ${runResponse.status} - ${errorText}`);
  }

  const runData = await runResponse.json();
  const runId = runData.data.id;
  console.log('Apify run started with ID:', runId);

  // Wait for completion
  let attempts = 0;
  let runStatus = 'RUNNING';

  while (runStatus === 'RUNNING' && attempts < options.maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      runStatus = statusData.data.status;
      console.log('Run status check:', runStatus, 'attempt:', attempts + 1);
    }
    
    attempts++;
  }

  if (runStatus !== 'SUCCEEDED') {
    console.error('Run final status:', runStatus);
    throw new Error(`Apify run failed with status: ${runStatus}`);
  }

  // Get results from the default dataset
  const resultsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    }
  });

  console.log('Results response status:', resultsResponse.status);

  if (!resultsResponse.ok) {
    const errorText = await resultsResponse.text();
    console.error('Failed to get results:', errorText);
    throw new Error(`Failed to get results: ${resultsResponse.status} - ${errorText}`);
  }

  const results = await resultsResponse.json();
  console.log('Results retrieved successfully, count:', results.length);
  
  return results;
}

export function getActorIdForPlatform(url: string): { actorId: string; runInput: ApifyRunInput } {
  console.log('Determining actor for URL:', url);
  
  if (url.includes('instagram')) {
    return {
      actorId: 'shu8hvrXbJbY3Eb9W', // Instagram Scraper
      runInput: {
        directUrls: [url],
        resultsType: 'posts',
        resultsLimit: 1
      }
    };
  } else if (url.includes('tiktok')) {
    return {
      actorId: 'OtzYfK1ndEGdwWFKQ', // TikTok Scraper
      runInput: {
        postURLs: [url],
        maxItems: 1
      }
    };
  } else if (url.includes('lemon8')) {
    // For Lemon8, use a working web scraper with better configuration
    return {
      actorId: 'aYG0l9s7dbB7j3gbS', // Website Content Crawler - a more reliable general scraper
      runInput: {
        startUrls: [{ url }],
        maxRequestRetries: 3,
        maxPages: 1,
        waitUntil: 'networkidle',
        pageFunction: `async function pageFunction(context) {
          const { page, request } = context;
          const title = await page.title();
          const content = await page.evaluate(() => {
            return document.body.innerText || document.body.textContent || '';
          });
          
          return {
            url: request.url,
            title: title,
            text: content,
            content: content
          };
        }`
      }
    };
  } else {
    return {
      actorId: 'aYG0l9s7dbB7j3gbS', // Website Content Crawler
      runInput: {
        startUrls: [{ url }],
        maxRequestRetries: 3,
        maxPages: 1,
        waitUntil: 'networkidle'
      }
    };
  }
}

export function extractContentFromApifyResult(result: any, url: string): string {
  console.log('Extracting content from result for URL:', url);
  console.log('Result keys:', Object.keys(result));
  console.log('Result content preview:', JSON.stringify(result, null, 2).slice(0, 500));
  
  if (url.includes('instagram')) {
    return result.caption || result.text || result.description || '';
  } else if (url.includes('tiktok')) {
    return result.text || result.description || result.caption || '';
  } else if (url.includes('lemon8')) {
    return result.text || result.content || result.description || result.caption || result.title || '';
  } else {
    return result.text || result.content || result.description || result.title || '';
  }
}
