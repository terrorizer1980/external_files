#!/bin/bash
set -ex
git clone https://github.com/pmmp/php-build-scripts.git /tmp/php
cd /tmp/php
. compile.sh -j$(nproc)
ls -la

case $(uname -m) in
    x86_64) ARCH="x64";;
    *) ARCH="$(uname -m)";;
esac

zip -q /tmp/out/Linux_${ARCH}_php.zip -r bin/
exit 0
