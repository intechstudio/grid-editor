# Serves a pre-built static directory. The build itself happens in GitHub
# Actions, so this image is only a copy -- nothing is compiled on the VPS.
FROM nginx:1.27-alpine

# Links the GHCR package to this repository, which is what gives the
# repository's GITHUB_TOKEN the admin role needed to delete versions.
LABEL org.opencontainers.image.source="https://github.com/intechstudio/grid-editor"

# dist-web for the editor, playwright-report for the test reports.
ARG CONTENT_DIR=dist-web

COPY docker/preview/nginx.conf /etc/nginx/conf.d/default.conf
COPY ${CONTENT_DIR}/ /usr/share/nginx/html/
