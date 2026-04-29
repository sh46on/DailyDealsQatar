FROM python:3.11-slim

WORKDIR /app

# 🔥 Prevent Python from buffering logs
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    netcat-openbsd \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Make wait script executable
RUN chmod +x wait-for-rabbitmq.sh

# Default command (used by web container)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]