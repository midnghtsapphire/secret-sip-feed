
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
}

export async function runApifyActor(actorId: string, runInput: ApifyRunInput, apiToken: string, options: ApifyRunOptions) {
  // Start the Apify actor run
  const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(runInput)
  });

  if (!runResponse.ok) {
    throw new Error(`Failed to start Apify run: ${runResponse.status}`);
  }

  const runData = await runResponse.json();
  const runId = runData.data.id;

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
    }
    
    attempts++;
  }

  if (runStatus !== 'SUCCEEDED') {
    throw new Error(`Apify run failed with status: ${runStatus}`);
  }

  // Get results
  const resultsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items`, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    }
  });

  if (!resultsResponse.ok) {
    throw new Error(`Failed to get results: ${resultsResponse.status}`);
  }

  return await resultsResponse.json();
}

export function getActorIdForPlatform(url: string): { actorId: string; runInput: ApifyRunInput } {
  if (url.includes('instagram')) {
    return {
      actorId: 'shu8hvrXbJbY3Eb9W', // Instagram Scraper
      runInput: {
        directUrls: [url],
        resultsType: 'posts',
        resultsLimit: 1,
        searchType: 'hashtag',
        searchLimit: 1
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
  } else {
    return {
      actorId: 'A3ugHq174iKd7kG4F', // Web Scraper
      runInput: {
        startUrls: [{ url }],
        maxRequestRetries: 3,
        maxPages: 1
      }
    };
  }
}

export function extractContentFromApifyResult(result: any, url: string): string {
  if (url.includes('instagram')) {
    return result.caption || result.text || '';
  } else if (url.includes('tiktok')) {
    return result.text || result.description || '';
  } else {
    return result.text || result.content || '';
  }
}
