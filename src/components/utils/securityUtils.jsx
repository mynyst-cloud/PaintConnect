
// Row Level Security (RLS) enforcement
export class SecurityManager {
  static async enforceCompanyAccess(entityData, currentUser) {
    if (!currentUser || !currentUser.company_id) {
      throw new Error('Gebruiker niet geauthenticeerd');
    }

    // For company-scoped entities, ensure company_id matches
    if (entityData.company_id && entityData.company_id !== currentUser.company_id) {
      throw new Error('Toegang geweigerd: Onvoldoende rechten');
    }

    return true;
  }

  static async enforceUserRole(requiredRole, currentUser) {
    if (!currentUser) {
      throw new Error('Gebruiker niet geauthenticeerd');
    }

    const roleHierarchy = {
      'painter': 1,
      'helpdesk': 2,
      'admin': 3
    };

    const userRoleLevel = roleHierarchy[currentUser.company_role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 999;

    if (userRoleLevel < requiredRoleLevel) {
      throw new Error('Onvoldoende rechten voor deze actie');
    }

    return true;
  }

  static validateEntityAccess(entity, operation, currentUser) {
    const accessRules = {
      'Project': {
        read: ['painter', 'helpdesk', 'admin'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin']
      },
      'MaterialRequest': {
        read: ['painter', 'helpdesk', 'admin'],
        create: ['painter', 'helpdesk', 'admin'],
        update: ['helpdesk', 'admin'],
        delete: ['admin']
      },
      'Damage': {
        read: ['painter', 'helpdesk', 'admin'],
        create: ['painter', 'helpdesk', 'admin'],
        update: ['helpdesk', 'admin'],
        delete: ['admin']
      },
      'User': {
        read: ['helpdesk', 'admin'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin']
      },
      'Company': {
        read: ['admin'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin']
      }
    };

    const entityRules = accessRules[entity];
    if (!entityRules) return true; // Default allow for undefined entities

    const allowedRoles = entityRules[operation];
    if (!allowedRoles) return false;

    return allowedRoles.includes(currentUser.company_role);
  }

  static async auditLog(action, entity, entityId, currentUser, changes = {}) {
    try {
      const auditEntry = {
        user_id: currentUser.id,
        user_email: currentUser.email,
        company_id: currentUser.company_id,
        action,
        entity_type: entity,
        entity_id: entityId,
        changes: JSON.stringify(changes),
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // In real implementation, save to AuditLog entity
      console.log('Audit Log:', auditEntry);
      
      // FIX: Removed the check for 'process.env.NODE_ENV' as it's not available in the browser.
      // The console.table was for debugging and is not critical.

      return auditEntry;
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  static async getClientIP() {
    try {
      // In production, this would come from server-side
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Prevent SQL injection and NoSQL injection
  static sanitizeQueryParams(params) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Remove potential injection patterns
        sanitized[key] = value
          .replace(/(\$where|\$regex|\$gt|\$lt|\$ne)/gi, '')
          .replace(/('|"|;|--|\*|\/\*|\*\/)/g, '')
          .trim();
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeQueryParams(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  // Session management
  static isSessionValid(user) {
    if (!user || !user.created_date) return false;
    
    // Sessions expire after 24 hours
    const sessionAge = Date.now() - new Date(user.created_date).getTime();
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return sessionAge < maxSessionAge;
  }

  // CSP (Content Security Policy) headers - for server implementation
  static getCSPHeaders() {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Unsafe in production
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://api.ipify.org",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    };
  }
}

// Encryption utilities (for sensitive data) - NOW USES BACKEND FUNCTIONS
import { encryptData } from '@/api/functions';
import { decryptData } from '@/api/functions';

export class EncryptionUtils {
  static async hashPassword(password) {
    // This is a client-side utility and remains as is.
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async generateSecureToken() {
    // This is a client-side utility and remains as is.
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // UPDATED: Now calls the secure backend function for encryption
  static async encryptSensitiveData(data) {
    try {
      const response = await encryptData({ data });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data; // Returns { iv, encryptedData }
    } catch (error) {
      console.error('Encryption via backend failed:', error);
      throw new Error('Versleuteling mislukt');
    }
  }

  // NEW: Function to decrypt data via the backend
  static async decryptSensitiveData(encryptedPayload) {
    const { iv, encryptedData } = encryptedPayload;
    if (!iv || !encryptedData) {
      throw new Error("Invalid payload for decryption.");
    }
    try {
      const response = await decryptData({ iv, encryptedData });
       if (response.error) {
        throw new Error(response.error);
      }
      return response.data.decryptedData;
    } catch (error) {
      console.error('Decryption via backend failed:', error);
      throw new Error('Ontsleuteling mislukt');
    }
  }
}

// Input validation for security
export const SecurityValidation = {
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  isValidURL(url) {
    try {
      const parsedURL = new URL(url);
      return ['http:', 'https:'].includes(parsedURL.protocol);
    } catch {
      return false;
    }
  },

  containsXSS(input) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  },

  containsSQLInjection(input) {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /('|('')|(")|(;)|(\/\*)|(\*\/)|(--)|(\+))/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
};
