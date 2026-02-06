"""
Synthetic Data Generation for UTORS MVP

Generates a 1st Special Forces Battalion (~450 personnel) with:
  Rule 1 (The Crisis): 15% non-deployable
  Rule 2 (Hidden Talent): 5% of NCOs (SSG-MSG) have high-value hidden skills
  Rule 3 (The Gap): One SF Company has 35% of 18D (SF Medical) slots unfilled
"""

import random
import uuid
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.unit import Unit, Billet, Assignment
from app.models.soldier import Soldier

random.seed(42)

# --- Constants ---

SF_KSBS = [
    "Ranger Qualified", "Jumpmaster", "Air Assault Qualified", "Pathfinder",
    "SERE Level C", "Combat Diver", "Military Freefall",
    "Language: Arabic", "Language: Pashto", "Language: French", "Language: Russian",
    "Language: Spanish", "Language: Mandarin",
    "Sniper Qualified", "Breacher Qualified", "JTAC Qualified",
    "Cyber Operations", "SIGINT Collection", "HUMINT Collection",
    "Advanced Trauma Care", "Surgical Procedures", "Veterinary Medicine",
    "Demolitions Expert", "Advanced Marksmanship Instructor",
    "Mountain Warfare", "Arctic Warfare", "Jungle Warfare",
    "UAS Operator", "Technical Surveillance",
]

HIDDEN_TALENTS = [
    "CDL License", "FAA Drone Pilot License", "Cyber Security Certification",
    "Certified Welding", "EMT-Paramedic", "Cisco CCNA", "AWS Certified",
    "CompTIA Security+", "Master Fitness Trainer", "Unit Movement Officer",
    "Project Management Professional (PMP)", "Six Sigma Green Belt",
]

HOBBIES = [
    "Rock Climbing", "Ham Radio Operator", "Woodworking",
    "Automotive Repair", "Photography", "Marathon Running",
    "Brazilian Jiu-Jitsu", "Competitive Shooting", "Scuba Diving",
    "Programming", "3D Printing", "Drone Building",
]

FAMILY_CONSIDERATIONS = [
    "EFMP enrolled", "Spouse active duty", "Dual-military couple",
    "Single parent", "None", "None", "None",
    "Spouse employment priority", "Child special needs",
]

MEDICAL_CODES = [
    ("Green", None, None),
    ("Green", None, None),
    ("Green", None, None),
    ("Green", None, None),
    ("Green", None, None),
    ("Amber", "P2", "Minor orthopedic limitation"),
    ("Amber", "P2", "Pending dental class 3"),
    ("Red", "P3", "Post-surgical recovery - knee"),
    ("Red", "P3", "Pregnancy"),
    ("Red", "T3", "Pending MEB evaluation"),
    ("Red", "P4", "Broken ankle"),
]

CAREER_PREFERENCES = [
    "Operational assignment preferred",
    "Seeking instructor role",
    "Leadership position desired",
    "Staff assignment acceptable",
    "CONUS preferred - family stability",
    "High-tempo operational role",
    "Training and doctrine development",
    "SOF-specific broadening assignment",
]


def _edipi() -> str:
    return str(random.randint(1000000100, 1999999999))


def _ets_date() -> date:
    return date.today() + timedelta(days=random.randint(90, 1200))


def _deros() -> date | None:
    if random.random() < 0.3:
        return date.today() + timedelta(days=random.randint(30, 400))
    return None


# --- Unit Structure: 1st SF Battalion ---

