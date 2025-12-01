# Deployment Guide

This guide covers how to run the application locally for development and how to deploy it to AWS.

## 1. Local Development

You can run the application either fully containerized or manually.

### Option A: Run Full Stack (Production Preview)

Run the entire application in containers as it would run in production.
**Note**: This mode does **not** support hot reloading. Use Option B for development.

```bash
docker compose -f docker-compose-build.yml up -d --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001)
- **DynamoDB Local**: [http://localhost:8000](http://localhost:8000)

### Option B: Local Development (Hot Reloading)

Use this method for active development. It runs the services locally with hot-reloading enabled, allowing you to see changes immediately.

#### Prerequisites
- Node.js (v18+)
- Docker (for local DynamoDB)

#### Step 1: Start Local Database
Start the local DynamoDB instance.

```bash
docker compose -f docker-compose-dynamodb.yml up -d
```
*This starts DynamoDB Local on port 8000.*

#### Step 2: Start Backend
Run the Express backend server.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
*The backend will start on [http://localhost:3001](http://localhost:3001).*

#### Step 3: Start Frontend
Run the React frontend application.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
*The frontend will start on [http://localhost:5173](http://localhost:5173) (or similar port).*

---

## 2. AWS Deployment

Deploy the application to AWS using Terragrunt and Docker.

### Prerequisites
- AWS CLI configured (`aws configure`)
- Terraform and Terragrunt installed
- Docker running

### Step 1: Install Backend Dependencies

Install required dependencies including AWS Secrets Manager SDK:

```bash
cd backend
npm install
```

### Step 2: Store API Key Securely

**IMPORTANT**: Store your OpenRouter API key in AWS Secrets Manager (never commit it to code!).

1. **Get your OpenRouter API Key**:
   - Sign up at [OpenRouter](https://openrouter.ai/)
   - Create an API key from your dashboard

2. **Store in AWS Secrets Manager**:
   ```bash
   aws secretsmanager create-secret \
       --name "todo-list/openrouter-api-key" \
       --secret-string "YOUR_API_KEY_HERE" \
       --region ap-southeast-1 \
       --description "OpenRouter API key for Todo List AI features"
   ```
   Replace `YOUR_API_KEY_HERE` with your actual API key.

### Step 3: Deploy Infrastructure
Deploy the full infrastructure (ECR, Lambda, DynamoDB, API Gateway, S3).

```bash
cd infrastructure/environments/dev
terragrunt init
terragrunt apply
```
*Type `y` to confirm. This will automatically provision ECR and push a placeholder image to allow Lambda creation.*

### Step 4: Build and Deploy Backend
Deploy the actual application code using the provided helper script.

```bash
cd ../../../
./deploy_backend.sh
```
*This script will automatically:*
1. *Login to ECR*
2. *Build the Docker image (amd64)*
3. *Push the image to ECR*
4. *Update the Lambda function*

### Step 5: Deploy Frontend
Build and upload the frontend to the S3 bucket.

1. **Update API URL**:
   Update `frontend/.env.production` with your new API Gateway URL:
   ```
   VITE_API_URL=<YOUR_API_ENDPOINT_FROM_STEP_3>
   ```

2. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Sync to S3**:
   ```bash
   aws s3 sync dist/ s3://<YOUR_BUCKET_NAME>
   ```
   *Replace `<YOUR_BUCKET_NAME>` with the bucket name from Step 3 outputs.*

4. **Access Application**:
   Open the S3 website URL provided in the Terragrunt outputs.

---

## 3. Security Notes

### API Key Storage

This deployment uses **AWS Secrets Manager** to securely store the OpenRouter API key:


### Local Development

For local development, you can still use environment variables:

```bash
# backend/.env
OPENROUTER_API_KEY=YOUR_API_KEY
AWS_REGION=ap-southeast-1
```

The code automatically detects whether to use Secrets Manager (AWS) or environment variables (local).
