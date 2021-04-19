#!/bin/bash
#
docker buildx build --tag sirherobrine23/phpbinbuild:latest --platform linux/amd64,linux/arm64 --file dockerfile .