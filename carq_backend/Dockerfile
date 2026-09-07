FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir 'cbor2>=5.4.2,<6' && pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir websockets

COPY . .

EXPOSE 8000
