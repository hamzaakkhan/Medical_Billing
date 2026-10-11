import re

# Known lowercase particles when in non-initial word position:
LOWERCASE_PARTICLES = {
    "van", "von", "der", "den", "de", "del", "della", "da", "di", "du", "la", "le", "bin", "ibn", "ter"
}

# Suffixes that should be uppercase or formatted specially:
ROMAN_NUMERALS = {"ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"}

# Common Scottish/Gaelic Mac stems where capitalization is standard (MacDonald, MacIntyre, etc.)
MAC_STEMS = {
    "donald", "gregor", "intyre", "kenzie", "lean", "leod", "millan", "pherson",
    "arthur", "kinnon", "lachlan", "dougall", "bain", "bride", "kay", "neil",
    "nicol", "rae", "queen", "tavish", "alister", "allister", "dermott"
}


def _normalize_subword(subword: str, is_first_word: bool, is_first_subword: bool) -> str:
    if not subword:
        return subword

    lower = subword.lower()

    # Check for generational / Roman numerals
    if lower in ROMAN_NUMERALS:
        return lower.upper()
    if lower in {"jr", "jr."}:
        return "Jr." if "." in subword else "Jr"
    if lower in {"sr", "sr."}:
        return "Sr." if "." in subword else "Sr"

    # Check for lowercase particles in non-initial word position
    if not is_first_word and lower in LOWERCASE_PARTICLES:
        return lower

    # Handle apostrophes within subword (e.g. O'Connor, D'Angelo, L'Oiseau)
    if "'" in subword:
        parts = subword.split("'")
        normalized_parts = []
        for idx, p in enumerate(parts):
            if not p:
                continue
            # If single-letter prefix like O', D', L'
            if idx == 0 and len(p) == 1:
                normalized_parts.append(p.upper())
            else:
                normalized_parts.append(_normalize_subword(p, is_first_word=False, is_first_subword=False))
        return "'".join(normalized_parts)

    # Check if subword is all-uppercase or all-lowercase
    is_all_caps = subword.isupper()
    is_all_lower = subword.islower()

    if is_all_caps or is_all_lower:
        # Check Mc prefix (e.g. mcdonald -> McDonald, mcclure -> McClure)
        if lower.startswith("mc") and len(lower) > 2:
            return "Mc" + lower[2].upper() + lower[3:]

        # Check Mac prefix
        if lower.startswith("mac") and len(lower) > 4:
            stem = lower[3:]
            if stem in MAC_STEMS:
                return "Mac" + stem[0].upper() + stem[1:]

        # Standard capitalization
        return subword[0].upper() + subword[1:].lower()

    # If subword is already mixed case (e.g. McDonald, MacDonald, DeLaCruz, LeBlanc),
    # preserve intentional inner capitalizations, but ensure initial letter is uppercase.
    return subword[0].upper() + subword[1:]


def normalize_name(name: str | None) -> str | None:
    """
    Normalizes a name component (first, middle, or last name) to standard,
    professional title capitalization while preserving legitimate formats:
    - Normalizes all-caps ('JOHN SMITH' -> 'John Smith')
    - Normalizes all-lower ('john smith' -> 'John Smith')
    - Handles hyphenated names ('mary-jane' -> 'Mary-Jane')
    - Handles apostrophes ('o\'connor' -> 'O\'Connor', 'd\'angelo' -> 'D\'Angelo')
    - Handles Celtic prefixes ('mcdonald' -> 'McDonald')
    - Handles Arabic prefixes ('al-hassan' -> 'Al-Hassan')
    - Preserves intentional mixed case ('MacDonald', 'de la Cruz')
    - Cleans excessive/surrounding whitespace and collapses spaces around hyphens/apostrophes
    """
    if name is None:
        return None

    # Replace typographic/curly apostrophes with standard single quote
    cleaned = (
        name.replace("’", "'")
        .replace("‘", "'")
        .replace("ʻ", "'")
        .replace("ʼ", "'")
        .replace("\u00a0", " ")
        .replace("\t", " ")
    )

    # Collapse whitespace around hyphens and apostrophes
    cleaned = re.sub(r"\s*-\s*", "-", cleaned)
    cleaned = re.sub(r"\s*'\s*", "'", cleaned)

    # Collapse multiple spaces into single space and trim
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    if not cleaned:
        return ""

    words = cleaned.split(" ")
    formatted_words = []

    for word_idx, word in enumerate(words):
        # Handle hyphenated tokens (e.g. Mary-Jane, Smith-Jones, Al-Hassan)
        if "-" in word:
            hyphen_parts = word.split("-")
            formatted_parts = [
                _normalize_subword(hp, is_first_word=(word_idx == 0 and p_idx == 0), is_first_subword=(p_idx == 0))
                for p_idx, hp in enumerate(hyphen_parts)
            ]
            formatted_words.append("-".join(formatted_parts))
        else:
            formatted_words.append(
                _normalize_subword(word, is_first_word=(word_idx == 0), is_first_subword=True)
            )

    return " ".join(formatted_words)


def format_full_name(first_name: str | None, middle_name: str | None = None, last_name: str | None = None) -> str:
    """
    Combines first, middle, and last names into a clean, normalized full name.
    """
    parts = []
    if first_name:
        fn = normalize_name(first_name)
        if fn:
            parts.append(fn)
    if middle_name:
        mn = normalize_name(middle_name)
        if mn:
            parts.append(mn)
    if last_name:
        ln = normalize_name(last_name)
        if ln:
            parts.append(ln)

    return " ".join(parts)


def get_name_initials(first_name: str | None, last_name: str | None = None) -> str:
    """
    Generates a clean 2-character uppercase initials badge (e.g. 'JS' for John Smith).
    """
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

