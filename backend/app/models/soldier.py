import uuid
from datetime import date
from sqlalchemy import String, Integer, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Soldier(Base):
    __tablename__ = "soldiers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    edipi: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    rank: Mapped[str] = mapped_column(String(10))
    grade: Mapped[str] = mapped_column(String(5))  # E1-E9, W1-W5, O1-O10
    last_name: Mapped[str] = mapped_column(String(100))
    first_name: Mapped[str] = mapped_column(String(100))
    mos: Mapped[str] = mapped_column(String(10))
    asi: Mapped[str | None] = mapped_column(String(10), nullable=True)
    sqi: Mapped[str | None] = mapped_column(String(10), nullable=True)
    unit_uic: Mapped[str] = mapped_column(String(10), index=True)
    ets_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    deros: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Readiness
    deployable_status: Mapped[str] = mapped_column(String(10), default="Green")  # Green, Amber, Red
    medical_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    medical_detail: Mapped[str | None] = mapped_column(String(200), nullable=True)  # Masked by RBAC
    security_clearance: Mapped[str] = mapped_column(String(20), default="Secret")

    # Talent / KSBs
    ksbs: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    languages: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    # Hidden Talent (from Intake Form)
    civilian_certifications: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    hobbies_skills: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    desired_role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    family_considerations: Mapped[str | None] = mapped_column(String(500), nullable=True)
    career_preferences: Mapped[str | None] = mapped_column(String(500), nullable=True)
    intake_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Status
    is_incoming: Mapped[bool] = mapped_column(Boolean, default=False)
    is_outgoing: Mapped[bool] = mapped_column(Boolean, default=False)
    projected_loss_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    projected_gain_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Data drift tracking
    has_local_override: Mapped[bool] = mapped_column(Boolean, default=False)
    override_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    assignment: Mapped["Assignment | None"] = relationship(
        "Assignment",
        back_populates="soldier",
        uselist=False,
        foreign_keys="Assignment.soldier_edipi",
    )


from app.models.unit import Assignment  # noqa: E402
