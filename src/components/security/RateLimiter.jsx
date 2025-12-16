// Rate limiting utility for production
const requestCounts = new Map();
const WINDOW_SIZE = 60000; // 1 minute
const MAX_REQUESTS = 100;

export function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE;
  
  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, []);
  }
  
  const requests = requestCounts.get(identifier);
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return false; // Rate limited
  }
  
  recentRequests.push(now);
  requestCounts.set(identifier, recentRequests);
  
  return true; // Allow request
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowStart = now - WINDOW_SIZE;
  
  for (const [key, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter(time => time > windowStart);
    if (recentRequests.length === 0) {
      requestCounts.delete(key);
    } else {
      requestCounts.set(key, recentRequests);
    }
  }
}, WINDOW_SIZE);