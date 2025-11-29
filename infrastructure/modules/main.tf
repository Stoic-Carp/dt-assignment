module "dynamodb" {
  source      = "./dynamodb"
  table_name  = var.table_name
  environment = var.environment
}

module "ecr" {
  source          = "./ecr"
  repository_name = var.repository_name
  environment     = var.environment
}

module "s3" {
  source      = "./s3"
  bucket_name = var.bucket_name
  environment = var.environment
}

module "iam" {
  source             = "./iam"
  project_name       = var.project_name
  environment        = var.environment
  dynamodb_table_arn = module.dynamodb.table_arn
}

data "aws_region" "current" {}

resource "null_resource" "push_initial_image" {
  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = <<EOT
      aws ecr get-login-password --region ${data.aws_region.current.name} | docker login --username AWS --password-stdin ${module.ecr.repository_url}
      docker pull --platform linux/amd64 public.ecr.aws/lambda/nodejs:18
      docker tag public.ecr.aws/lambda/nodejs:18 ${var.image_uri}
      docker push ${var.image_uri}
    EOT
  }

  triggers = {
    repository_url = module.ecr.repository_url
  }

  depends_on = [module.ecr]
}

module "lambda" {
  source                = "./lambda"
  function_name         = var.function_name
  role_arn              = module.iam.lambda_role_arn
  image_uri             = var.image_uri
  environment           = var.environment
  environment_variables = var.environment_variables
  depends_on            = [null_resource.push_initial_image]
}

module "api_gateway" {
  source               = "./api-gateway"
  api_name             = var.api_name
  environment          = var.environment
  lambda_invoke_arn    = module.lambda.invoke_arn
  lambda_function_name = module.lambda.function_name
}
