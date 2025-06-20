
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientId, defaultRateLimit } from './rate-limiting.ts';
import { isValidUrl, isDomainAllowed, sanitizeInput, validateRequest, defaultConfig } from './validation.ts';
import { extractRecipeName, extractDescription, extractCategory, extractInstructions, extractTags, getDomainFromUrl } from './content-extraction.ts';
import { isAppRedirectContent, isValidRecipeName } from './content-validation.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse, handleOptionsRequest } from './http-utils.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    console.log('Starting recipe extraction request');

    // Request size validation
    if (!validateRequest(req.headers.get('content-length'), defaultConfig.maxRequestSize)) {
      console.error('Request too large');
      return createErrorResponse('Request too large', '', 413);
    }

    // Rate limiting
    const clientId = getClientId(req);
    if (!checkRateLimit(clientId, defaultRateLimit)) {
      console.error('Rate limit exceeded for client:', clientId);
      return createErrorResponse('Rate limit exceeded', '', 429);
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body received:', { url: body?.url ? 'URL present' : 'No URL' });
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return createErrorResponse('Invalid JSON in request body');
    }

    const { url } = body;

    // Input validation
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided:', url);
      return createErrorResponse('URL is required and must be a string');
    }

    const sanitizedUrl = sanitizeInput(url);
    console.log('Processing URL:', sanitizedUrl);

    if (!isValidUrl(sanitizedUrl)) {
      console.error('Invalid URL format:', sanitizedUrl);
      return createErrorResponse('Invalid URL format');
    }

    if (!isDomainAllowed(sanitizedUrl, defaultConfig.allowedDomains)) {
      console.error('Domain not allowed:', sanitizedUrl);
      return createErrorResponse(
        'Domain not allowed. Supported platforms: TikTok, Instagram, Lemon8, YouTube, Twitter/X',
        '',
        403
      );
    }

    // Get API key
    const apifyApiToken = Deno.env.get('APIFY_API_TOKEN');
    if (!apifyApiToken) {
      console.error('APIFY_API_TOKEN not configured');
      return createErrorResponse('Service configuration error - API key missing', '', 500);
    }

    console.log('Making Apify request...');

    // Extract content using Apify
    try {
      // Determine which Apify actor to use based on the platform
      let actorId = '';
      let runInput = {};

      if (sanitizedUrl.includes('instagram')) {
        actorId = 'shu8hvrXbJbY3Eb9W'; // Instagram Scraper
        runInput = {
          directUrls: [sanitizedUrl],
          resultsType: 'posts',
          resultsLimit: 1,
          searchType: 'hashtag',
          searchLimit: 1
        };
      } else if (sanitizedUrl.includes('tiktok')) {
        actorId = 'OtzYfK1ndEGdwWFKQ'; // TikTok Scraper
        runInput = {
          postURLs: [sanitizedUrl],
          maxItems: 1
        };
      } else {
        // For other platforms, use a general web scraper
        actorId = 'A3ugHq174iKd7kG4F'; // Web Scraper
        runInput = {
          startUrls: [{ url: sanitizedUrl }],
          maxRequestRetries: 3,
          maxPages: 1
        };
      }

      // Start the Apify actor run
      const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apifyApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(runInput)
      });

      if (!runResponse.ok) {
        console.error('Failed to start Apify run:', runResponse.status);
        return createErrorResponse(
          'Unable to extract recipe content from this URL',
          'The social media platform may be blocking automated access or the content is not accessible.',
          502
        );
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;
      console.log('Apify run started:', runId);

      // Wait for the run to complete (with timeout)
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      let runStatus = 'RUNNING';

      while (runStatus === 'RUNNING' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${apifyApiToken}`,
          }
        });

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          runStatus = statusData.data.status;
          console.log('Run status:', runStatus);
        }
        
        attempts++;
      }

      if (runStatus !== 'SUCCEEDED') {
        console.error('Apify run did not succeed:', runStatus);
        return createErrorResponse(
          'Extraction timeout or failed',
          'The extraction took too long or failed. Please try again or use a different URL.',
          408
        );
      }

      // Get the results
      const resultsResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items`, {
        headers: {
          'Authorization': `Bearer ${apifyApiToken}`,
        }
      });

      if (!resultsResponse.ok) {
        console.error('Failed to get Apify results:', resultsResponse.status);
        return createErrorResponse(
          'Failed to retrieve extraction results',
          'Unable to get the extracted data from the scraping service.',
          502
        );
      }

      const results = await resultsResponse.json();
      console.log('Apify results received, count:', results.length);

      if (!results || results.length === 0) {
        console.error('No results found');
        return createErrorResponse(
          'No recipe content found at this URL',
          'The URL may not contain a recipe, or the content is not accessible to our scraper.',
          404
        );
      }

      // Process the first result
      const firstResult = results[0];
      let content = '';

      // Extract content based on platform
      if (sanitizedUrl.includes('instagram')) {
        content = firstResult.caption || firstResult.text || '';
      } else if (sanitizedUrl.includes('tiktok')) {
        content = firstResult.text || firstResult.description || '';
      } else {
        content = firstResult.text || firstResult.content || '';
      }

      console.log('Content extracted, length:', content.length);
      console.log('Content preview:', content.substring(0, 300));
      
      // Check for app redirect content
      if (isAppRedirectContent(content)) {
        console.error('Content appears to be app download redirect page');
        return createErrorResponse(
          'Unable to access recipe content',
          'This URL redirects to an app download page. Social media platforms often block direct access to content. Try sharing a different URL or manually entering the recipe details.',
          422
        );
      }

      // Extract recipe data
      const recipe = {
        name: extractRecipeName(content),
        description: extractDescription(content),
        category: extractCategory(content),
        instructions: extractInstructions(content),
        tags: extractTags(content),
        imageUrl: firstResult.displayUrl || firstResult.imageUrl || firstResult.images?.[0] || '/placeholder.svg',
        images: firstResult.images || (firstResult.imageUrl ? [firstResult.imageUrl] : []),
        source: getDomainFromUrl(sanitizedUrl),
        originalUrl: sanitizedUrl
      };

      console.log('Recipe extracted:', { name: recipe.name, category: recipe.category, hasInstructions: !!recipe.instructions });

      // Validate extracted content
      if (!isValidRecipeName(recipe.name)) {
        console.error('Could not extract valid recipe name from content');
        return createErrorResponse(
          'No valid recipe found in the content',
          'The URL does not appear to contain a recognizable recipe. Please try a different URL or manually enter the recipe details.',
          422
        );
      }

      console.log('Returning successful recipe extraction');
      return createSuccessResponse(recipe);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        return createErrorResponse(
          'Request timeout',
          'The website took too long to respond. Please try again or use a different URL.',
          408
        );
      }
      
      console.error('Scraping error:', error);
      return createErrorResponse(
        'Failed to extract recipe',
        'Unable to access the content at this URL. The social media platform may be blocking automated access.',
        500
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return createErrorResponse(
      'Internal server error',
      'An unexpected error occurred while processing your request.',
      500
    );
  }
});
