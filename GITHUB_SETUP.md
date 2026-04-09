# 📤 How to Upload Record Room to GitHub

Follow these steps to upload your project to GitHub.

## Step 1: Initialize Git Repository

Open your terminal in the project directory and run:

```bash
git init
```

## Step 2: Add All Files

```bash
git add .
```

This stages all files for commit. The `.gitignore` file will automatically exclude sensitive files like `.env` and `node_modules/`.

## Step 3: Make Your First Commit

```bash
git commit -m "Initial commit: Record Room v1.0.0"
```

## Step 4: Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `record-room`
   - **Description**: "A beautiful, vintage-inspired music streaming application"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 5: Connect Your Local Repository to GitHub

GitHub will show you commands. Use these (replace `yourusername` with your GitHub username):

```bash
git remote add origin https://github.com/yourusername/record-room.git
git branch -M main
git push -u origin main
```

## Step 6: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files uploaded
3. Verify that `.env` is NOT visible (it should be ignored)

## 🔒 Important Security Notes

### Before Pushing to GitHub:

1. **Check .env is ignored**
   ```bash
   git status
   ```
   Make sure `.env` is NOT listed in files to be committed

2. **Never commit sensitive data**
   - Database credentials
   - API keys
   - Session secrets
   - Passwords

3. **Update .env.example**
   - Make sure `.env.example` has placeholder values only
   - No real credentials should be in `.env.example`

### If You Accidentally Committed .env:

```bash
# Remove from git but keep local file
git rm --cached .env

# Commit the removal
git commit -m "Remove .env from repository"

# Push changes
git push origin main
```

Then, rotate all your secrets (change passwords, regenerate API keys, etc.)

## 📝 Update Repository URL in package.json

After creating your GitHub repository, update `package.json`:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/yourusername/record-room.git"
}
```

Then commit and push:
```bash
git add package.json
git commit -m "Update repository URL"
git push
```

## 🎉 You're Done!

Your project is now on GitHub! You can:
- Share the repository link
- Enable GitHub Pages for documentation
- Set up GitHub Actions for CI/CD
- Invite collaborators
- Accept pull requests

## 🚀 Next Steps

1. **Add a nice README badge**: Update README.md with your actual GitHub URL
2. **Enable Issues**: Allow users to report bugs
3. **Add Topics**: Tag your repo with topics like `music`, `nodejs`, `supabase`
4. **Create Releases**: Tag versions for easy deployment
5. **Set up GitHub Actions**: Automate testing and deployment

## 📚 Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# Create a new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Pull latest changes
git pull origin main

# Push changes
git push origin main

# View remote URL
git remote -v
```

## 🆘 Need Help?

- [GitHub Docs](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub Desktop](https://desktop.github.com/) - GUI alternative to command line

---

Happy coding! 🎵
