# ---------------------------------------------------------------------------
# GitHub Actions OIDC — deploy role for trustcore.es
# ---------------------------------------------------------------------------
# Allows the GitHub Actions workflow in dregos/trustcore.es (main branch)
# to sync S3 and invalidate CloudFront without storing any AWS access keys.
# ---------------------------------------------------------------------------

variable "github_repo" {
  description = "GitHub repository in owner/name format."
  type        = string
  default     = "dregos/trustcore.es"
}

# OIDC provider — created once per AWS account; ignore error if it exists.
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprint (stable — matches the root CA of token.actions.githubusercontent.com)
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# IAM role assumed by the workflow
resource "aws_iam_role" "github_deploy" {
  name = "github-${replace(var.github_repo, "/", "-")}-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # Only the main branch can assume this role
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = var.tags
}

# Minimum permissions: S3 sync + CloudFront invalidation
resource "aws_iam_role_policy" "github_deploy" {
  name = "s3-sync-cloudfront-invalidate"
  role = aws_iam_role.github_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3Sync"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.domain_name}",
          "arn:aws:s3:::${var.domain_name}/*"
        ]
      },
      {
        Sid    = "CloudFrontInvalidate"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation"
        ]
        Resource = "arn:aws:cloudfront::*:distribution/${aws_cloudfront_distribution.site.id}"
      }
    ]
  })
}

output "github_deploy_role_arn" {
  value       = aws_iam_role.github_deploy.arn
  description = "Paste this ARN as the AWS_ROLE_ARN secret in GitHub Actions."
}
