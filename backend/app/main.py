"""
Main FastAPI application
E-Com Auditor 2026 - Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .core.config import settings
from .core.rate_limit import limiter
from .api import auth, products, audit, legal, admin

# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

# V10 – hide interactive docs in production
_docs_url = None if settings.ENVIRONMENT == "production" else "/api/docs"
_redoc_url = None if settings.ENVIRONMENT == "production" else "/api/redoc"

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Automated marketplace seller audit system",
    docs_url=_docs_url,
    redoc_url=_redoc_url,
    redirect_slashes=False,
)

# V01 – attach shared rate-limiter to app state so slowapi can use it
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS (V13 – restrict to explicit methods)
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(products.router, prefix=f"{settings.API_V1_PREFIX}/products", tags=["Products"])
app.include_router(audit.router, prefix=f"{settings.API_V1_PREFIX}/audit", tags=["Audit"])
app.include_router(legal.router, prefix=f"{settings.API_V1_PREFIX}/legal", tags=["Legal Documents"])
app.include_router(admin.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["Admin"])
app.include_router(admin.payments_router, prefix=f"{settings.API_V1_PREFIX}", tags=["Payments"])


# ---------------------------------------------------------------------------
# Utility endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "E-Com Auditor 2026 API",
        "version": settings.VERSION,
    }


@app.get("/health")
async def health_check():
    """Health check.

    V14 – never expose environment name in production responses.
    """
    payload: dict = {"status": "healthy"}
    if settings.ENVIRONMENT != "production":
        payload["environment"] = settings.ENVIRONMENT
    return payload


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
