# GitHub Personal Access Token Setup

## Step 1: Create Personal Access Token on GitHub

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Jessica-WSL-Migration` (or any name you prefer)
4. Set expiration: Choose your preference (90 days, 1 year, or no expiration)
5. Select scopes: Check **`repo`** (this gives full repository access)
6. Click **"Generate token"**
7. **COPY THE TOKEN IMMEDIATELY** - you won't be able to see it again!

## Step 2: Configure Git to Use the Token

You have two options:

### Option A: Use Token in URL (One-time, stored in credential helper)

```bash
cd /home/phyre/jessica-core

# Push using token in URL (replace YOUR_TOKEN with actual token)
git push https://YOUR_TOKEN@github.com/wyldephyre/WSL-Jessica.git main

# Or update remote to include token
git remote set-url origin https://YOUR_TOKEN@github.com/wyldephyre/WSL-Jessica.git
git push -u origin main
```

### Option B: Use Git Credential Helper (Recommended - stores securely)

```bash
cd /home/phyre/jessica-core

# Configure credential helper to store token
git config --global credential.helper store

# When you push, it will prompt for username and password
# Username: your GitHub username
# Password: paste your PAT token (not your GitHub password)
git push -u origin main
```

### Option C: Use GitHub CLI (If installed)

```bash
gh auth login
# Follow prompts, select GitHub.com, HTTPS, authenticate in browser
git push -u origin main
```

## Step 3: Verify Push

After successful push:
```bash
git ls-remote origin
```

Should show your branches on the remote.

## Security Notes

- **Never commit the token to git** - it's already in `.gitignore`
- The token is stored in `~/.git-credentials` (if using credential helper)
- If token is compromised, revoke it immediately on GitHub
- Use fine-grained tokens for production (more secure than classic tokens)

## Troubleshooting

**"Authentication failed"**
- Double-check token was copied correctly (no extra spaces)
- Verify token has `repo` scope
- Make sure you're using the token as the password, not your GitHub password

**"Permission denied"**
- Verify you have write access to `wyldephyre/WSL-Jessica` repository
- Check you're logged into the correct GitHub account

---

**Quick Command Reference:**
```bash
# After getting token, run:
cd /home/phyre/jessica-core
git config --global credential.helper store
git push -u origin main
# When prompted:
# Username: your_github_username
# Password: paste_your_PAT_token_here
```

