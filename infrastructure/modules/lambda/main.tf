resource "aws_lambda_function" "api" {
  function_name = var.function_name
  role          = var.role_arn
  package_type  = "Image"
  image_uri     = var.image_uri
  timeout       = 60
  memory_size   = 512

  environment {
    variables = var.environment_variables
  }

  tags = {
    Environment = var.environment
    Project     = "todo-list"
  }
}
