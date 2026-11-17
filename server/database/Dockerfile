# MySQL image with the portfolio schema and seed baked in.
#
# Baking the SQL into the image avoids bind-mounting individual files at
# runtime. Docker Desktop on Windows cannot mount files from removable
# drives: they appear inside the container as empty directories, so MySQL
# starts with no tables. A build context is transferred over the API and
# works regardless of where the project lives.
FROM mysql:26.10

LABEL maintainer="Mayuresh Kasar"
LABEL description="Portfolio MySQL database with schema and seed data"

# The MySQL entrypoint runs files in alphabetical order on first start, so
# schema.sql is applied before seed.sql.
COPY schema.sql /docker-entrypoint-initdb.d/schema.sql
COPY seed.sql /docker-entrypoint-initdb.d/seed.sql

# The official image starts as root only to chown a fresh data directory and
# then drops to mysql. The named volume is created with mysql ownership, and
# the entrypoint supports running unprivileged, so run as the mysql user
# (UID/GID 999) from the start. This removes container root entirely
# (Trivy DS-0002).
USER 999:999