UNIT_STRUCTURE = [
    # Battalion HQ
    {
        "uic": "W1SF00", "name": "1st Special Forces Battalion (Airborne)",
        "parent": None, "echelon": "Battalion", "type": "SF Battalion",
        "billets": [
            ("001-01", "Battalion Commander", "O5", "18A", ["Ranger Qualified", "Jumpmaster"], 10, True),
            ("001-02", "Battalion XO", "O4", "18A", ["Ranger Qualified"], 9, True),
            ("001-03", "Battalion CSM", "E9", "18Z", ["Ranger Qualified", "Jumpmaster"], 10, True),
            ("001-04", "S1 - Personnel Officer", "O3", "42B", [], 6, False),
            ("001-05", "S2 - Intelligence Officer", "O3", "35D", ["HUMINT Collection"], 8, True),
            ("001-06", "S3 - Operations Officer", "O4", "18A", ["Ranger Qualified", "JTAC Qualified"], 9, True),
            ("001-07", "S4 - Logistics Officer", "O3", "90A", [], 6, False),
            ("001-08", "S6 - Signal Officer", "O3", "25A", ["Cyber Operations"], 7, False),
            ("001-09", "Battalion Surgeon", "O3", "60J", ["Advanced Trauma Care"], 8, True),
            ("001-10", "Operations SGM", "E9", "18Z", ["Ranger Qualified"], 8, True),
            ("001-11", "Intel NCOIC", "E8", "35L", ["HUMINT Collection", "SIGINT Collection"], 7, True),
            ("001-12", "Commo Chief", "E8", "25W", ["Cyber Operations"], 6, False),
            ("001-13", "Supply SGT", "E7", "92Y", [], 4, False),
            ("001-14", "Admin NCO", "E6", "42A", [], 3, False),
            ("001-15", "S1 Clerk", "E4", "42A", [], 2, False),
            ("001-16", "S2 Analyst", "E5", "35F", ["SIGINT Collection"], 5, False),
            ("001-17", "S3 Ops NCO", "E7", "18Z", ["Ranger Qualified"], 6, False),
            ("001-18", "Medic", "E5", "68W", ["Advanced Trauma Care"], 5, False),
        ],
    },
    # Alpha Company
    {
        "uic": "W1SFA0", "name": "A Company, 1st SF BN (Airborne)",
        "parent": "W1SF00", "echelon": "Company", "type": "SF Company",
        "billets": _generate_sf_company_billets("A", "W1SFA0"),
    },
    # Bravo Company
    {
        "uic": "W1SFB0", "name": "B Company, 1st SF BN (Airborne)",
        "parent": "W1SF00", "echelon": "Company", "type": "SF Company",
        "billets": _generate_sf_company_billets("B", "W1SFB0"),
    },
    # Charlie Company (THE GAP COMPANY - 35% 18D unfilled)
    {
        "uic": "W1SFC0", "name": "C Company, 1st SF BN (Airborne)",
        "parent": "W1SF00", "echelon": "Company", "type": "SF Company",
        "billets": _generate_sf_company_billets("C", "W1SFC0"),
    },
    # Support Company
    {
        "uic": "W1SFS0", "name": "Support Company, 1st SF BN (Airborne)",
        "parent": "W1SF00", "echelon": "Company", "type": "Support Company",
        "billets": [
            ("S01-01", "Company Commander", "O3", "18A", ["Ranger Qualified"], 8, True),
            ("S01-02", "First Sergeant", "E8", "18Z", ["Ranger Qualified"], 8, True),
            ("S01-03", "XO", "O2", "18A", [], 6, False),
            ("S01-04", "Supply Officer", "O2", "92A", [], 5, False),
            ("S01-05", "Motor Sergeant", "E7", "91X", [], 5, False),
            ("S01-06", "Armorer", "E5", "91F", [], 4, False),
            ("S01-07", "Supply SGT", "E6", "92Y", [], 4, False),
            ("S01-08", "Commo NCO", "E6", "25U", ["Cyber Operations"], 5, False),
            ("S01-09", "Medic", "E5", "68W", ["Advanced Trauma Care"], 5, False),
            ("S01-10", "Driver", "E3", "88M", [], 2, False),
            ("S01-11", "Driver", "E3", "88M", [], 2, False),
            ("S01-12", "Cook", "E4", "92G", [], 2, False),
            ("S01-13", "Mechanic", "E4", "91B", [], 3, False),
            ("S01-14", "Mechanic", "E4", "91B", [], 3, False),
            ("S01-15", "Admin Clerk", "E4", "42A", [], 2, False),
            *[
                (f"S01-{16+i}", "Support Soldier", "E3", "92Y", [], 2, False)
                for i in range(10)
            ],
        ],
    },
]


