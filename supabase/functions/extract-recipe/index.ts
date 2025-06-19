
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    console.log('Processing URL:', url)

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Use a robust HTML fetching approach
    let htmlContent = ''
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      htmlContent = await response.text()
    } catch (error) {
      console.log('Direct fetch failed, trying alternative approach')
      // Fallback - return a basic structure so the app doesn't break
      return new Response(
        JSON.stringify({
          name: extractFromUrl(url),
          description: `Recipe imported from ${getDomain(url)}`,
          imageUrl: '/placeholder.svg',
          instructions: 'Please add the recipe details manually.',
          category: 'Pink Drinks',
          source: getDomain(url),
          originalUrl: url,
          tags: ['imported'],
          menuItems: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract content using multiple strategies
    const extractedData = extractRecipeData(htmlContent, url)
    
    console.log('Extracted data:', extractedData)
    
    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Processing failed',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function extractFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0)
    
    // Try to find meaningful parts
    for (const part of pathParts.reverse()) {
      if (part.length > 3 && !part.match(/^\d+$/)) {
        return part.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }
    }
    
    return 'Imported Recipe'
  } catch {
    return 'Imported Recipe'
  }
}

function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    if (hostname.includes('tiktok')) return 'TikTok'
    if (hostname.includes('instagram')) return 'Instagram'
    if (hostname.includes('lemon8')) return 'Lemon8'
    if (hostname.includes('youtube')) return 'YouTube'
    if (hostname.includes('pinterest')) return 'Pinterest'
    
    return hostname.replace('www.', '').split('.')[0]
  } catch {
    return 'Social Media'
  }
}

function extractRecipeData(html: string, url: string) {
  const cleanHtml = html.toLowerCase()
  
  // Extract title/name
  let name = extractFromUrl(url)
  const titleMatches = [
    /<title[^>]*>([^<]+)</i,
    /<h1[^>]*>([^<]+)</i,
    /<h2[^>]*>([^<]+)</i,
    /property="og:title"[^>]*content="([^"]+)"/i,
    /name="title"[^>]*content="([^"]+)"/i
  ]
  
  for (const regex of titleMatches) {
    const match = html.match(regex)
    if (match && match[1] && match[1].trim().length > 3) {
      name = match[1].trim()
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
      break
    }
  }

  // Extract description
  let description = `Recipe imported from ${getDomain(url)}`
  const descMatches = [
    /property="og:description"[^>]*content="([^"]+)"/i,
    /name="description"[^>]*content="([^"]+)"/i,
    /name="twitter:description"[^>]*content="([^"]+)"/i
  ]
  
  for (const regex of descMatches) {
    const match = html.match(regex)
    if (match && match[1] && match[1].trim().length > 10) {
      description = match[1].trim()
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
      break
    }
  }

  // Extract images
  const images = extractImages(html, url)
  
  // Extract content/instructions
  let instructions = extractInstructions(html, name)
  
  // Extract menu items
  const menuItems = extractMenuItems(html)
  
  // Determine category
  let category = 'Pink Drinks'
  const categoryKeywords = {
    'Pink Drinks': ['pink', 'strawberry', 'raspberry', 'cherry', 'rose'],
    'Blue Drinks': ['blue', 'butterfly', 'ocean', 'blueberry'],
    'Green Teas': ['green', 'matcha', 'tea', 'mint'],
    'Foam Experts': ['foam', 'latte', 'cappuccino', 'espresso'],
    'Budget Babe Brews': ['budget', 'cheap', 'affordable', 'diy'],
    'Viral Today': ['viral', 'trending', 'popular', 'tiktok']
  }
  
  const lowerName = name.toLowerCase()
  const lowerDesc = description.toLowerCase()
  
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerName.includes(keyword) || lowerDesc.includes(keyword))) {
      category = cat
      break
    }
  }

  // Generate tags
  const tags = generateTags(name, description, getDomain(url))

  return {
    name: cleanName(name),
    description: description,
    imageUrl: images[0] || '/placeholder.svg',
    images: images,
    instructions: instructions,
    category: category,
    source: getDomain(url),
    originalUrl: url,
    tags: tags,
    menuItems: menuItems
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  const imagePatterns = [
    /property="og:image"[^>]*content="([^"]+)"/gi,
    /name="twitter:image"[^>]*content="([^"]+)"/gi,
    /<img[^>]*src="([^"]+)"/gi,
    /background-image:\s*url\(["']?([^"')]+)["']?\)/gi
  ]

  for (const pattern of imagePatterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      let imageUrl = match[1]
      
      // Skip tiny images, icons, and placeholder images
      if (imageUrl.includes('icon') || 
          imageUrl.includes('logo') || 
          imageUrl.includes('avatar') ||
          imageUrl.includes('1x1') ||
          imageUrl.includes('placeholder')) {
        continue
      }
      
      // Make relative URLs absolute
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl
      } else if (imageUrl.startsWith('/')) {
        try {
          const base = new URL(baseUrl)
          imageUrl = base.origin + imageUrl
        } catch (e) {
          continue
        }
      } else if (!imageUrl.startsWith('http')) {
        continue
      }
      
      // Add if not already present
      if (!images.includes(imageUrl)) {
        images.push(imageUrl)
      }
      
      // Limit to 5 images
      if (images.length >= 5) break
    }
    if (images.length >= 5) break
  }

  return images
}

