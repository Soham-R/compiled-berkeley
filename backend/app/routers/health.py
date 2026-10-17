"""Health check and service discovery endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "wren-backend",
        "version": "0.1.0",
        "invariants": {
            "active_recall": True,
            "no_answer_on_first_ask": True,
            "adaptive_presentation": True,
        },
    }
