"""
AnnaSetu AI — Production Security & Rate Limiting Module
Implements HTTP security headers and in-memory sliding-window rate limiting.
"""

import time
from typing import Dict, List, Tuple
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimiter:
    """
    Sliding window in-memory rate limiter with path-specific limits.
    Protects against credential brute-forcing, OTP hammering, and API abuse.
    """
    def __init__(self):
        # Maps client_key: [(timestamp)]
        self._history: Dict[str, List[float]] = {}
        
        # Route specific limits (requests per 60 seconds)
        self.endpoint_limits = {
            "/v1/auth/login": 10,
            "/v1/auth/register": 10,
            "/v1/handover/sessions/": 15,  # OTP verification endpoints
        }
        self.default_limit = 120  # 120 req/min for general API routes

    def is_allowed(self, client_ip: str, path: str) -> Tuple[bool, int, int]:
        """
        Check if request from client_ip to path is allowed.
        Returns: (allowed, current_count, limit)
        """
        now = time.time()
        window_start = now - 60.0
        
        # Determine limit for this path
        limit = self.default_limit
        for route_prefix, route_limit in self.endpoint_limits.items():
            if path.startswith(route_prefix):
                limit = route_limit
                break

        key = f"{client_ip}:{path.split('?')[0]}"
        
        # Prune old timestamps
        if key in self._history:
            self._history[key] = [t for t in self._history[key] if t > window_start]
        else:
            self._history[key] = []

        if len(self._history[key]) >= limit:
            return False, len(self._history[key]), limit

        self._history[key].append(now)
        return True, len(self._history[key]), limit


# Global rate limiter instance
rate_limiter = RateLimiter()


class SecurityAndRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware applying:
    1. OWASP recommended secure HTTP response headers
    2. Request rate limiting per IP & route pattern
    """
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path

        # Bypass rate limiter for health check and docs
        if not (path.startswith("/health") or path.startswith("/docs") or path.startswith("/redoc")):
            allowed, count, limit = rate_limiter.is_allowed(client_ip, path)
            if not allowed:
                return Response(
                    content=f'{{"detail": "Rate limit exceeded. Maximum {limit} requests per minute allowed."}}',
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    media_type="application/json",
                    headers={"Retry-After": "60"}
                )

        response: Response = await call_next(request)

        # Apply OWASP security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; object-src 'none';"
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"

        return response
