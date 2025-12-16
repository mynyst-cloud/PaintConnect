import React from 'react';

// Comprehensive validation schemas for all entities
export const ValidationSchemas = {
  // User validation
  user: {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Geldig e-mailadres is verplicht"
    },
    phone: {
      required: false,
      pattern: /^[\+]?[0-9\-\(\)\s]+$/,
      message: "Geldig telefoonnummer vereist"
    },
    full_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: "Volledige naam is verplicht (2-100 karakters)"
    }
  },

  // Company validation
  company: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: "Bedrijfsnaam is verplicht (2-100 karakters)"
    },
    address: {
      required: true,
      minLength: 5,
      maxLength: 200,
      message: "Volledig adres is verplicht"
    },
    vat_number: {
      required: true,
      pattern: /^[A-Z0-9]{6,12}$/,
      message: "Geldig KvK/BTW nummer is verplicht"
    },
    email: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Geldig e-mailadres vereist"
    }
  },

  // Project validation
  project: {
    project_name: {
      required: true,
      minLength: 3,
      maxLength: 100,
      message: "Projectnaam is verplicht (3-100 karakters)"
    },
    client_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: "Klantnaam is verplicht"
    },
    client_email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Geldig klant e-mailadres is verplicht"
    },
    address: {
      required: true,
      minLength: 5,
      maxLength: 200,
      message: "Projectadres is verplicht"
    },
    estimated_hours: {
      required: false,
      type: 'number',
      min: 0,
      max: 10000,
      message: "Geschatte uren moeten tussen 0 en 10.000 liggen"
    }
  },

  // Material request validation
  materialRequest: {
    material_name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      message: "Materiaalnaam is verplicht"
    },
    quantity: {
      required: true,
      type: 'number',
      min: 0.1,
      max: 999999,
      message: "Hoeveelheid moet tussen 0,1 en 999.999 liggen"
    },
    project_id: {
      required: true,
      message: "Project selectie is verplicht"
    },
    supplier_id: {
      required: true,
      message: "Leverancier selectie is verplicht"
    }
  },

  // Damage report validation
  damage: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100,
      message: "Titel is verplicht (3-100 karakters)"
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 1000,
      message: "Beschrijving is verplicht (minimaal 10 karakters)"
    },
    project_id: {
      required: true,
      message: "Project selectie is verplicht"
    },
    category: {
      required: true,
      enum: ['materiaal_defect', 'schade_bestaand', 'nieuwe_schade', 'kwaliteit_probleem', 'veiligheid', 'anders'],
      message: "Categorie selectie is verplicht"
    }
  }
};

// Validation utility class
export class Validator {
  static validate(data, schema) {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(value, rules);
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors[0]; // Take first error
        isValid = false;
      }
    }

    return { isValid, errors };
  }

  static validateField(value, rules) {
    const errors = [];

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      errors.push(rules.message || 'Dit veld is verplicht');
      return errors; // If required and empty, skip other validations
    }

    // Skip other validations if value is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return errors;
    }

    // Type validation
    if (rules.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors.push(rules.message || 'Moet een geldig getal zijn');
        return errors;
      }
      
      // Min/Max for numbers
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(rules.message || `Minimum waarde is ${rules.min}`);
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(rules.message || `Maximum waarde is ${rules.max}`);
      }
    }

    // String validations
    if (typeof value === 'string') {
      // Length validations
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(rules.message || `Minimaal ${rules.minLength} karakters vereist`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(rules.message || `Maximaal ${rules.maxLength} karakters toegestaan`);
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(rules.message || 'Ongeldige format');
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(rules.message || 'Ongeldige waarde geselecteerd');
    }

    return errors;
  }

  // Sanitize input data
  static sanitize(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Trim whitespace and remove dangerous characters
        sanitized[key] = value.trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
          .replace(/javascript:/gi, '') // Remove javascript: URLs
          .replace(/on\w+\s*=/gi, ''); // Remove on* event handlers
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }


}

// Custom validation hook for forms
export function useFormValidation(schema, initialData = {}) {
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = React.useCallback((fieldName, value) => {
    const fieldRules = schema[fieldName];
    if (!fieldRules) return;

    const fieldErrors = Validator.validateField(value, fieldRules);
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors[0] || null
    }));
  }, [schema]);

  const touchField = React.useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  const validateForm = React.useCallback((data) => {
    const { isValid, errors: validationErrors } = Validator.validate(data, schema);
    setErrors(validationErrors);
    return isValid;
  }, [schema]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return {
    errors,
    touched,
    validateField,
    touchField,
    validateForm,
    clearErrors
  };
}

// Input sanitization for XSS prevention
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Rate limiting utility
export class RateLimiter {
  constructor(maxRequests = 60, windowMs = 60000) { // 60 requests per minute default
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old entries
    if (this.requests.has(key)) {
      const userRequests = this.requests.get(key).filter(timestamp => timestamp > windowStart);
      this.requests.set(key, userRequests);
    }

    const currentRequests = this.requests.get(key) || [];
    
    if (currentRequests.length >= this.maxRequests) {
      return false;
    }

    currentRequests.push(now);
    this.requests.set(key, currentRequests);
    return true;
  }

  getRemainingRequests(key) {
    const currentRequests = this.requests.get(key) || [];
    return Math.max(0, this.maxRequests - currentRequests.length);
  }

  getTimeUntilReset(key) {
    const currentRequests = this.requests.get(key) || [];
    if (currentRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...currentRequests);
    const resetTime = oldestRequest + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }
}

export const globalRateLimiter = new RateLimiter();