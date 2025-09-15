#!/bin/bash
# partially written by chatGPT 4o, then modified by pete
# Check if the required argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <destination_directory_name>"
  exit 1
fi
# stash any changes - this is a master! We don't want it to remain virgin
git stash
# Make dir and copy files to new dir
RENAME='# 11tyXploreTemplate - For practicing with 11ty'
RENAMETO="# \`$1\` - For practicing with 11ty"
DEST_DIR_NAME=$1
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$(dirname "$SOURCE_DIR")/$DEST_DIR_NAME"
cp -r "$SOURCE_DIR" "$DEST_DIR"
echo ""
echo "This project has been copied"
echo "  to $DEST_DIR"
cd "$DEST_DIR"
# remove the copy script so that this project is the cloned project. You don't want to keep making copies of copies, right?
rm copy.sh
# Remove git and reinitialize
rm -rf .git
git init
git add .
git commit -m "Initial commit"
# Install dependencies using npm
npm i
# replace FIXME in README.md with dirname
sed -i "s/$RENAME/$RENAMETO/g" README.md
code . # open in VS Code - has no effect if not installed on your system
cd "$SOURCE_DIR"
