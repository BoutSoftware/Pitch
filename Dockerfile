ARG IMAGE_NAME=oven/bun:1

# ---------------------------- Builder Stage ---------------------------- #
FROM ${IMAGE_NAME} AS builder
WORKDIR /app

COPY bun.lockb package*.json ./
RUN bun install

COPY . .

# ARG ENV_VARS
# RUN echo "$ENV_VARS" > .env

RUN bun run build

# ---------------------------- Runner Stage ---------------------------- #
FROM ${IMAGE_NAME} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Not needed for standalone output
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/package.json ./
# COPY --from=builder /app/next.config.ts ./
# COPY --from=builder /app/.env ./
# COPY --from=builder /app/node_modules ./node_modules 

# Using standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["bun", "server.js"]