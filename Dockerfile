# LM-Sense — multi-stage Dockerfile
# Purpose: builds a lean production image for all Python services
# Stage 1 installs deps, Stage 2 copies only what's needed

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build tools needed for some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

WORKDIR /app

# Runtime system deps only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Non-root user for security
RUN useradd -m -u 1000 lmsense && chown -R lmsense:lmsense /app
USER lmsense

ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

EXPOSE 8000

# Default command — override in docker-compose per service
CMD ["uvicorn", "services.api_gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]