def _generate_sf_company_billets(co_letter: str, uic: str) -> list[tuple]:
    """Generate billets for an SF Company (CO HQ + 6 ODAs)."""
    billets = [
        (f"{co_letter}01-01", "Company Commander", "O3", "18A", ["Ranger Qualified", "Jumpmaster"], 9, True),
        (f"{co_letter}01-02", "First Sergeant", "E8", "18Z", ["Ranger Qualified", "Jumpmaster"], 9, True),
        (f"{co_letter}01-03", "Company XO", "O2", "18A", ["Ranger Qualified"], 7, False),
        (f"{co_letter}01-04", "Operations Warrant", "W3", "180A", ["Ranger Qualified"], 8, True),
        (f"{co_letter}01-05", "Intel SGT", "E6", "18F", ["HUMINT Collection"], 6, False),
    ]

    # 6 ODAs per company
    for oda_num in range(1, 7):
        oda_prefix = f"{co_letter}{oda_num:02d}"
        billets.extend([
            (f"{oda_prefix}-01", f"ODA {co_letter}{oda_num} Commander", "O3", "18A",
             ["Ranger Qualified", "Jumpmaster", "Military Freefall"], 10, True),
            (f"{oda_prefix}-02", f"ODA {co_letter}{oda_num} Warrant Officer", "W2", "180A",
             ["Ranger Qualified", "Jumpmaster"], 9, True),
            (f"{oda_prefix}-03", f"ODA {co_letter}{oda_num} Team Sergeant", "E8", "18Z",
             ["Ranger Qualified", "Jumpmaster", "SERE Level C"], 10, True),
            (f"{oda_prefix}-04", f"ODA {co_letter}{oda_num} Intel SGT", "E7", "18F",
             ["HUMINT Collection", "SERE Level C"], 8, True),
            (f"{oda_prefix}-05", f"ODA {co_letter}{oda_num} Weapons SGT", "E7", "18B",
             ["Sniper Qualified", "Demolitions Expert", "Advanced Marksmanship Instructor"], 8, True),
            (f"{oda_prefix}-06", f"ODA {co_letter}{oda_num} Weapons SGT", "E6", "18B",
             ["Demolitions Expert", "Breacher Qualified"], 7, False),
            (f"{oda_prefix}-07", f"ODA {co_letter}{oda_num} Engineer SGT", "E7", "18C",
             ["Demolitions Expert", "Breacher Qualified"], 8, True),
            (f"{oda_prefix}-08", f"ODA {co_letter}{oda_num} Engineer SGT", "E6", "18C",
             ["Breacher Qualified"], 7, False),
            (f"{oda_prefix}-09", f"ODA {co_letter}{oda_num} Medical SGT", "E7", "18D",
             ["Advanced Trauma Care", "Surgical Procedures"], 9, True),
            (f"{oda_prefix}-10", f"ODA {co_letter}{oda_num} Medical SGT", "E6", "18D",
             ["Advanced Trauma Care"], 8, True),
            (f"{oda_prefix}-11", f"ODA {co_letter}{oda_num} Commo SGT", "E7", "18E",
             ["Cyber Operations", "SIGINT Collection"], 8, True),
            (f"{oda_prefix}-12", f"ODA {co_letter}{oda_num} Commo SGT", "E6", "18E",
             ["Cyber Operations"], 7, False),
        ])

    return billets


