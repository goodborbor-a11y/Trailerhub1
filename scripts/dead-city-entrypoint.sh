#!/bin/sh
set -eu

SOURCE_FILE=/run/dead-city-secrets-source/google-play-verifier.json
SECRET_DIR=/run/dead-city-secrets
DESTINATION_FILE=$SECRET_DIR/google-play-verifier.json

fail() {
  echo "Credential preparation failed." >&2
  exit 1
}

[ -f "$SOURCE_FILE" ] || fail
[ ! -L "$SOURCE_FILE" ] || fail
[ "$(stat -c '%u:%g:%a' "$SOURCE_FILE" 2>/dev/null)" = "0:0:600" ] || fail
[ -d "$SECRET_DIR" ] || fail
[ ! -L "$SECRET_DIR" ] || fail

umask 077
cp "$SOURCE_FILE" "$DESTINATION_FILE" || fail
chown 1001:1001 "$DESTINATION_FILE" || fail
chmod 0400 "$DESTINATION_FILE" || fail
chown 0:1001 "$SECRET_DIR" || fail
chmod 0710 "$SECRET_DIR" || fail

[ -f "$DESTINATION_FILE" ] || fail
[ ! -L "$DESTINATION_FILE" ] || fail
[ "$(stat -c '%u:%g:%a' "$DESTINATION_FILE" 2>/dev/null)" = "1001:1001:400" ] || fail

exec su-exec 1001:1001 dumb-init -- "$@"
