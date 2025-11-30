import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store for rate limiting
// Key: IP address, Value: { count, resetTime }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
    windowMs: number;  // Time window in milliseconds
    maxRequests: number;  // Maximum requests per window
}

/**
 * Rate limiting middleware to prevent API abuse
 *
 * @param options - Configuration for rate limiting
 * @returns Express middleware function
 */
export function createRateLimiter(options: RateLimitOptions) {
    const { windowMs, maxRequests } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        // Get client identifier (IP address)
        const clientId = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();

        // Get or create rate limit entry
        let entry = rateLimitStore.get(clientId);

        // If entry doesn't exist or window has expired, create new entry
        if (!entry || now > entry.resetTime) {
            entry = {
                count: 0,
                resetTime: now + windowMs,
            };
            rateLimitStore.set(clientId, entry);
        }

        // Increment request count
        entry.count++;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
        res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

        // Check if rate limit exceeded
        if (entry.count > maxRequests) {
            const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfter);

            res.status(429).json({
                error: 'Too many requests. Please try again later.',
                retryAfter: retryAfter,
                limit: maxRequests,
                window: `${windowMs / 1000} seconds`,
            });
            return;
        }

        // Rate limit not exceeded, proceed
        next();
    };
}

/**
 * Rate limiter for task breakdown endpoint
 * 10 requests per minute per IP address
 */
export const taskBreakdownRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,
});

/**
 * Rate limiter for AI analysis endpoint
 * 20 requests per minute per IP address
 */
export const aiAnalysisRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,
});
