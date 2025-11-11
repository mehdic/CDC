import bcrypt

# Generate hash for Test123!
password = b'Test123!'
salt = bcrypt.gensalt(rounds=10)
hash = bcrypt.hashpw(password, salt)

print(f"New hash for Test123!: {hash.decode()}")

# Verify it works
if bcrypt.checkpw(password, hash):
    print("Verification test: PASSED")
else:
    print("Verification test: FAILED")