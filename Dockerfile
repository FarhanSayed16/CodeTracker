FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl python3 make g++

COPY server/package*.json ./server/
COPY dashboard/package*.json ./dashboard/

RUN cd server && npm ci
RUN cd dashboard && npm ci

COPY server ./server
COPY dashboard ./dashboard

RUN cd dashboard && npm run build
RUN cd server && npx prisma generate && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl wget

COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/public ./server/public
COPY --from=builder /app/dashboard/dist ./dashboard/dist

# Install production deps + prisma CLI + wget for healthchecks
WORKDIR /app/server
RUN npm ci --omit=dev && npm install prisma@5.19.1 --no-save

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
