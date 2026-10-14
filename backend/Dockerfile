FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src src
COPY db db
COPY scripts scripts
RUN addgroup -S trivalink && adduser -S trivalink -G trivalink && mkdir -p /data && chown trivalink /data
USER trivalink
ENV PORT=3000 TRIVALINK_STORAGE_DIR=/data/evidence
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/api/health || exit 1
CMD ["node", "src/server.js"]
