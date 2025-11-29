variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "table_name" {
  type = string
}

variable "repository_name" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "function_name" {
  type = string
}

variable "image_uri" {
  type = string
}

variable "environment_variables" {
  type = map(string)
}

variable "api_name" {
  type = string
}
