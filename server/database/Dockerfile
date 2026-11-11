# MySQL image with the portfolio schema and seed baked in.
#
# Baking the SQL into the image avoids bind-mounting individual files at
# runtime. Docker Desktop on Windows cannot mount files from removable
# drives: they appear inside the container as empty directories, so MySQL
# starts with no tables. A build context is transferred over the API and
# works regardless of where the project lives.
FROM mysql:8.0

LABEL maintainer="Mayuresh Kasar"
LABEL description="Portfolio MySQL database with schema and seed data"

# The MySQL entrypoint runs files in alphabetical order on first start, so
# schema.sql is applied before seed.sql.
COPY schema.sql /docker-entrypoint-initdb.d/schema.sql
COPY seed.sql /docker-entrypoint-initdb.d/seed.sql
