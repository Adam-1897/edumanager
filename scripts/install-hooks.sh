#!/bin/sh
# Installs the secret-blocking pre-commit hook into this clone's .git/hooks
cd "$(git rev-parse --show-toplevel)" || exit 1
cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "✔ pre-commit secret check installed"
