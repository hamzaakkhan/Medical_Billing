import re


def _capitalize_part(part: str) -> str:
    """Capitalize a single name piece, preserving intentional mixed-case."""
    if not part:
        return ""
    if part.isupper() or part.islower():
        return part.capitalize()
    return part[0].upper() + part[1:]


def _normalize_word(word: str) -> str:
    """Normalize a word token handling hyphens and apostrophes."""
    return "-".join(
        "'".join(_capitalize_part(p) for p in hyp_part.split("'"))
        for hyp_part in word.split("-")
    )


def normalize_name(name: str | None) -> str | None:
    """
    Normalizes a name string with whitespace cleanup, standard capitalization,
    hyphenated names, and apostrophe handling.

    Handles None and empty strings gracefully. Preserves intentional mixed-case.
    """
    if name is None:
        return None

    # Replace typographic apostrophes and collapse surrounding whitespace
    cleaned = re.sub(r"[’‘ʻʼ]", "'", name)
    cleaned = re.sub(r"\s*-\s*", "-", cleaned)
    cleaned = re.sub(r"\s*'\s*", "'", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if not cleaned:
        return ""

    return " ".join(_normalize_word(word) for word in cleaned.split(" "))


def format_full_name(
    first_name: str | None,
    middle_name: str | None = None,
    last_name: str | None = None,
) -> str:
    """Combines first, middle, and last names into a clean, normalized full name."""
    parts = []
    for name in (first_name, middle_name, last_name):
        if name:
            normalized = normalize_name(name)
            if normalized:
                parts.append(normalized)
    return " ".join(parts)


def get_name_initials(first_name: str | None, last_name: str | None = None) -> str:
    """Generates uppercase initials (e.g. 'JS' for John Smith) with 'U' as fallback."""
    fn = (normalize_name(first_name) or "").strip()
    ln = (normalize_name(last_name) or "").strip()

    first_init = fn[0].upper() if fn else ""
    last_init = ln[0].upper() if ln else ""

    if first_init and last_init:
        return f"{first_init}{last_init}"
    if first_init:
        return first_init
    if last_init:
        return last_init
    return "U"
