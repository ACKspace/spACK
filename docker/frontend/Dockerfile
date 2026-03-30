FROM node:24-alpine

# git is required by vite.config.ts (git describe/log/rev-parse calls at build time)
RUN apk add --no-cache git && \
    git config --global --add safe.directory /app

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

EXPOSE 3000

CMD ["sh", "-c", "git submodule update --init --recursive && npm start -- --host 0.0.0.0"]
