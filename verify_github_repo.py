#!/usr/bin/env python3
"""
Verification script to check GitHub repository connectivity and contents.
Tests both local git remotes and GitHub API access.
"""

import subprocess
import sys
import json
import requests
from pathlib import Path

def run_git_command(cmd):
    """Run a git command and return the output."""
    try:
        # Use WSL to run git commands if we're on Windows with WSL path
        if sys.platform == 'win32' and 'wsl.localhost' in str(Path.cwd()):
            # Extract the WSL path and run via wsl command
            wsl_path = str(Path.cwd()).replace('\\wsl.localhost\\Ubuntu', '').replace('\\', '/')
            wsl_cmd = f"wsl bash -c 'cd {wsl_path} && {cmd}'"
            result = subprocess.run(
                wsl_cmd,
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
        else:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"Error: {e.stderr.strip()}"

def check_git_remotes():
    """Check configured git remotes."""
    print("=" * 60)
    print("GIT REMOTE VERIFICATION")
    print("=" * 60)
    
    remotes = run_git_command("git remote -v")
    print("\nConfigured remotes:")
    print(remotes)
    
    return remotes

def check_remote_branches():
    """Check branches on jessica-ai remote."""
    print("\n" + "=" * 60)
    print("JESSICA-AI REMOTE BRANCHES")
    print("=" * 60)
    
    branches = run_git_command("git ls-remote --heads jessica-ai")
    print("\nBranches on jessica-ai:")
    print(branches)
    
    return branches

def check_remote_files(branch="main"):
    """Check files on remote branch."""
    print("\n" + "=" * 60)
    print(f"FILES ON jessica-ai/{branch}")
    print("=" * 60)
    
    files = run_git_command(f"git ls-tree -r --name-only jessica-ai/{branch}")
    file_list = files.split('\n') if files else []
    
    print(f"\nFound {len(file_list)} files:")
    for file in file_list[:20]:  # Show first 20
        print(f"  - {file}")
    if len(file_list) > 20:
        print(f"  ... and {len(file_list) - 20} more files")
    
    # Check for key files
    key_files = {
        "jessica_core.py": "Main Flask application",
        "master_prompt.txt": "Jessica's personality prompt",
        "README.md": "Project documentation",
        "requirements.txt": "Python dependencies"
    }
    
    print("\n" + "=" * 60)
    print("KEY FILES CHECK")
    print("=" * 60)
    
    all_present = True
    for file, description in key_files.items():
        if file in file_list:
            print(f"✓ {file} - {description}")
        else:
            print(f"✗ {file} - MISSING!")
            all_present = False
    
    # Check for old files that shouldn't be there
    old_files = ["src/jessica_mvp.py", "src/"]
    print("\n" + "=" * 60)
    print("OLD CODE CHECK (should NOT be present)")
    print("=" * 60)
    
    old_found = False
    for old_file in old_files:
        if any(old_file in f for f in file_list):
            print(f"✗ Found old file structure: {old_file}")
            old_found = True
    
    if not old_found:
        print("✓ No old code structure found")
    
    return all_present and not old_found

def check_github_api(repo_owner="wyldephyre", repo_name="jessica-ai"):
    """Check repository via GitHub API (if possible)."""
    print("\n" + "=" * 60)
    print("GITHUB API VERIFICATION")
    print("=" * 60)
    
    try:
        url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            contents = response.json()
            print(f"\n✓ Successfully connected to GitHub API")
            print(f"Repository: {repo_owner}/{repo_name}")
            print(f"\nRoot files:")
            
            for item in contents[:10]:
                if item['type'] == 'file':
                    print(f"  - {item['name']} ({item['size']} bytes)")
            
            # Check for jessica_core.py
            file_names = [item['name'] for item in contents if item['type'] == 'file']
            if 'jessica_core.py' in file_names:
                print("\n✓ jessica_core.py found via API")
                return True
            else:
                print("\n✗ jessica_core.py NOT found via API")
                return False
        else:
            print(f"✗ API request failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Could not connect to GitHub API: {e}")
        print("  (This is normal if you don't have internet access or API rate limits)")
        return None

def main():
    """Run all verification checks."""
    print("\n" + "=" * 60)
    print("GITHUB REPOSITORY VERIFICATION")
    print("=" * 60)
    print(f"Working directory: {Path.cwd()}")
    
    # Check git remotes
    check_git_remotes()
    
    # Check remote branches
    check_remote_branches()
    
    # Check files on main branch
    main_ok = check_remote_files("main")
    
    # Check files on master branch
    print("\n" + "=" * 60)
    print("ALSO CHECKING master BRANCH")
    print("=" * 60)
    master_ok = check_remote_files("master")
    
    # Try GitHub API
    api_ok = check_github_api()
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    if main_ok:
        print("✓ main branch has correct files")
    else:
        print("✗ main branch has issues")
    
    if master_ok:
        print("✓ master branch has correct files")
    else:
        print("✗ master branch has issues")
    
    if api_ok is True:
        print("✓ GitHub API verification successful")
    elif api_ok is False:
        print("✗ GitHub API verification failed")
    else:
        print("? GitHub API verification skipped (no internet/rate limit)")
    
    print("\n" + "=" * 60)
    
    if main_ok and master_ok:
        print("✓ ALL CHECKS PASSED - Repository is correctly configured!")
        return 0
    else:
        print("✗ SOME CHECKS FAILED - Review output above")
        return 1

if __name__ == "__main__":
    sys.exit(main())

