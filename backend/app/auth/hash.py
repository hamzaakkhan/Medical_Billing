from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str | None, hashed_password: str | None) -> bool:
    if not password or not hashed_password:
        return False
    try:
        return password_hash.verify(password, hashed_password)
    except Exception:
        return False


# Pre-computed dummy hash using the recommended hasher to mitigate timing attacks
DUMMY_HASH = hash_password("dummy_mitigation_password")

# Backward compatibility aliases
hash = hash_password
verify_hash = verify_password
dummy_hash = DUMMY_HASH


