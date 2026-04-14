variable "aws_region" {
  description = "AWS region for S3 and Route53 operations. CloudFront is global."
  type        = string
  default     = "eu-west-1"
}

variable "domain_name" {
  description = "Root domain name for the site (e.g., trustcore.es)."
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for the domain."
  type        = string
}

variable "create_www" {
  description = "Whether to create www.<domain> alias and certificate SAN."
  type        = bool
  default     = true
}

variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"
}

variable "force_destroy" {
  description = "Allow Terraform to destroy the S3 bucket even if it has objects."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources."
  type        = map(string)
  default     = {}
}
