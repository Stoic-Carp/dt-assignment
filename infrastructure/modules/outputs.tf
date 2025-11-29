output "api_endpoint" {
  value = module.api_gateway.api_endpoint
}

output "website_endpoint" {
  value = module.s3.website_endpoint
}

output "repository_url" {
  value = module.ecr.repository_url
}
