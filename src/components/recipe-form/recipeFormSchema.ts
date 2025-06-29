
import * as z from 'zod';
import { 
  validateRecipeName, 
  validateRecipeDescription, 
  validateRecipeInstructions,
  validateRecipeTags 
} from '@/utils/inputValidation';

// Valid categories from database enum
const validCategories = [
  'Pink Drinks',
  'Blue Drinks', 
  'Green Teas',
  'Foam Experts',
  'Budget Babe Brews',
  'Viral Today',
  'Caramel Dreams',
  'Merry Mocha',
  'Expresso'
] as const;

export const formSchema = z.object({
  name: z.string()
    .min(2, 'Recipe name must be at least 2 characters')
    .max(100, 'Recipe name must be less than 100 characters')
    .refine((val) => validateRecipeName(val).isValid, {
      message: 'Recipe name contains invalid characters'
    }),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .refine((val) => validateRecipeDescription(val).isValid, {
      message: 'Description contains invalid content'
    }),
  category: z.enum(validCategories, {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  basePrice: z.number().min(0, 'Price must be positive').max(50, 'Price seems too high'),
  prepTimeMinutes: z.number().min(1, 'Prep time must be at least 1 minute').max(480, 'Prep time seems too long'),
  difficultyLevel: z.number().min(1).max(5),
  instructions: z.string()
    .max(2000, 'Instructions must be less than 2000 characters')
    .refine((val) => validateRecipeInstructions(val).isValid, {
      message: 'Instructions contain invalid content'
    }),
  tags: z.string(),
  isPublic: z.boolean().default(false),
});

export type FormData = z.infer<typeof formSchema>;
