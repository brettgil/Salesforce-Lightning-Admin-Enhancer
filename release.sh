#!/usr/bin/env bash
# Builds the Chrome Web Store zip for a tagged release, from the tag itself so uncommitted
# changes never ship, and optionally uploads it.
#
# Usage: ./release.sh [--upload | --submit | --publish] [tag]   (tag defaults to v<manifest version>)
#   (no flag)   build the zip only
#   --upload    build, then upload as a draft (not submitted for review)
#   --submit    submit the draft already uploaded for review (nothing is uploaded)
#   --publish   build, upload, and submit for review in one go
#   --store-credentials   save the upload credentials to your login Keychain (one-time setup)
#
# The upload credentials (OAuth client ID, client secret, refresh token) are kept in one login
# Keychain item that trusts no apps, so macOS asks you each time anything reads it, this script
# included. Click Allow, never Always Allow, or that prompt goes away for good. The values are
# handed to the upload command only; they are never exported to your shell or passed as arguments.
# Set it up, or replace it after getting a new refresh token, with: ./release.sh --store-credentials
# A new refresh token comes from: npx --yes chrome-webstore-upload-keys@2.0.1
set -euo pipefail
cd "$(dirname "$0")"

EXTENSION_ID=olomokophmlanmpfkejaijmgbihaemkl
# Pinned exactly: these tools run with the store credentials, so a new release must be a choice.
UPLOAD_CLI=chrome-webstore-upload-cli@3.5.0
KEYCHAIN_ITEM=slae-chrome-web-store-upload

mode=build
case "${1:-}" in
  --upload) mode=upload; shift ;;
  --submit) mode=submit; shift ;;
  --publish) mode=publish; shift ;;
  --store-credentials) mode=store; shift ;;
  -*) echo "Unknown option $1. Usage: ./release.sh [--upload | --submit | --publish | --store-credentials] [tag]" >&2; exit 1 ;;
esac

if [[ $mode == store ]]; then
  # Uses CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN from the environment when set (so you can move
  # them out of a shell profile); otherwise asks for each one without echoing it.
  for name in CLIENT_ID CLIENT_SECRET REFRESH_TOKEN; do
    if [[ -z "${!name:-}" ]]; then
      read -rsp "$name: " "${name?}"; echo
    fi
    if [[ -z "${!name}" || "${!name}" == *[[:space:]]* ]]; then
      echo "$name is empty or contains spaces; nothing saved." >&2
      exit 1
    fi
  done
  # -T "" trusts no apps, so every later read asks you first. -U replaces an existing item.
  security add-generic-password -U -T "" -a "$USER" -s "$KEYCHAIN_ITEM" \
    -l "SLAE Chrome Web Store upload" -w "$CLIENT_ID $CLIENT_SECRET $REFRESH_TOKEN"
  echo "Saved to the login Keychain as \"SLAE Chrome Web Store upload\"."
  exit 0
fi

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

if [[ $mode == build ]]; then
  echo
  echo "Upload as a draft:        ./release.sh --upload $tag"
  echo "Upload and submit:        ./release.sh --publish $tag"
  echo "Or upload $out by hand in the Chrome Web Store developer dashboard."
  exit 0
fi

# One Keychain prompt per run: macOS asks before handing the item over.
echo "macOS will ask to use the \"SLAE Chrome Web Store upload\" Keychain item. Click Allow."
if ! creds=$(security find-generic-password -a "$USER" -s "$KEYCHAIN_ITEM" -w 2>/dev/null); then
  echo "Couldn't read the Keychain item (not set up, or access denied). Set it up with: ./release.sh --store-credentials" >&2
  exit 1
fi
read -r client_id client_secret refresh_token <<<"$creds"
unset creds

case $mode in
  upload) args=(upload --source "$out") ;;
  submit) args=(publish) ;;
  publish) args=(--source "$out") ;;
esac
# Environment for this one command only; arguments would show up in `ps`.
EXTENSION_ID=$EXTENSION_ID CLIENT_ID=$client_id CLIENT_SECRET=$client_secret REFRESH_TOKEN=$refresh_token \
  npx --yes "$UPLOAD_CLI" "${args[@]}"

if [[ $mode == upload ]]; then
  echo "Uploaded $version as a draft. Check it in the developer dashboard, then submit it with:"
  echo "  ./release.sh --submit $tag"
fi
