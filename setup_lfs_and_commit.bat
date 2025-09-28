@echo off
echo Setting up Git LFS for Krishi Mitra models...
echo.

echo Step 1: Installing Git LFS...
git lfs install

echo.
echo Step 2: Adding .gitattributes file...
git add .gitattributes

echo.
echo Step 3: Adding updated .gitignore...
git add .gitignore

echo.
echo Step 4: Adding model files (will be tracked by LFS)...
git add model/

echo.
echo Step 5: Committing changes...
git commit -m "Setup Git LFS for model files"

echo.
echo Step 6: Pushing to GitHub...
git push origin main

echo.
echo ✅ Done! Your models are now available in GitHub via Git LFS.
echo Your friend can simply clone the repo and models will be downloaded automatically.
echo.
pause
