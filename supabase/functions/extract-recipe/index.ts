
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkRateLimit, getClientId, defaultRateLimit } from './rate-limiting.ts';
import { isValidUrl, isDomainAllowed, sanitizeInput, validateRequest, defaultConfig } from './validation.ts';
import { extractRecipeName, extractDescription, extractCategory, extractInstructions, extractTags, getDomainFromUrl } from './content-extraction.ts';
import { isAppRedirectContent, isValidRecipeName } from './content-validation.ts';
import { corsHeaders, createErrorResponse, createSuccessResponse, handleOptionsRequest } from './http-utils.ts';
import { runApifyActor, getActorIdForPlatform, extractContentFromApifyResult, extractCommentsFromApifyResult, extractImageFromApifyResult, defaultApifyOptions } from './scraping.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleOptionsRequest();
  }

  try {
    console.log('=== RECIPE EXTRACTION REQUEST START ===');
    console.log('Request method:', req.method);

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
      
      if (!results || results.length === 0) {
        console.error('❌ No results from Apify actor');
        return createErrorResponse(
          'No content found',
          `Could not extract content from this URL. The post may be private, deleted, or the platform may be blocking automated access. Please try a different URL.`,
          404
        );
      }

      // Process the first result
      const firstResult = results[0];
      console.log('🎯 Processing first result:', Object.keys(firstResult));
      
      const content = extractContentFromApifyResult(firstResult, sanitizedUrl);
      console.log('📝 Extracted content length:', content.length);
      console.log('📖 Content preview:', content.substring(0, 300));
      
      // Extract comments for additional recipe information
      const comments = extractCommentsFromApifyResult(firstResult, sanitizedUrl);
      console.log('💬 Extracted comments count:', comments.length);
      
      // Extract image using improved method
      const extractedImage = extractImageFromApifyResult(firstResult, sanitizedUrl);
      console.log('🖼️ Extracted image:', extractedImage);
      
      // Check for app redirect content
      if (isAppRedirectContent(content)) {
        console.error('❌ Content is app redirect page');
        return createErrorResponse(
          'App redirect detected',
          'The URL appears to redirect to an app download page. Try using a direct link to the content instead.',
          422
        );
      }

      // Check for insufficient content
      if (content.length < 10) {
        console.error('❌ Insufficient content extracted');
        return createErrorResponse(
          'Insufficient content',
          'Very little content was extracted from this URL. The post may not contain recipe information or may not be publicly accessible.',
          422
        );
      }

      // Extract recipe data with comments support
      const recipeName = extractRecipeName(content, comments);
      console.log('🏷️ Extracted recipe name:', recipeName);
      
      const recipe = {
        name: recipeName,
        description: extractDescription(content, comments),
        category: extractCategory(content, comments),
        instructions: extractInstructions(content, comments),
        tags: extractTags(content, comments),
        imageUrl: extractedImage,
        images: extractedImage !== '/placeholder.svg' ? [extractedImage] : [],
        source: getDomainFromUrl(sanitizedUrl),
        originalUrl: sanitizedUrl
      };

      console.log('🍽️ Final recipe data:', {
        name: recipe.name,
        hasDescription: !!recipe.description,
        category: recipe.category,
        hasInstructions: !!recipe.instructions,
        tagCount: recipe.tags.length,
        imageCount: recipe.images.length,
        hasImage: recipe.imageUrl !== '/placeholder.svg',
        commentsUsed: comments.length > 0
      });

      // More lenient validation - accept any meaningful name
      if (!recipe.name || recipe.name.length < 3) {
        console.error('❌ Could not extract recipe name');
        return createErrorResponse(
          'No recipe name found',
          `Could not extract a recipe name from the content. Please ensure the URL contains recipe information.`,
          422
        );
      }

      console.log('✅ Recipe extraction successful');
      return createSuccessResponse(recipe);

    } catch (error) {
      console.error('💥 Apify scraping error:', error);
      
      if (error.name === 'AbortError') {
        return createErrorResponse(
          'Request timeout',
          'The extraction request timed out. Please try again.',
          408
        );
      }
      
      return createErrorResponse(
        'Extraction failed',
        `Could not extract recipe from this URL: ${error.message}. Please try a different URL or check if the post is publicly accessible.`,
        500
      );
    }

  } catch (error) {
    console.error('💥 Unexpected server error:', error);
    return createErrorResponse(
      'Internal server error',
      `Server error: ${error.message}`,
      500
    );
  }
});
