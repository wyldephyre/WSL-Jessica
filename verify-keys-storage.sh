#!/bin/bash
# Verify API keys are stored in all 3 backup locations

echo "=========================================="
echo "Jessica API Keys Storage Verification"
echo "=========================================="
echo ""

# Location 1: Password Manager (manual check)
echo "Location 1: Password Manager"
echo "  ✓ You have keys stored in password manager (manual verification)"
echo ""

# Location 2: Encrypted backup file
echo "Location 2: Encrypted Backup File"
ENCRYPTED_FILE="$HOME/.jessica-keys-backup.txt.enc"
if [ -f "$ENCRYPTED_FILE" ]; then
    echo "  ✓ Encrypted backup exists: $ENCRYPTED_FILE"
    ls -lh "$ENCRYPTED_FILE" | awk '{print "    Size: " $5 "  Permissions: " $1}'
else
    echo "  ✗ Encrypted backup NOT FOUND"
    echo "    Run: ./encrypt-keys-backup.sh to create it"
fi
echo ""

# Location 3: ~/.bashrc
echo "Location 3: ~/.bashrc"
KEYS_IN_BASHRC=$(grep -cE '^export (ANTHROPIC_API_KEY|XAI_API_KEY|GROQ_API_KEY|GOOGLE_AI_API_KEY|MEM0_API_KEY)=' ~/.bashrc 2>/dev/null || echo "0")
if [ "$KEYS_IN_BASHRC" -ge 5 ]; then
    echo "  ✓ All 5 API keys found in ~/.bashrc"
    echo "    Keys configured: $KEYS_IN_BASHRC/5"
else
    echo "  ⚠️  Only $KEYS_IN_BASHRC/5 keys found in ~/.bashrc"
    echo "    Missing keys may need to be added"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary:"
echo "  1. Password Manager: ✓ (manual)"
if [ -f "$ENCRYPTED_FILE" ]; then
    echo "  2. Encrypted Backup: ✓"
else
    echo "  2. Encrypted Backup: ✗ (run encrypt-keys-backup.sh)"
fi
if [ "$KEYS_IN_BASHRC" -ge 5 ]; then
    echo "  3. ~/.bashrc: ✓"
else
    echo "  3. ~/.bashrc: ⚠️  ($KEYS_IN_BASHRC/5 keys)"
fi
echo "=========================================="

