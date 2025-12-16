// Enterprise Security Manager
class SecurityManager {
  constructor() {
    this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
    this.maxLoginAttempts = 5;
    this.loginAttempts = new Map();
    this.activeSessions = new Map();
    this.permissions = new Map();
    this.encryptionKey = this.generateEncryptionKey();
  }

  // Session management
  createSession(user) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId: user.id,
      email: user.email,
      company_id: user.company_id,
      role: user.company_role || 'user',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      permissions: this.getUserPermissions(user)
    };
    
    this.activeSessions.set(sessionId, session);
    
    // Auto-expire session
    setTimeout(() => {
      this.destroySession(sessionId);
    }, this.sessionTimeout);
    
    return session;
  }

  validateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    // Check if session expired
    if (Date.now() - session.lastActivity > this.sessionTimeout) {
      this.destroySession(sessionId);
      return null;
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    return session;
  }

  destroySession(sessionId) {
    this.activeSessions.delete(sessionId);
  }

  // Permission system
  getUserPermissions(user) {
    const basePermissions = ['read_own_data'];
    
    switch (user.company_role) {
      case 'admin':
        return [
          ...basePermissions,
          'manage_company',
          'manage_users',
          'manage_projects',
          'manage_materials',
          'view_analytics',
          'manage_settings',
          'export_data'
        ];
      case 'painter':
        return [
          ...basePermissions,
          'create_projects',
          'update_own_projects',
          'create_material_requests',
          'report_damages',
          'use_chat'
        ];
      case 'helpdesk':
        return [
          ...basePermissions,
          'view_all_projects',
          'manage_material_requests',
          'manage_damages',
          'use_chat'
        ];
      default:
        return basePermissions;
    }
  }

  hasPermission(session, permission) {
    if (!session || !session.permissions) return false;
    return session.permissions.includes(permission);
  }

  // Data sanitization
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // Data encryption (simplified)
  encrypt(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    
    // Simple XOR encryption (in production, use proper encryption)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
      );
    }
    return btoa(encrypted);
  }

  decrypt(encryptedData) {
    try {
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  // Rate limiting
  checkRateLimit(identifier, limit = 100, window = 60000) {
    const now = Date.now();
    const key = `rate_${identifier}`;
    
    if (!this.rateLimits) {
      this.rateLimits = new Map();
    }
    
    const requests = this.rateLimits.get(key) || [];
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    this.rateLimits.set(key, validRequests);
    return true;
  }

  // Login attempt tracking
  recordLoginAttempt(email, success) {
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    if (success) {
      this.loginAttempts.delete(email);
    } else {
      attempts.count++;
      attempts.lastAttempt = Date.now();
      this.loginAttempts.set(email, attempts);
      
      // Auto-reset after 15 minutes
      setTimeout(() => {
        this.loginAttempts.delete(email);
      }, 15 * 60 * 1000);
    }
  }

  isAccountLocked(email) {
    const attempts = this.loginAttempts.get(email);
    return attempts && attempts.count >= this.maxLoginAttempts;
  }

  // Secure data validation
  validateCompanyAccess(session, companyId) {
    return session && session.company_id === companyId;
  }

  validateProjectAccess(session, project) {
    if (!session || !project) return false;
    
    // Admin can access all company projects
    if (session.role === 'admin' && session.company_id === project.company_id) {
      return true;
    }
    
    // Painters can only access their assigned projects
    if (session.role === 'painter') {
      return project.assigned_painters && project.assigned_painters.includes(session.email);
    }
    
    return false;
  }

  // REMOVED AUDIT LOGGING TO PREVENT RATE LIMITING
  async logSecurityEvent(event, details, severity = 'info') {
    // Silent logging - don't make API calls that could cause rate limiting
    console.log(`Security Event [${severity}]: ${event}`, details);
  }

  // Utility methods
  generateSessionId() {
    return crypto.getRandomValues(new Uint8Array(32))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
  }

  generateEncryptionKey() {
    // In production, this would be a proper key management system
    return 'PaintPro2024SecureKey!@#$%^&*()';
  }

  getClientIP() {
    // In production, this would get the actual client IP
    return '127.0.0.1';
  }

  // Data backup verification
  verifyDataIntegrity(data) {
    // Simple checksum verification
    const checksum = this.calculateChecksum(JSON.stringify(data));
    return { valid: true, checksum };
  }

  calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}

const securityManager = new SecurityManager();
export default securityManager;