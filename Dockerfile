# 使用 Node.js 22 作為基礎映像檔
FROM node:22-slim AS workspace
RUN apt-get update && apt-get install -y ca-certificates

# 安裝 pnpm
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest
RUN corepack enable

# 設定工作目錄
WORKDIR /app

COPY . .

# 安裝依賴
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 構建階段
FROM workspace AS build
ENV NODE_ENV=production
RUN pnpm build

# 輸出階段 - 用於提取構建文件
FROM scratch AS export-stage
COPY --from=build /app/build /


## Production image
FROM node:22-slim AS gmmed-fe
WORKDIR /app

COPY --from=build /app/build build/
COPY --from=build /app/node_modules node_modules/
COPY --from=build /app/package.json .

CMD [ "node", "build" ]
