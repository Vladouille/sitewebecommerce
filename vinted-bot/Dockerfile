FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY vinted_bot ./vinted_bot
ENV PYTHONUNBUFFERED=1 VINTED_BOT_CONFIG=/app/config.yaml
CMD ["python", "-m", "vinted_bot.main"]
