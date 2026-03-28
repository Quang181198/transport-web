# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

# ── Dependencies ─────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# ── Builder ──────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (non-sensitive, baked into the bundle)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_DESCRIPTION
ARG NEXT_PUBLIC_COMPANY_NAME
ARG NEXT_PUBLIC_COMPANY_SHORT_NAME
ARG NEXT_PUBLIC_COMPANY_ADDRESS
ARG NEXT_PUBLIC_COMPANY_PHONE
ARG NEXT_PUBLIC_COMPANY_HOTLINE
ARG NEXT_PUBLIC_COMPANY_EMAIL
ARG NEXT_PUBLIC_COMPANY_EMAIL_ALT
ARG NEXT_PUBLIC_COMPANY_WEBSITE
ARG NEXT_PUBLIC_COMPANY_TAX_CODE
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_DESCRIPTION=$NEXT_PUBLIC_APP_DESCRIPTION
ENV NEXT_PUBLIC_COMPANY_NAME=$NEXT_PUBLIC_COMPANY_NAME
ENV NEXT_PUBLIC_COMPANY_SHORT_NAME=$NEXT_PUBLIC_COMPANY_SHORT_NAME
ENV NEXT_PUBLIC_COMPANY_ADDRESS=$NEXT_PUBLIC_COMPANY_ADDRESS
ENV NEXT_PUBLIC_COMPANY_PHONE=$NEXT_PUBLIC_COMPANY_PHONE
ENV NEXT_PUBLIC_COMPANY_HOTLINE=$NEXT_PUBLIC_COMPANY_HOTLINE
ENV NEXT_PUBLIC_COMPANY_EMAIL=$NEXT_PUBLIC_COMPANY_EMAIL
ENV NEXT_PUBLIC_COMPANY_EMAIL_ALT=$NEXT_PUBLIC_COMPANY_EMAIL_ALT
ENV NEXT_PUBLIC_COMPANY_WEBSITE=$NEXT_PUBLIC_COMPANY_WEBSITE
ENV NEXT_PUBLIC_COMPANY_TAX_CODE=$NEXT_PUBLIC_COMPANY_TAX_CODE
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN corepack enable pnpm && pnpm build

# ── Runner ───────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output (next.config.ts: output: 'standalone')
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
