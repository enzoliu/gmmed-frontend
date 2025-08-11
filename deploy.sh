#!/bin/bash

# GCP Cloud Run 部署腳本
# 使用方法: ./deploy-cloudrun.sh

set -e

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}GCP Cloud Run 部署腳本${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 配置變數 (請根據您的 GCP 設定修改)
PROJECT_ID=${PROJECT_ID:-"jymedical"}
REPO=${REPO:-"docker-images"}
SERVICE_NAME=${SERVICE_NAME:-"jymedical-frontend"}
REGION=${REGION:-"asia-east1"}
IMAGE_NAME="asia-east1-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE_NAME}"
GCS_BUCKET=${GCS_BUCKET:-"jymedical-fn-static"}

# 檢查必要工具
echo -e "${YELLOW}檢查必要工具...${NC}"
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}錯誤: gcloud CLI 未安裝${NC}"
    echo "請安裝 Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}錯誤: Docker 未安裝${NC}"
    echo "請安裝 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}錯誤: pnpm 未安裝${NC}"
    echo "請安裝 pnpm: npm install -g pnpm"
    exit 1
fi

echo -e "${GREEN}✓ 工具檢查完成${NC}"

# 設定專案
echo -e "${YELLOW}設定 GCP 專案: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# 構建 Docker 映像並提取靜態文件
echo -e "${YELLOW}構建 Docker 映像並提取靜態文件...${NC}"
docker buildx build --platform linux/amd64 \
    --target export-stage \
    --output type=local,dest=./build \
    --build-arg NODE_ENV=production \
    .

# 檢查構建目錄是否存在
if [ ! -d "build/client/_app" ]; then
    echo -e "${RED}錯誤: build/client/_app 目錄不存在${NC}"
    exit 1
fi

if [ ! -d "build/client/images" ]; then
    echo -e "${RED}錯誤: build/client/images 目錄不存在${NC}"
    exit 1
fi

# 刪除 GCS bucket 中的舊文件
echo -e "${YELLOW}刪除 GCS bucket 中的舊文件...${NC}"
gsutil -m rm -r gs://${GCS_BUCKET}/_app/* 2>/dev/null || true
gsutil -m rm -r gs://${GCS_BUCKET}/images/* 2>/dev/null || true
echo -e "${GREEN}✓ 舊文件清理完成${NC}"

# 推送構建文件到 GCS bucket
echo -e "${YELLOW}推送構建文件到 GCS bucket: ${GCS_BUCKET}${NC}"
gsutil -m rsync -r -d build/client/_app gs://${GCS_BUCKET}/_app
gsutil -m rsync -r -d build/client/images gs://${GCS_BUCKET}/images
echo -e "${GREEN}✓ 靜態文件推送完成${NC}"

# 構建 Docker 映像（使用已構建的靜態文件）
echo -e "${YELLOW}構建 Docker 映像...${NC}"
docker buildx build --platform linux/amd64 \
    --target jymedical-fe \
    -t ${IMAGE_NAME}:latest \
    --build-arg NODE_ENV=production \
    .

# # 推送映像到 Container Registry
echo -e "${YELLOW}推送映像到 Container Registry...${NC}"
docker push ${IMAGE_NAME}:latest

echo -e "${GREEN}✓ 部署完成${NC}"

