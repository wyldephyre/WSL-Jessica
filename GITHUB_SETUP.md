# GitHub Repository Setup Guide

Your local git repository is ready! Follow these steps to create the GitHub repository and connect it.

## Step 1: Create Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the repository details:
   - **Repository name**: `jessica-core` (or your preferred name)
   - **Description**: "Cognitive prosthetic AI system for disabled veterans"
   - **Visibility**: Select **Private** (as requested)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands (replace `YOUR_USERNAME` with your GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/jessica-core.git
git branch -M main
git push -u origin main
```

**Note**: If your local branch is `master` instead of `main`, use:
```bash
git remote add origin https://github.com/YOUR_USERNAME/jessica-core.git
git branch -M main
git push -u origin main
```

Or if you prefer to keep `master`:
```bash
git remote add origin https://github.com/YOUR_USERNAME/jessica-core.git
git push -u origin master
```

## Step 3: Verify Connection

After pushing, verify everything worked:

```bash
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/jessica-core.git (fetch)
origin  https://github.com/YOUR_USERNAME/jessica-core.git (push)
```

## Alternative: Using SSH (if you have SSH keys set up)

If you prefer SSH over HTTPS:

```bash
git remote add origin git@github.com:YOUR_USERNAME/jessica-core.git
git branch -M main
git push -u origin main
```

## Troubleshooting

### Authentication Issues
If you get authentication errors when pushing:
- Use a Personal Access Token (PAT) instead of password
- Generate one at: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Use the token as your password when prompted

### Branch Name Mismatch
If GitHub created the repo with `main` but your local is `master`:
```bash
git branch -M main
git push -u origin main
```

## Next Steps

Once your repository is on GitHub:
- Your code is now backed up and version controlled
- You can collaborate with others
- You can set up CI/CD pipelines
- You can create issues and track work

---

**Current Status:**
✅ Local git repository initialized
✅ Initial commit created
✅ All files committed
⏳ Waiting for GitHub repository creation and connection

