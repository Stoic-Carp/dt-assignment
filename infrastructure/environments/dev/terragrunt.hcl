include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules"
}

inputs = {
  project_name = "todo-list"
  environment  = "dev"
  
  # DynamoDB
  table_name = "todo-list-dev"
  
  # ECR
  repository_name = "todo-list-backend-dev"
  
  # S3
  bucket_name = "todo-list-frontend-dev-${get_aws_account_id()}"
  
  # Lambda
  function_name = "todo-list-api-dev"
  image_uri     = "${get_aws_account_id()}.dkr.ecr.ap-southeast-1.amazonaws.com/todo-list-backend-dev:latest"
  environment_variables = {
    NODE_ENV                     = "development"
    TABLE_NAME                   = "todo-list-dev"
    CORS_ORIGIN                  = "http://todo-list-frontend-dev-994499184724.s3-website-ap-southeast-1.amazonaws.com"
    OPENROUTER_SECRET_NAME       = "todo-list/openrouter-api-key"
    TASK_BREAKDOWN_MAX_TASKS     = "7"
    TASK_BREAKDOWN_MAX_TOKENS    = "8000"
    AI_MODEL                     = "z-ai/glm-4.5-air:free"
    OPENROUTER_TIMEOUT_MS        = "25000"
  }
  
  # API Gateway
  api_name = "todo-list-api-dev"
}
