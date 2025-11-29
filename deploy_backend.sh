#!/bin/bash
set -e

# Configuration
REGION="ap-southeast-1"
REPO_NAME="todo-list-backend-dev"
FUNCTION_NAME="todo-list-api-dev"

# Get AWS Account ID
echo "Fetching AWS Account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

if [ -z "$ACCOUNT_ID" ]; then
    echo "Error: Could not get AWS Account ID. Please ensure AWS CLI is configured."
    exit 1
fi

ECR_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE_URI="${ECR_URI}/${REPO_NAME}:latest"

echo "----------------------------------------------------------------"
echo "Deploying Backend to AWS"
echo "Account ID : ${ACCOUNT_ID}"
echo "Region     : ${REGION}"
echo "Image URI  : ${IMAGE_URI}"
echo "----------------------------------------------------------------"

# 1. Login to ECR
echo "Step 1: Logging in to Amazon ECR..."
aws ecr get-login-password --region "${REGION}" | docker login --username AWS --password-stdin "${ECR_URI}"

# 2. Build Docker Image
echo "Step 2: Building Docker image..."
# Navigate to backend directory relative to script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

# Build with platform flag for Lambda compatibility (crucial for ARM Macs)
docker build --platform linux/amd64 -t "${REPO_NAME}" "${BACKEND_DIR}"

# 3. Tag Image
echo "Step 3: Tagging image..."
docker tag "${REPO_NAME}:latest" "${IMAGE_URI}"

# 4. Push Image
echo "Step 4: Pushing image to ECR..."
docker push "${IMAGE_URI}"

# 5. Update Lambda
echo "Step 5: Updating Lambda function code..."
# We use /dev/null to hide the massive JSON output, but check exit code via set -e
aws lambda update-function-code --function-name "${FUNCTION_NAME}" --image-uri "${IMAGE_URI}" --region "${REGION}" > /dev/null

echo "----------------------------------------------------------------"
echo "✅ Backend Deployment Complete!"
echo "----------------------------------------------------------------"
