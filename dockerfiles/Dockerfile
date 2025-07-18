# 멀티 스테이지 빌드로 이미지 크기 최적화
# build stage
FROM node:20-alpine AS build

# Alpine 최적화
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 패키지 파일만 먼저 복사 (캐시 최적화)
COPY package.json pnpm-lock.yaml ./

# pnpm 설치 및 의존성 설치
RUN corepack enable pnpm && \
  pnpm install --production=false || pnpm install --force --production=false

# 소스 코드 복사
COPY . .

# 빌드 실행
RUN pnpm run build:deploy

# 프로덕션 의존성만 재설치 (빌드 후 dev 의존성 제거)
RUN rm -rf node_modules && \
  pnpm install --production=true || pnpm install --force --production=true

# final stage - 더 작은 이미지 사용
FROM node:20-alpine

# 보안을 위한 사용자 생성
RUN addgroup -g 1001 -S nodejs && \
  adduser -S friday -u 1001

WORKDIR /app/friday

# 필요한 파일만 복사
COPY --from=build --chown=friday:nodejs /app/build ./
COPY --from=build --chown=friday:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=friday:nodejs /app/.env ./.env

# 사용자 변경
USER friday

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('healthy')" || exit 1

CMD ["node", "main.js"]
