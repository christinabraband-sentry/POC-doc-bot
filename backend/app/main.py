import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import (
    pocs,
    mutual_action_plans,
    phases,
    success_criteria,
    team_members,
    gong,
    ai_analysis,
    docs_lookup,
    customer_portal,
)

settings = get_settings()

# Initialize Sentry before app creation
# The SDK auto-detects FastAPI and instruments routes, middleware, and DB calls
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        send_default_pii=True,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        enable_logs=True,
    )


def create_app() -> FastAPI:
    app = FastAPI(
        title="Sentry POC/MAP Portal API",
        description="Backend API for managing Sentry POC and Mutual Action Plan documents",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Staff-facing endpoints
    app.include_router(pocs.router, prefix="/api/v1", tags=["POCs"])
    app.include_router(
        mutual_action_plans.router, prefix="/api/v1", tags=["Mutual Action Plan"]
    )
    app.include_router(phases.router, prefix="/api/v1", tags=["Phases & Tasks"])
    app.include_router(
        success_criteria.router, prefix="/api/v1", tags=["Success Criteria"]
    )
    app.include_router(team_members.router, prefix="/api/v1", tags=["Team Members"])
    app.include_router(gong.router, prefix="/api/v1", tags=["Gong Integration"])
    app.include_router(ai_analysis.router, prefix="/api/v1", tags=["AI Analysis"])
    app.include_router(
        docs_lookup.router, prefix="/api/v1", tags=["Docs Lookup"]
    )

    # Customer-facing endpoints
    app.include_router(
        customer_portal.router, prefix="/api/v1", tags=["Customer Portal"]
    )

    @app.get("/api/v1/health")
    async def health_check():
        return {"status": "healthy"}

    return app


app = create_app()
