
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
    console.log('=== RECIPE EXTRACTION REQUEST START ===');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Request size validation
    if (!validateRequest(req.headers.get('content-length'), defaultConfig.maxRequestSize)) {
      console.error('❌ Request too large');
      return createErrorResponse('Request too large', '', 413);
    }

    // Rate limiting
    const clientId = getClientId(req);
    if (!checkRateLimit(clientId, defaultRateLimit)) {
      console.error('❌ Rate limit exceeded for client:', clientId);
      return createErrorResponse('Rate limit exceeded', '', 429);
    }

    // Parse request body
    let body;
    try {
      const rawBody = await req.text();
      console.log('📥 Raw request body:', rawBody);
      body = JSON.parse(rawBody);
      console.log('📋 Parsed request body:', body);
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e);
      return createErrorResponse('Invalid JSON in request body');
    }

    const { url } = body;
    console.log('🔍 Processing URL:', url);

    // Input validation
    if (!url || typeof url !== 'string') {
      console.error('❌ Invalid URL provided:', url);
      return createErrorResponse('URL is required and must be a string');
    }

    const sanitizedUrl = sanitizeInput(url);
    console.log('🧹 Sanitized URL:', sanitizedUrl);

    if (!isValidUrl(sanitizedUrl)) {
      console.error('❌ Invalid URL format:', sanitizedUrl);
      return createErrorResponse('Invalid URL format');
    }

    if (!isDomainAllowed(sanitizedUrl, defaultConfig.allowedDomains)) {
      console.error('❌ Domain not allowed:', sanitizedUrl);
      return createErrorResponse(
        'Domain not allowed. Supported platforms: TikTok, Instagram, Lemon8, YouTube, Twitter/X',
        '',
        403
      );
    }

    // Get API key
    const apifyApiToken = Deno.env.get('APIFY_API_TOKEN');
    console.log('🔑 API Token status:', apifyApiToken ? 'Present' : 'Missing');
    if (!apifyApiToken) {
      console.error('❌ APIFY_API_TOKEN not configured');
      return createErrorResponse('Service configuration error - API key missing', '', 500);
    }

    console.log('🚀 Starting Apify extraction...');

    // Extract content using Apify
    try {
      const { actorId, runInput } = getActorIdForPlatform(sanitizedUrl);
      console.log('🎭 Using actor ID:', actorId);
      console.log('📝 Run input:', JSON.stringify(runInput, null, 2));

      const results = await runApifyActor(actorId, runInput, apifyApiToken, defaultApifyOptions);
      console.log('✅ Apify results received');
      console.log('📊 Results count:', results.length);
      console.log('🔍 Raw results:', JSON.stringify(results, null, 2));
      
      if (!results || results.length === 0) {
        console.error('❌ No results from Apify actor');
        console.log('📋 Actor details - ID:', actorId, 'Input:', runInput);
        return createErrorResponse(
          'No content found',
          `Apify actor ${actorId} returned no results. This could mean:\n1. The URL content is not accessible\n2. The social media post is private\n3. The actor configuration needs adjustment\n4. Rate limiting by the platform`,
          404
        );
      }

      // Process the first result
      const firstResult = results[0];
      console.log('🎯 Processing first result:', Object.keys(firstResult));
      console.log('📄 First result content preview:', JSON.stringify(firstResult, null, 2).slice(0, 1000));
      
      const content = extractContentFromApifyResult(firstResult, sanitizedUrl);
      console.log('📝 Extracted content length:', content.length);
      console.log('📖 Content preview:', content.substring(0, 500));
      
      // Check for app redirect content
      if (isAppRedirectContent(content)) {
        console.error('❌ Content is app redirect page');
        return createErrorResponse(
          'App redirect detected',
          'The URL appears to redirect to an app download page. Try using a direct link to the content instead.',
          422
        );
      }

      // Extract recipe data
      const recipeName = extractRecipeName(content);
      console.log('🏷️ Extracted recipe name:', recipeName);
      
      const recipe = {
        name: recipeName,
        description: extractDescription(content),
        category: extractCategory(content),
        instructions: extractInstructions(content),
        tags: extractTags(content),
        imageUrl: firstResult.displayUrl || firstResult.imageUrl || firstResult.images?.[0] || '/placeholder.svg',
        images: firstResult.images || (firstResult.imageUrl ? [firstResult.imageUrl] : []),
        source: getDomainFromUrl(sanitizedUrl),
        originalUrl: sanitizedUrl
      };

      console.log('🍽️ Final recipe data:', {
        name: recipe.name,
        hasDescription: !!recipe.description,
        category: recipe.category,
        hasInstructions: !!recipe.instructions,
        tagCount: recipe.tags.length,
        imageCount: recipe.images.length
      });

      // Validate extracted content
      if (!isValidRecipeName(recipe.name)) {
        console.error('❌ Invalid recipe name extracted');
        console.error('📝 Raw content for debugging:', content.slice(0, 1000));
        console.error('🎭 Actor used:', actorId);
        console.error('📋 Full result structure:', Object.keys(firstResult));
        return createErrorResponse(
          'No valid recipe content found',
          `Could not extract a valid recipe name from the content. Debug info:\n- Actor: ${actorId}\n- Content length: ${content.length}\n- Result keys: ${Object.keys(firstResult).join(', ')}\n- Content preview: ${content.slice(0, 200)}...`,
          422
        );
      }

      console.log('✅ Recipe extraction successful');
      return createSuccessResponse(recipe);

    } catch (error) {
      console.error('💥 Apify scraping error:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      
      if (error.name === 'AbortError') {
        return createErrorResponse(
          'Request timeout',
          'The extraction request timed out. This usually means the target website is taking too long to respond.',
          408
        );
      }
      
      // Return detailed error information for debugging
      return createErrorResponse(
        'Extraction failed',
        `Apify actor error: ${error.message}\n\nDebug info:\n- Error type: ${error.name}\n- Stack trace: ${error.stack?.split('\n').slice(0, 3).join('\n')}`,
        500
      );
    }

  } catch (error) {
    console.error('💥 Unexpected server error:', error);
    console.error('🔍 Full error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return createErrorResponse(
      'Internal server error',
      `Unexpected error: ${error.message}`,
      500
    );
  }
});
