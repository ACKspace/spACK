FROM php:8-cli-alpine

WORKDIR /app

EXPOSE 8081

# DOCUMENT_ROOT is /app/public; spACK_config.php is loaded from one level up (/app)
CMD ["php", "-S", "0.0.0.0:8081", "-t", "/app/public", "/app/public/token/index.php"]