function extractInstructions(html: string, recipeName: string): string {
  // Look for content sections
  const contentPatterns = [
    /<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/gi,
    /<div[^>]*class="[^"]*recipe[^"]*"[^>]*>(.*?)<\/div>/gis,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis,
    /<article[^>]*>(.*?)<\/article>/gis,
    /<main[^>]*>(.*?)<\/main>/gis
  ]

  let instructions = `RECIPE: ${recipeName}\n\n`
  
  // Try to extract structured data first
  const scriptMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/gi)
  if (scriptMatches) {
    for (const scriptMatch of scriptMatches) {
      try {
        const jsonMatch = scriptMatch.match(/>([^<]+)</s)
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[1])
          if (data.recipeInstructions || data.description) {
            if (data.recipeInstructions) {
              instructions += 'INSTRUCTIONS:\n'
              data.recipeInstructions.forEach((step: any, index: number) => {
                const text = typeof step === 'string' ? step : step.text
                if (text) {
                  instructions += `${index + 1}. ${text}\n`
                }
              })
            }
            if (data.recipeIngredient) {
              instructions += '\nINGREDIENTS:\n'
              data.recipeIngredient.forEach((ingredient: string) => {
                instructions += `• ${ingredient}\n`
              })
            }
            return instructions
          }
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }

  // Extract text content
  const textContent = html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Look for recipe-like content
  const sentences = textContent.split(/[.!?]\s+/).filter(s => s.length > 20)
  const recipeSteps = sentences.filter(sentence => {
    const lower = sentence.toLowerCase()
    return lower.includes('add') || 
           lower.includes('mix') || 
           lower.includes('pour') || 
           lower.includes('stir') || 
           lower.includes('blend') ||
           lower.includes('cup') ||
           lower.includes('shot') ||
           lower.includes('pump')
  })

  if (recipeSteps.length > 0) {
    instructions += 'PREPARATION:\n'
    recipeSteps.slice(0, 5).forEach((step, index) => {
      instructions += `${index + 1}. ${step.trim()}.\n`
    })
  } else {
    instructions += 'PREPARATION:\n'
    instructions += 'Please refer to the original post for detailed preparation steps.\n'
  }

  return instructions
}

function extractMenuItems(html: string): Array<{name: string, type: string, quantity?: string}> {
  const menuItems: Array<{name: string, type: string, quantity?: string}> = []
  
  // Common Starbucks items and their types
  const itemTypes = {
    // Syrups
    'vanilla syrup': 'syrup',
    'caramel syrup': 'syrup', 
    'hazelnut syrup': 'syrup',
    'sugar free vanilla': 'syrup',
    'brown sugar syrup': 'syrup',
    'toffee nut syrup': 'syrup',
    
    // Milks
    'oat milk': 'milk',
    'almond milk': 'milk',
    'coconut milk': 'milk',
    'soy milk': 'milk',
    'whole milk': 'milk',
    '2% milk': 'milk',
    'nonfat milk': 'milk',
    
    // Bases
    'espresso': 'base',
    'cold brew': 'base',
    'pike place': 'base',
    'blonde espresso': 'base',
    
    // Add-ons
    'whipped cream': 'topping',
    'foam': 'topping',
    'extra shot': 'addon',
    'decaf': 'addon'
  }

  const text = html.toLowerCase()
  
  for (const [item, type] of Object.entries(itemTypes)) {
    if (text.includes(item)) {
      // Try to extract quantity
      const quantityPattern = new RegExp(`(\\d+)\\s*(?:pump[s]?|shot[s]?|oz)?\\s*(?:of\\s+)?${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
      const match = text.match(quantityPattern)
      
      menuItems.push({
        name: item.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: type,
        quantity: match ? `${match[1]} ${type === 'syrup' ? 'pumps' : type === 'base' ? 'shots' : ''}`.trim() : undefined
      })
    }
  }

  return menuItems
}

function generateTags(name: string, description: string, source: string): string[] {
  const tags = [source, 'imported']
  const text = (name + ' ' + description).toLowerCase()
  
  const tagKeywords = {
    'viral': ['viral', 'trending', 'popular'],
    'sweet': ['sweet', 'sugar', 'syrup'],
    'iced': ['iced', 'cold'],
    'hot': ['hot', 'warm'],
    'caffeine': ['espresso', 'coffee', 'shot'],
    'dairy-free': ['oat', 'almond', 'coconut', 'soy'],
    'seasonal': ['pumpkin', 'holiday', 'winter', 'summer']
  }
  
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag)
    }
  }
  
  return tags
}

function cleanName(name: string): string {
  return name
    .replace(/^(Recipe|How to make|DIY)\s*/i, '')
    .replace(/\s*(Recipe|Tutorial|DIY)\s*$/i, '')
    .replace(/[🍫🍓🎀✨💖🌈☕️🥤🧋🍹🍊🍋🥭🍓🫐🥝🍇🍑🍒🌸💕🎉🔥⭐️🌟💫🍪🧁🍰🎂]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
