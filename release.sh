#!/usr/bin/env bash
# Builds the Chrome Web Store zip for a tagged release, from the tag itself so uncommitted
# changes never ship. Prints the upload command; uploading is left to you.
#
# Usage: ./release.sh [tag]      (defaults to v<version in manifest.json>)
set -euo pipefail
cd "$(dirname "$0")"

manifest_version() {
  sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' | head -1
}

tag=${1:-v$(manifest_version < manifest.json)}
if ! git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
  echo "No tag $tag. Tag the release merge first: git tag -a $tag -m $tag <commit>" >&2
  exit 1
fi

version=$(git show "$tag:manifest.json" | manifest_version)
if [[ "v$version" != "$tag" ]]; then
  echo "Tag $tag has manifest version $version; they should match." >&2
  exit 1
fi

mkdir -p dist
out="dist/salesforce-lightning-admin-enhancer-$version.zip"
rm -f "$out"
# Everything the extension loads; dev-only files and unused icons stay out.
git archive --format=zip -o "$out" "$tag" -- . \
  ':(exclude)tests' \
  ':(exclude)README.md' \
  ':(exclude).gitignore' \
  ':(exclude)release.sh' \
  ':(exclude)lightning_stylized_icon__1__oxq_icon.ico' \
  ':(exclude)lightning_stylized_icon__1__icon-128.png'

echo "Built $out ($(unzip -Z1 "$out" | grep -vc "/$") files, $(du -h "$out" | cut -f1 | xargs))"
echo
echo "Upload and submit for review (needs EXTENSION_ID, CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN set):"
echo
echo "  npx chrome-webstore-upload-cli@3 --source $out --extension-id \"\$EXTENSION_ID\" --client-id \"\$CLIENT_ID\" --client-secret \"\$CLIENT_SECRET\" --refresh-token \"\$REFRESH_TOKEN\""
echo
echo "Or upload $out by hand in the Chrome Web Store developer dashboard."