# Need to define the function before referencing it
# Recreate the structure with proper function ordering
def build_unit_structure():
    return [
        {
            "uic": "W1SF00", "name": "1st Special Forces Battalion (Airborne)",
            "parent": None, "echelon": "Battalion", "type": "SF Battalion",
            "billets": [
                ("001-01", "Battalion Commander", "O5", "18A", ["Ranger Qualified", "Jumpmaster"], 10, True),
                ("001-02", "Battalion XO", "O4", "18A", ["Ranger Qualified"], 9, True),
                ("001-03", "Battalion CSM", "E9", "18Z", ["Ranger Qualified", "Jumpmaster"], 10, True),
                ("001-04", "S1 - Personnel Officer", "O3", "42B", [], 6, False),
                ("001-05", "S2 - Intelligence Officer", "O3", "35D", ["HUMINT Collection"], 8, True),
                ("001-06", "S3 - Operations Officer", "O4", "18A", ["Ranger Qualified", "JTAC Qualified"], 9, True),
                ("001-07", "S4 - Logistics Officer", "O3", "90A", [], 6, False),
                ("001-08", "S6 - Signal Officer", "O3", "25A", ["Cyber Operations"], 7, False),
                ("001-09", "Battalion Surgeon", "O3", "60J", ["Advanced Trauma Care"], 8, True),
                ("001-10", "Operations SGM", "E9", "18Z", ["Ranger Qualified"], 8, True),
                ("001-11", "Intel NCOIC", "E8", "35L", ["HUMINT Collection", "SIGINT Collection"], 7, True),
                ("001-12", "Commo Chief", "E8", "25W", ["Cyber Operations"], 6, False),
                ("001-13", "Supply SGT", "E7", "92Y", [], 4, False),
                ("001-14", "Admin NCO", "E6", "42A", [], 3, False),
                ("001-15", "S1 Clerk", "E4", "42A", [], 2, False),
                ("001-16", "S2 Analyst", "E5", "35F", ["SIGINT Collection"], 5, False),
                ("001-17", "S3 Ops NCO", "E7", "18Z", ["Ranger Qualified"], 6, False),
                ("001-18", "Medic", "E5", "68W", ["Advanced Trauma Care"], 5, False),
            ],
        },
        {
            "uic": "W1SFA0", "name": "A Company, 1st SF BN (Airborne)",
            "parent": "W1SF00", "echelon": "Company", "type": "SF Company",
            "billets": _generate_sf_company_billets("A", "W1SFA0"),
        },
        {
            "uic": "W1SFB0", "name": "B Company, 1st SF BN (Airborne)",
            "parent": "W1SF00", "echelon": "Company", "type": "SF Company",
            "billets": _generate_sf_company_billets("B", "W1SFB0"),
        },
        {
            "uic": "W1SFC0", "name": "C Company, 1st SF BN (Airborne)",
            "parent": "W1SF00", "echelon": "Company", "type": "SF Company",
            "billets": _generate_sf_company_billets("C", "W1SFC0"),
        },
        {
            "uic": "W1SFS0", "name": "Support Company, 1st SF BN (Airborne)",
            "parent": "W1SF00", "echelon": "Company", "type": "Support Company",
            "billets": [
                ("S01-01", "Company Commander", "O3", "18A", ["Ranger Qualified"], 8, True),
                ("S01-02", "First Sergeant", "E8", "18Z", ["Ranger Qualified"], 8, True),
                ("S01-03", "XO", "O2", "18A", [], 6, False),
                ("S01-04", "Supply Officer", "O2", "92A", [], 5, False),
                ("S01-05", "Motor Sergeant", "E7", "91X", [], 5, False),
                ("S01-06", "Armorer", "E5", "91F", [], 4, False),
                ("S01-07", "Supply SGT", "E6", "92Y", [], 4, False),
                ("S01-08", "Commo NCO", "E6", "25U", ["Cyber Operations"], 5, False),
                ("S01-09", "Medic", "E5", "68W", ["Advanced Trauma Care"], 5, False),
                ("S01-10", "Driver", "E3", "88M", [], 2, False),
                ("S01-11", "Driver", "E3", "88M", [], 2, False),
                ("S01-12", "Cook", "E4", "92G", [], 2, False),
                ("S01-13", "Mechanic", "E4", "91B", [], 3, False),
                ("S01-14", "Mechanic", "E4", "91B", [], 3, False),
                ("S01-15", "Admin Clerk", "E4", "42A", [], 2, False),
                *[(f"S01-{16+i}", "Support Soldier", "E3", "92Y", [], 2, False) for i in range(10)],
            ],
        },
    ]


# MOS-specific data for generating realistic soldiers
MOS_RANK_MAP = {
    "18A": ["O3", "O4", "O5"],
    "180A": ["W2", "W3", "W4"],
    "18Z": ["E8", "E9"],
    "18B": ["E6", "E7"],
    "18C": ["E6", "E7"],
    "18D": ["E6", "E7"],
    "18E": ["E6", "E7"],
    "18F": ["E6", "E7"],
    "42B": ["O3"],
    "35D": ["O3"],
    "90A": ["O3"],
    "25A": ["O3"],
    "60J": ["O3"],
    "35L": ["E7", "E8"],
    "25W": ["E7", "E8"],
    "92Y": ["E4", "E5", "E6", "E7"],
    "42A": ["E4", "E5", "E6"],
    "35F": ["E4", "E5", "E6"],
    "68W": ["E4", "E5", "E6"],
    "91X": ["E7"],
    "91F": ["E5"],
    "25U": ["E5", "E6"],
    "88M": ["E3", "E4"],
    "92G": ["E4"],
    "91B": ["E4", "E5"],
    "92A": ["O2"],
}

GRADE_TO_RANKS = {
    "E1": "PV1", "E2": "PV2", "E3": "PFC", "E4": "SPC", "E5": "SGT",
    "E6": "SSG", "E7": "SFC", "E8": "MSG", "E9": "SGM",
    "W1": "WO1", "W2": "CW2", "W3": "CW3", "W4": "CW4", "W5": "CW5",
    "O1": "2LT", "O2": "1LT", "O3": "CPT", "O4": "MAJ", "O5": "LTC", "O6": "COL",
}

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen",
    "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera",
    "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans",
    "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart",
    "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz",
    "Morgan", "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos",
    "Kim", "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood",
    "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez",
    "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez",
]

