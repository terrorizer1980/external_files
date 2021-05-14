#!/bin/bash
set -ex
#
git clone https://github.com/pmmp/musl-cross-make.git /tmp/musl-cross-make 
cd /tmp/musl-cross-make
mv config.mak.dist config.mak
make install -j$(nproc)
#
git clone https://github.com/pmmp/php-build-scripts.git /tmp/php-build-scripts
cd /tmp/php-build-scripts
./compile.sh -t android-aarch64 -x -j$(nproc) -f
ls -la
zip -q /tmp/out/Android_aarch64_php.zip -r bin/
exit 0