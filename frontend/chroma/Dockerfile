FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir chromadb==0.4.24

EXPOSE 8000

ENV CHROMA_HOST=0.0.0.0
ENV CHROMA_PORT=8000

CMD ["sh", "-c", "chromadb run --host 0.0.0.0 --port 8000"]