FIRST_NAMES = [
    "James", "John", "Robert", "Michael", "David", "William", "Richard", "Joseph",
    "Thomas", "Christopher", "Charles", "Daniel", "Matthew", "Anthony", "Mark",
    "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth", "Kevin", "Brian",
    "George", "Timothy", "Ronald", "Jason", "Edward", "Jeffrey", "Ryan",
    "Jacob", "Gary", "Nicholas", "Eric", "Jonathan", "Stephen", "Larry", "Justin",
    "Scott", "Brandon", "Benjamin", "Samuel", "Raymond", "Gregory", "Frank",
    "Alexander", "Patrick", "Jack", "Dennis", "Jerry", "Tyler", "Aaron", "Jose",
    "Nathan", "Henry", "Peter", "Douglas", "Zachary", "Kyle", "Noah",
    "Maria", "Jennifer", "Sarah", "Jessica", "Emily", "Amanda", "Ashley",
    "Michelle", "Kimberly", "Elizabeth", "Megan", "Stephanie", "Nicole", "Lauren",
    "Rachel", "Samantha", "Rebecca", "Brittany", "Katherine", "Andrea",
]


def generate_soldier_for_billet(
    billet_data: tuple,
    unit_uic: str,
    is_gap: bool = False,
) -> Soldier | None:
    """Generate a soldier to fill a billet. Returns None if gap."""
    if is_gap:
        return None

    pos_id, title, req_grade, req_mos, ksbs, crit, is_key = billet_data
    grade = req_grade
    rank = GRADE_TO_RANKS.get(grade, grade)

    # Determine deployability (Rule 1: 15% non-deployable)
    med_idx = 0
    if random.random() < 0.15:
        med_idx = random.randint(5, len(MEDICAL_CODES) - 1)
    status, med_code, med_detail = MEDICAL_CODES[med_idx]

    # Base KSBs from billet requirements
    soldier_ksbs = list(ksbs) if ksbs else []
    # Add some random extra KSBs
    if random.random() < 0.3:
        extra = random.sample(SF_KSBS, k=random.randint(1, 3))
        soldier_ksbs.extend(extra)
    soldier_ksbs = list(set(soldier_ksbs))

    # Languages
    languages = []
    if "18" in req_mos or random.random() < 0.2:
        languages = random.sample(
            ["Arabic", "Pashto", "French", "Russian", "Spanish", "Mandarin", "Korean", "Dari"],
            k=random.randint(1, 2),
        )

    # Hidden talent (Rule 2: 5% of SSG-MSG)
    civ_certs = None
    hobbies = None
    desired_role = None
    family = None
    career_pref = None
    intake_done = False

    nco_grades = {"E6", "E7", "E8", "E9"}
    if grade in nco_grades and random.random() < 0.05:
        civ_certs = random.sample(HIDDEN_TALENTS, k=random.randint(1, 2))
        hobbies = random.sample(HOBBIES, k=random.randint(1, 2))
        intake_done = True

    # Some soldiers complete intake
    if random.random() < 0.4:
        desired_role = random.choice([title, "Team Leader", "Instructor", "Operations"])
        family = random.choice(FAMILY_CONSIDERATIONS)
        career_pref = random.choice(CAREER_PREFERENCES)
        if not civ_certs and random.random() < 0.2:
            civ_certs = random.sample(HIDDEN_TALENTS, k=1)
        hobbies = random.sample(HOBBIES, k=random.randint(1, 3))
        intake_done = True

    # Outgoing / incoming
    is_outgoing = random.random() < 0.08
    is_incoming = random.random() < 0.05 and not is_outgoing
    loss_date = (date.today() + timedelta(days=random.randint(15, 120))) if is_outgoing else None
    gain_date = (date.today() + timedelta(days=random.randint(5, 60))) if is_incoming else None

    return Soldier(
        edipi=_edipi(),
        rank=rank,
        grade=grade,
        last_name=random.choice(LAST_NAMES),
        first_name=random.choice(FIRST_NAMES),
        mos=req_mos,
        unit_uic=unit_uic,
        ets_date=_ets_date(),
        deros=_deros(),
        deployable_status=status,
        medical_code=med_code,
        medical_detail=med_detail,
        security_clearance=random.choice(["Secret", "TS/SCI", "TS/SCI"]),
        ksbs=soldier_ksbs,
        languages=languages,
        civilian_certifications=civ_certs,
        hobbies_skills=hobbies,
        desired_role=desired_role,
        family_considerations=family,
        career_preferences=career_pref,
        intake_completed=intake_done,
        is_incoming=is_incoming,
        is_outgoing=is_outgoing,
        projected_loss_date=loss_date,
        projected_gain_date=gain_date,
    )


