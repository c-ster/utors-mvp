import uuid
from sqlalchemy import String, Integer, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uic: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    unit_name: Mapped[str] = mapped_column(String(200))
    parent_uic: Mapped[str | None] = mapped_column(String(10), ForeignKey("units.uic"), nullable=True)
    echelon: Mapped[str] = mapped_column(String(50))  # "Battalion", "Company", "Platoon", "Squad", "Team"
    unit_type: Mapped[str] = mapped_column(String(100))  # "SF Battalion", "SF Company", etc.
    authorized_strength: Mapped[int] = mapped_column(Integer, default=0)
    icon_symbol: Mapped[str | None] = mapped_column(String(50), nullable=True)

    billets: Mapped[list["Billet"]] = relationship("Billet", back_populates="unit", lazy="selectin")
    children: Mapped[list["Unit"]] = relationship(
        "Unit",
        backref="parent",
        remote_side="Unit.uic",
        foreign_keys="Unit.parent_uic",
        lazy="selectin",
    )


class Billet(Base):
    __tablename__ = "billets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_uic: Mapped[str] = mapped_column(String(10), ForeignKey("units.uic"), index=True)
    position_id: Mapped[str] = mapped_column(String(20))  # MTOE Para/Line
    position_title: Mapped[str] = mapped_column(String(200))
    required_rank: Mapped[str] = mapped_column(String(10))
    required_mos: Mapped[str] = mapped_column(String(10))
    critical_ksbs: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    mission_criticality: Mapped[int] = mapped_column(Integer, default=5)  # 1-10 scale
    is_key_billet: Mapped[bool] = mapped_column(default=False)

    unit: Mapped["Unit"] = relationship("Unit", back_populates="billets")
    assignment: Mapped["Assignment | None"] = relationship("Assignment", back_populates="billet", uselist=False)


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    billet_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("billets.id"), unique=True)
    soldier_edipi: Mapped[str] = mapped_column(String(20), ForeignKey("soldiers.edipi"))
    is_ai_recommended: Mapped[bool] = mapped_column(default=False)
    match_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    mtoe_fit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    talent_fit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    preference_fit_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_reasoning: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    flags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)

    billet: Mapped["Billet"] = relationship("Billet", back_populates="assignment")
    soldier: Mapped["Soldier"] = relationship("Soldier", back_populates="assignment", foreign_keys=[soldier_edipi])


# Avoid circular import - Soldier imported at module level via models/__init__.py
from app.models.soldier import Soldier  # noqa: E402
