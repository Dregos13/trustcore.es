output "site_url" {
  value       = "https://${local.canonical_host}"
  description = "Primary site URL."
}

output "bucket_name" {
  value       = aws_s3_bucket.site.bucket
  description = "S3 bucket name that stores the site assets."
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.site.domain_name
  description = "CloudFront distribution domain name."
}

output "distribution_id" {
  value       = aws_cloudfront_distribution.site.id
  description = "CloudFront distribution ID (useful for invalidations)."
}
