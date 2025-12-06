#!/bin/bash
# Encrypt Jessica API keys backup file
# This creates an encrypted backup of your API keys

set -e

BACKUP_FILE="$HOME/.jessica-keys-backup.txt"
ENCRYPTED_FILE="$HOME/.jessica-keys-backup.txt.enc"

echo "=========================================="
echo "Jessica API Keys Encryption"
echo "=========================================="
echo ""

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    echo "   Creating it from ~/.bashrc..."
    
    # Source bashrc to get the keys
    source ~/.bashrc 2>/dev/null || true
    
    # Create backup file from environment variables
    {
        echo "# Jessica API Keys Backup - Location #2"
        echo "# Created: $(date)"
        echo "# Encrypted with OpenSSL for secure storage"
        echo ""
        [ -n "$ANTHROPIC_API_KEY" ] && echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY"
        [ -n "$XAI_API_KEY" ] && echo "XAI_API_KEY=$XAI_API_KEY"
        [ -n "$GOOGLE_AI_API_KEY" ] && echo "GOOGLE_AI_API_KEY=$GOOGLE_AI_API_KEY"
        [ -n "$GROQ_API_KEY" ] && echo "GROQ_API_KEY=$GROQ_API_KEY"
        [ -n "$MEM0_API_KEY" ] && echo "MEM0_API_KEY=$MEM0_API_KEY"
    } > "$BACKUP_FILE"
    
    if [ ! -s "$BACKUP_FILE" ] || [ $(wc -l < "$BACKUP_FILE") -lt 5 ]; then
        echo "⚠️  WARNING: Could not read keys from ~/.bashrc"
        echo "   Make sure you've run: source ~/.bashrc"
        echo "   Or manually create $BACKUP_FILE with your keys"
        exit 1
    fi
    
    echo "✅ Backup file created from ~/.bashrc"
    echo ""
fi

echo "STEP 1: You're about to CREATE a passphrase (password)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: You don't need to know a passphrase yet!"
echo "   You're going to CREATE one right now."
echo ""
echo "When prompted:"
echo "  1. Type a STRONG password (you'll need to remember it)"
echo "  2. Press Enter"
echo "  3. Type the SAME password again to confirm"
echo "  4. Press Enter"
echo ""
echo "💡 TIP: Use a password you'll remember, or save it in your"
echo "   password manager along with your API keys."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Ready to encrypt? Press Enter to continue (or Ctrl+C to cancel)..."
echo ""

# Encrypt with AES-256-CBC
echo "Encrypting file..."
openssl enc -aes-256-cbc -salt -pbkdf2 -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Encryption successful!"
    echo "   Encrypted file: $ENCRYPTED_FILE"
    
    # Set secure permissions
    chmod 600 "$ENCRYPTED_FILE"
    
    # Remove plaintext
    echo ""
    echo "STEP 2: Clean up plaintext file"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "Delete plaintext backup file? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$BACKUP_FILE"
        echo "✅ Plaintext file removed"
    else
        echo "⚠️  Plaintext file kept at: $BACKUP_FILE"
        echo "   Remember to delete it manually after verifying encryption!"
    fi
    
    echo ""
    echo "=========================================="
    echo "✅ DONE! Your keys are now encrypted."
    echo "=========================================="
    echo ""
    echo "To decrypt later (if needed):"
    echo "  openssl enc -aes-256-cbc -d -pbkdf2 \\"
    echo "    -in $ENCRYPTED_FILE \\"
    echo "    -out $BACKUP_FILE"
    echo ""
    echo "You'll need the SAME passphrase you just created."
    echo ""
else
    echo ""
    echo "❌ Encryption failed"
    exit 1
fi

