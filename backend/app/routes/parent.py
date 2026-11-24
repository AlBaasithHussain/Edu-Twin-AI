from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.models.models import Parent, Prediction, Recommendation
from app.schemas.schemas import StudentOut, PredictionOut, RecommendationOut

router = APIRouter(prefix="/api/parent", tags=["Parent"])


@router.get("/children", response_model=list[StudentOut])
def list_children(current_user=Depends(require_role("parent")), db: Session = Depends(get_db)):
    parent = current_user.parent_profile
    if not parent:
        raise HTTPException(status_code=404, detail="Parent profile not found")
    return [
        StudentOut(id=c.id, roll_number=c.roll_number, semester=c.semester, name=c.user.name, email=c.user.email)
        for c in parent.children
    ]


@router.get("/child/{student_id}/alerts")
def child_alerts(student_id: int, current_user=Depends(require_role("parent")), db: Session = Depends(get_db)):
    parent = current_user.parent_profile
    if not parent or student_id not in [c.id for c in parent.children]:
        raise HTTPException(status_code=403, detail="Not authorized to view this student")

    latest_prediction = (
        db.query(Prediction)
        .filter(Prediction.student_id == student_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    recs = (
        db.query(Recommendation)
        .filter(Recommendation.student_id == student_id)
        .order_by(Recommendation.created_at.desc())
        .limit(10)
        .all()
    )
    return {
        "latest_prediction": PredictionOut.model_validate(latest_prediction) if latest_prediction else None,
        "recommendations": [RecommendationOut.model_validate(r) for r in recs],
    }
