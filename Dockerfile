FROM node:22-bookworm-slim
WORKDIR /app
COPY . .
RUN node scripts/preflight.mjs
ENV HOST=0.0.0.0 PORT=8787 DATA_DIR=/data
EXPOSE 8787
CMD ["node","server.mjs"]
