import { NextRequest } from "next/server"
import { body, query, param, validationResult, ValidationChain } from "express-validator"
import { createErrorResponse } from "@/lib/security/error-handler"

// Express validator middleware adapter for Next.js
export async function runValidation(
  req: NextRequest,
  validations: ValidationChain[]
): Promise<{ isValid: boolean; errors?: any; response?: any }> {
  try {
    // Create a mock Express request object
    const mockReq = {
      body: await req.json(),
      query: Object.fromEntries(new URL(req.url).searchParams),
      params: {}, // Will be set by caller if needed
      headers: Object.fromEntries(req.headers.entries()),
    }

    // Run validations
    await Promise.all(validations.map(validation => validation.run(mockReq)))

    const errors = validationResult(mockReq)
    if (!errors.isEmpty()) {
      return {
        isValid: false,
        errors: errors.array(),
        response: createErrorResponse(
          "Validation failed",
          400,
          undefined,
          { fields: errors.array() }
        )
      }
    }

    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      errors: [{ msg: "Validation processing failed" }],
      response: createErrorResponse("Validation error", 500)
    }
  }
}

// Enhanced validation schemas using express-validator
export const authValidation = {
  register: [
    body('name')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2-50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Name contains invalid characters')
      .trim()
      .escape(),
    
    body('email')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email too long')
      .custom((value) => {
        // Additional security checks
        if (value.includes('<') || value.includes('>') || value.includes('"')) {
          throw new Error('Email contains invalid characters')
        }
        return true
      }),
    
    body('password')
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6-128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      .custom((value) => {
        // Check for common patterns
        const commonPatterns = [
          /password/i, /123456/, /qwerty/i, /admin/i,
          /letmein/i, /welcome/i, /monkey/i
        ]
        
        for (const pattern of commonPatterns) {
          if (pattern.test(value)) {
            throw new Error('Password contains common patterns')
          }
        }
        return true
      }),
    
    body('role')
      .optional()
      .isIn(['admin', 'user', 'manager'])
      .withMessage('Invalid role'),
    
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Invalid phone number format')
      .trim(),
    
    body('department')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Department name too long')
      .matches(/^[a-zA-Z0-9\s&.-]+$/)
      .withMessage('Department contains invalid characters')
      .trim()
      .escape(),
  ],

  login: [
    body('email')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email too long'),
    
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
      .isLength({ max: 128 })
      .withMessage('Password too long'),
  ],
}

export const userValidation = {
  create: authValidation.register,
  
  update: [
    body('name')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2-50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Name contains invalid characters')
      .trim()
      .escape(),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail()
      .isLength({ max: 255 })
      .withMessage('Email too long'),
    
    body('role')
      .optional()
      .isIn(['admin', 'user', 'manager'])
      .withMessage('Invalid role'),
    
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Invalid phone number format')
      .trim(),
    
    body('department')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Department name too long')
      .matches(/^[a-zA-Z0-9\s&.-]+$/)
      .withMessage('Department contains invalid characters')
      .trim()
      .escape(),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],

  search: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1-100')
      .toInt(),
    
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Search term too long')
      .matches(/^[a-zA-Z0-9\s@.-]+$/)
      .withMessage('Search contains invalid characters')
      .trim()
      .escape(),
    
    query('sortBy')
      .optional()
      .isIn(['name', 'email', 'role', 'department', 'createdAt', 'updatedAt', 'isActive'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
  ],

  id: [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID format')
      .customSanitizer((value) => value.trim()),
  ],
}

// Utility to combine validations
export function combineValidations(...validationArrays: ValidationChain[][]): ValidationChain[] {
  return validationArrays.flat()
}

// Rate limiting validation
export const rateLimitValidation = {
  // For checking if rate limit headers are present
  checkRateLimit: (req: NextRequest) => {
    const remaining = req.headers.get('x-ratelimit-remaining')
    const limit = req.headers.get('x-ratelimit-limit')
    
    if (remaining && parseInt(remaining) <= 0) {
      throw new Error('Rate limit exceeded')
    }
    
    return true
  }
}