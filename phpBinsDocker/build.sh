#!/bin/bash
#
docker buildx create --append --use --name builder-0bebb35c-3c64-437a-84a5-5461f072efd8 ubuntu
docker buildx build --tag sirherobrine23/phpbinbuild:latest --platform linux/amd64,linux/arm64 --file dockerfile .