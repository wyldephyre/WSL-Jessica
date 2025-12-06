# API Keys Storage - 3 Location Backup System

## Current Status

Your API keys are now stored in **3 secure locations**:

### Location 1: Password Manager ✓
- You have all keys stored in your password manager
- This is your primary backup location

### Location 2: Encrypted Backup File
- **Plaintext backup created**: `~/.jessica-keys-backup.txt`
- **To encrypt**: Run `./encrypt-keys-backup.sh` (requires interactive passphrase)
- **After encryption**: Delete the plaintext file manually
- **Encrypted file will be**: `~/.jessica-keys-backup.txt.enc`

### Location 3: ~/.bashrc ✓
- All 5 API keys are configured in `~/.bashrc`
- Keys are exported as environment variables
- This is your active configuration location

## Keys Stored

1. `ANTHROPIC_API_KEY` - Claude API
2. `XAI_API_KEY` - Grok API  
3. `GOOGLE_AI_API_KEY` - Gemini API
4. `GROQ_API_KEY` - Groq API
5. `MEM0_API_KEY` - Mem0 memory service

## Next Steps

### 1. Encrypt the Backup File

Run the encryption script:
```bash
cd ~/jessica-core
./encrypt-keys-backup.sh
```

You'll be prompted for a passphrase. **Use a strong password you'll remember!**

After encryption:
- The encrypted file will be at `~/.jessica-keys-backup.txt.enc`
- Delete the plaintext: `rm ~/.jessica-keys-backup.txt`

### 2. Verify All Locations

Run the verification script:
```bash
./verify-keys-storage.sh
```

### 3. Decrypt Backup (When Needed)

To restore keys from encrypted backup:
```bash
openssl enc -aes-256-cbc -d -pbkdf2 \
  -in ~/.jessica-keys-backup.txt.enc \
  -out ~/.jessica-keys-backup.txt
```

Then source the file or copy keys to desired location.

## Security Notes

- ✅ Plaintext keys removed from `CODE_AUDIT_2025-12-06_SESSION.md`
- ✅ `.env` file is in `.gitignore` (never committed)
- ✅ Encrypted backup uses AES-256-CBC encryption
- ✅ `~/.bashrc` is a standard secure location for environment variables
- ⚠️  Remember to encrypt the backup file before deleting plaintext

## Files Created

- `encrypt-keys-backup.sh` - Script to encrypt the backup file
- `verify-keys-storage.sh` - Script to verify all 3 locations
- `~/.jessica-keys-backup.txt` - Plaintext backup (encrypt before committing)

---

**For the forgotten 99%, we rise.** 🔥

