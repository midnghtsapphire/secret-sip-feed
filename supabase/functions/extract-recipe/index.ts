
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientId, defaultRateLimit } from './rate-limiting.ts';
import { isValidUrl, isDomainAllowed, sanitizeInput, validateRequest, defaultConfig } from './validation.ts';
import { scrapeContent, defaultScrapeOptions } from './scraping.ts';
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
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return createErrorResponse('Service configuration error - API key missing', '', 500);
    }

    console.log('Making Firecrawl request...');

    // Scrape content
    try {
      const { response: scrapeResponse } = await scrapeContent(sanitizedUrl, firecrawlApiKey, defaultScrapeOptions);

      console.log('Firecrawl response status:', scrapeResponse.status);

      if (!scrapeResponse.ok) {
        const errorText = await scrapeResponse.text();
        console.error('Firecrawl API error:', scrapeResponse.status, errorText);
        return createErrorResponse(
          'Unable to extract recipe content from this URL',
          'The social media platform may be blocking automated access or the content is not accessible.',
          502
        );
      }

      const scrapeData = await scrapeResponse.json();
      console.log('Firecrawl response success:', scrapeData.success);
      
      if (!scrapeData.success || !scrapeData.data?.content) {
        console.error('No content found in scrape response');
        return createErrorResponse(
          'No recipe content found at this URL',
          'The URL may not contain a recipe, or the content is not accessible to our scraper.',
          404
        );
      }

      // Process content
      const content = scrapeData.data.content.slice(0, 10000);
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
        imageUrl: scrapeData.data.metadata?.image || '/placeholder.svg',
        images: scrapeData.data.metadata?.image ? [scrapeData.data.metadata.image] : [],
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
