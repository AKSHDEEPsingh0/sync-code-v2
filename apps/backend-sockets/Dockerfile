# Stage 1: Build Phase
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc

# Stage 2: Lean Production Runtime Phase
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
# Fix: Force apk to upgrade all baseline system packages to their latest secure versions
RUN apk update && apk upgrade --no-cache && apk add --no-cache python3
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 5000
CMD ["node", "dist/index.js"]
