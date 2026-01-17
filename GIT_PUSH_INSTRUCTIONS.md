# Git Push Instructions

## Quick Push with Personal Access Token

### Step 1: Create Personal Access Token (if you don't have one)

1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Campus Trails Push"
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Push Using Token

When git asks for password, use your **Personal Access Token** instead of your GitHub password.

```bash
git push origin main
```

**Username**: Your GitHub username  
**Password**: Your Personal Access Token (not your GitHub password)

### Alternative: Configure Git Credential Helper

```bash
# Store credentials (Linux/Mac)
git config --global credential.helper store

# Then push (will ask once, then remember)
git push origin main
```

### Alternative: Use SSH (More Secure)

1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add to SSH agent:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. Copy public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. Add to GitHub:
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key

5. Change remote to SSH:
   ```bash
   git remote set-url origin git@github.com:BarbaronaKJ/Campus-Trails.git
   ```

6. Push:
   ```bash
   git push origin main
   ```
