# Stage 1: Build the app
FROM node:20-alpine AS builder

WORKDIR /app

COPY . .
RUN npm install
RUN npm run build

# Stage 2: Run the app
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env ./

ENV NODE_ENV=production

CMD ["node", "dist/main"]