def seed_database():
    """Main seeding function."""
    print("Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()

    try:
        unit_structure = build_unit_structure()
        all_soldiers = []
        all_assignments = []

        for unit_data in unit_structure:
            print(f"  Creating unit: {unit_data['name']}")
            unit = Unit(
                uic=unit_data["uic"],
                unit_name=unit_data["name"],
                parent_uic=unit_data["parent"],
                echelon=unit_data["echelon"],
                unit_type=unit_data["type"],
                authorized_strength=len(unit_data["billets"]),
            )
            db.add(unit)
            db.flush()

            for billet_data in unit_data["billets"]:
                pos_id, title, req_grade, req_mos, ksbs, crit, is_key = billet_data
                billet = Billet(
                    unit_uic=unit_data["uic"],
                    position_id=pos_id,
                    position_title=title,
                    required_rank=req_grade,
                    required_mos=req_mos,
                    critical_ksbs=ksbs if ksbs else None,
                    mission_criticality=crit,
                    is_key_billet=is_key,
                )
                db.add(billet)
                db.flush()

                # Rule 3: C Company 18D slots - 35% unfilled
                is_gap = False
                if unit_data["uic"] == "W1SFC0" and req_mos == "18D":
                    is_gap = random.random() < 0.35

                # Random unfilled (about 10% of other billets)
                if not is_gap and random.random() < 0.10:
                    is_gap = True

                soldier = generate_soldier_for_billet(billet_data, unit_data["uic"], is_gap)
                if soldier:
                    db.add(soldier)
                    db.flush()
                    all_soldiers.append(soldier)

                    assignment = Assignment(
                        billet_id=billet.id,
                        soldier_edipi=soldier.edipi,
                        is_ai_recommended=False,
                    )
                    db.add(assignment)
                    all_assignments.append(assignment)

        # Generate some unassigned incoming soldiers (bench pool)
        print("  Generating incoming soldiers (bench pool)...")
        incoming_mos = ["18B", "18C", "18D", "18E", "18F", "18A", "42A", "92Y"]
        for i in range(25):
            mos = random.choice(incoming_mos)
            grades = MOS_RANK_MAP.get(mos, ["E5", "E6"])
            grade = random.choice(grades)
            rank = GRADE_TO_RANKS.get(grade, grade)

            soldier = Soldier(
                edipi=_edipi(),
                rank=rank,
                grade=grade,
                last_name=random.choice(LAST_NAMES),
                first_name=random.choice(FIRST_NAMES),
                mos=mos,
                unit_uic="W1SF00",  # Assigned to BN, pending slating
                ets_date=_ets_date(),
                deployable_status="Green",
                security_clearance=random.choice(["Secret", "TS/SCI"]),
                ksbs=random.sample(SF_KSBS, k=random.randint(1, 4)),
                languages=random.sample(["Arabic", "French", "Spanish", "Pashto"], k=1),
                is_incoming=True,
                projected_gain_date=date.today() + timedelta(days=random.randint(5, 45)),
                intake_completed=random.random() < 0.6,
                desired_role=random.choice(["Team Member", "Team Leader", "Operations", "Instructor"]) if random.random() < 0.5 else None,
                career_preferences=random.choice(CAREER_PREFERENCES) if random.random() < 0.5 else None,
                civilian_certifications=random.sample(HIDDEN_TALENTS, k=1) if random.random() < 0.15 else None,
            )
            db.add(soldier)

        db.commit()

        # Print summary
        total_soldiers = db.query(Soldier).count()
        total_billets = db.query(Billet).count()
        total_assigned = db.query(Assignment).count()
        non_dep = db.query(Soldier).filter(Soldier.deployable_status != "Green").count()
        incoming = db.query(Soldier).filter(Soldier.is_incoming == True).count()

        print(f"\n{'='*50}")
        print(f"  UTORS Seed Data Generation Complete")
        print(f"{'='*50}")
        print(f"  Total Billets:      {total_billets}")
        print(f"  Total Soldiers:     {total_soldiers}")
        print(f"  Assigned:           {total_assigned}")
        print(f"  Unfilled Billets:   {total_billets - total_assigned}")
        print(f"  Non-Deployable:     {non_dep} ({non_dep/total_soldiers*100:.1f}%)")
        print(f"  Incoming:           {incoming}")
        print(f"{'='*50}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
