
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientId, defaultRateLimit } from './rate-limiting.ts';
import { isValidUrl, isDomainAllowed, sanitizeInput, validateRequest, defaultConfig } from './validation.ts';
import { extractRecipeName, extractDescription, extractCategory, extractInstructions, extractTags, getDomainFromUrl } from './content-extraction.ts';
import { isAppRedirectContent, isValidRecipeName } from './content-validation.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse, handleOptionsRequest } from './http-utils.ts';
import { runApifyActor, getActorIdForPlatform, extractContentFromApifyResult, defaultApifyOptions } from './scraping.ts';

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
      const { actorId, runInput } = getActorIdForPlatform(sanitizedUrl);
      console.log('Using actor ID:', actorId);
      console.log('Run input:', JSON.stringify(runInput, null, 2));

      const results = await runApifyActor(actorId, runInput, apifyApiToken, defaultApifyOptions);
      console.log('Apify results received, count:', results.length);
      
      // Log the actual results structure to help debug
      if (results && results.length > 0) {
        console.log('First result keys:', Object.keys(results[0]));
        console.log('First result sample:', JSON.stringify(results[0], null, 2).slice(0, 500));
      }

      if (!results || results.length === 0) {
        console.error('No results found from Apify actor');
        return createErrorResponse(
          'No content found at this URL',
          'The Apify actor returned no results. The URL may not contain accessible content.',
          404
        );
      }

      // Process the first result
      const firstResult = results[0];
      const content = extractContentFromApifyResult(firstResult, sanitizedUrl);

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

      console.log('Recipe extracted:', { 
        name: recipe.name, 
        category: recipe.category, 
        hasInstructions: !!recipe.instructions,
        hasImages: recipe.images.length 
      });

      // Validate extracted content
      if (!isValidRecipeName(recipe.name)) {
        console.error('Could not extract valid recipe name from content');
        console.error('Extracted name was:', recipe.name);
        console.error('Content that was processed:', content.slice(0, 500));
        return createErrorResponse(
          'No valid recipe found in the content',
          'The URL does not appear to contain a recognizable recipe. Please try a different URL or manually enter the recipe details.',
          422
        );
      }

      console.log('Returning successful recipe extraction');
      return createSuccessResponse(recipe);

    } catch (error) {
      console.error('Scraping error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        return createErrorResponse(
          'Request timeout',
          'The website took too long to respond. Please try again or use a different URL.',
          408
        );
      }
      
      // Return the actual error instead of generic messages
      const errorMessage = error.message || 'Unknown error occurred during scraping';
      console.error('Returning scraping error:', errorMessage);
      return createErrorResponse(
        'Scraping failed',
        `Apify actor error: ${errorMessage}`,
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
