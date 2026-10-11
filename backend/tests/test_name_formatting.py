import pytest
from app.utils.name_formatting import format_full_name, get_name_initials, normalize_name
from app.schema.users import users, usersUpdate, userProfileUpdate, role_name
from app.schema.patients import patients, patientUpdate
from datetime import date


@pytest.mark.parametrize(
    "input_name, expected",
    [
        # Standard names
        ("john", "John"),
        ("SMITH", "Smith"),
        ("john smith", "John Smith"),
        ("JOHN SMITH", "John Smith"),
        ("  alice   marie  ", "Alice Marie"),
        
        # Hyphenated names
        ("mary-jane", "Mary-Jane"),
        ("MARY-JANE", "Mary-Jane"),
        ("smith-jones", "Smith-Jones"),
        ("SMITH-JONES", "Smith-Jones"),
        ("smith - jones", "Smith-Jones"),
        ("jean-luc", "Jean-Luc"),
        
        # Apostrophes
        ("o'connor", "O'Connor"),
        ("O'CONNOR", "O'Connor"),
        ("d'angelo", "D'Angelo"),
        ("D'ANGELO", "D'Angelo"),
        ("o'brien", "O'Brien"),
        ("o ' brien", "O'Brien"),
        ("O’Connor", "O'Connor"),  # Curly apostrophe
        ("d’artagnan", "D'Artagnan"),
        
        # Celtic prefixes
        ("mcdonald", "McDonald"),
        ("MCDONALD", "McDonald"),
        ("mcclure", "McClure"),
        ("macdonald", "MacDonald"),
        ("MACINTYRE", "MacIntyre"),
        
        # Particles
        ("de la cruz", "De la Cruz"),
        ("DE LA CRUZ", "De la Cruz"),
        ("van der waals", "Van der Waals"),
        ("VAN DER WAALS", "Van der Waals"),
        
        # Arabic prefixes
        ("al-hassan", "Al-Hassan"),
        ("AL-SAYED", "Al-Sayed"),
        ("el-khoury", "El-Khoury"),
        
        # Preservation of intentional mixed casing
        ("McDonald", "McDonald"),
        ("MacDonald", "MacDonald"),
        ("O'Connor", "O'Connor"),
        ("DeLaCruz", "DeLaCruz"),
        ("LeBlanc", "LeBlanc"),
        ("von Trapp", "Von Trapp"),
        
        # Generational suffixes & Roman numerals
        ("william smith jr.", "William Smith Jr."),
        ("william smith jr", "William Smith Jr"),
        ("william iii", "William III"),
        ("henry viii", "Henry VIII"),
        
        # Edge cases
        ("", ""),
        ("   ", ""),
        ("j", "J"),
        ("A", "A"),
    ],
)
def test_normalize_name(input_name, expected):
    assert normalize_name(input_name) == expected


def test_normalize_name_none():
    assert normalize_name(None) is None


@pytest.mark.parametrize(
    "first, middle, last, expected",
    [
        ("john", None, "smith", "John Smith"),
        ("JOHN", "MICHAEL", "SMITH", "John Michael Smith"),
        ("mary-jane", "a.", "watson", "Mary-Jane A. Watson"),
        ("o'connor", None, None, "O'Connor"),
        (None, None, "smith", "Smith"),
        (None, None, None, ""),
        ("  john  ", "  ", "  doe  ", "John Doe"),
    ],
)
def test_format_full_name(first, middle, last, expected):
    assert format_full_name(first, middle, last) == expected


@pytest.mark.parametrize(
    "first, last, expected",
    [
        ("john", "smith", "JS"),
        ("JOHN", "SMITH", "JS"),
        ("o'connor", None, "O"),
        (None, "d'angelo", "D"),
        ("", "", "U"),
        (None, None, "U"),
    ],
)
def test_get_name_initials(first, last, expected):
    assert get_name_initials(first, last) == expected


def test_users_schema_normalizes_names():
    u = users(
        first_name="  john  ",
        middle_name="michael",
        last_name="SMITH-JONES",
        email="john@example.com",
        password="securePassword123",
        role=role_name.ADMIN,
    )
    assert u.first_name == "John"
    assert u.middle_name == "Michael"
    assert u.last_name == "Smith-Jones"


def test_users_update_schema_normalizes_names():
    u = usersUpdate(
        first_name="mcdonald",
        last_name="o'connor",
    )
    assert u.first_name == "McDonald"
    assert u.last_name == "O'Connor"


def test_user_profile_update_schema_normalizes_names():
    p = userProfileUpdate(
        first_name="al-sayed",
        middle_name="k.",
        last_name="d'angelo",
        email="user@hospital.com",
    )
    assert p.first_name == "Al-Sayed"
    assert p.middle_name == "K."
    assert p.last_name == "D'Angelo"


def test_patients_schema_normalizes_names():
    p = patients(
        first_name="mary-jane",
        middle_name="ANNE",
        last_name="watson",
        dob=date(1998, 5, 20),
        address="123 Web St",
        city="Queens",
        state="NY",
        postal_code="11375",
        email="mj@example.com",
        phone="1234567890",
    )
    assert p.first_name == "Mary-Jane"
    assert p.middle_name == "Anne"
    assert p.last_name == "Watson"


def test_patient_update_schema_normalizes_names():
    pu = patientUpdate(
        first_name="robert",
        last_name="MCDONALD",
    )
    assert pu.first_name == "Robert"
    assert pu.last_name == "McDonald"

