FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p uploads logs

EXPOSE 8000

RUN echo '#!/bin/bash\npython -m alembic -x sqlalchemy.url=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB} upgrade head\nexec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}' > /start.sh && chmod +x /start.sh

ENTRYPOINT ["/bin/bash", "/start.sh"]