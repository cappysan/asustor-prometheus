#!/usr/bin/env bash

set -eu -o pipefail

as_ssh=${1}

rm *.apk *.apk.sig || true
make pc
make apk

KEYID="0x5F36B321543E36D9"
as_file="$(ls -d *.apk | xargs)"
gpg --no-default-keyring --default-key ${KEYID} --output ${as_file}.sig --detach-sig --sign ${as_file}

as_pkg="$(grep -A1 project pyproject.toml | head -2 | tail -1 | cut -d= -f2 | xargs | cut -d- -f2-5)"
rsync --ignore-existing -av cappysan-*_*.apk* ${as_ssh}:asustor-downloads/${as_pkg}/

echo ""
ssh ${as_ssh} "cd asustor-downloads/${as_pkg} && md5sum --check < MD5SUMS && md5sum *apk *apk.sig > MD5SUMS"
echo ""
ssh ${as_ssh} "cd asustor-downloads/${as_pkg} && sha512sum --check < SHA512SUMS && sha512sum *apk *apk.sig > SHA512SUMS"
