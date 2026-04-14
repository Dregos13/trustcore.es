resource "aws_s3_bucket" "site" {
  bucket        = var.domain_name
  force_destroy = var.force_destroy
  tags          = var.tags
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${var.domain_name}-oac"
  description                       = "OAC for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_acm_certificate" "site" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = var.create_www ? ["www.${var.domain_name}"] : []

  lifecycle {
    create_before_destroy = true
  }

  tags = var.tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = var.hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "site" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_function" "canonical_redirect" {
  name    = "${replace(var.domain_name, ".", "-")}-canonical-redirect"
  runtime = "cloudfront-js-2.0"
  comment = "Canonical host redirect and extensionless route handling"
  publish = true

  code = <<-EOT
    function buildQueryString(querystring) {
      var segments = [];
      for (var key in querystring) {
        if (!Object.prototype.hasOwnProperty.call(querystring, key)) {
          continue;
        }

        var entry = querystring[key];
        if (entry.multiValue) {
          for (var i = 0; i < entry.multiValue.length; i++) {
            var mv = entry.multiValue[i];
            segments.push(key + "=" + mv.value);
          }
        } else if (entry.value !== undefined && entry.value !== "") {
          segments.push(key + "=" + entry.value);
        } else {
          segments.push(key);
        }
      }

      return segments.length > 0 ? "?" + segments.join("&") : "";
    }

    function hasFileExtension(uri) {
      var lastSlash = uri.lastIndexOf("/");
      var lastDot = uri.lastIndexOf(".");
      return lastDot > lastSlash;
    }

    function normalizeCanonicalPath(uri) {
      if (uri === "/en" || uri === "/fr") {
        return uri + "/";
      }

      if (uri === "/index.html") {
        return "/";
      }

      if (uri === "/en/index.html") {
        return "/en/";
      }

      if (uri === "/fr/index.html") {
        return "/fr/";
      }

      if (uri.length > 5 && uri.slice(-5) === ".html") {
        return uri.slice(0, -5);
      }

      if (uri.length > 1 && uri.charAt(uri.length - 1) === "/" && uri !== "/en/" && uri !== "/fr/") {
        return uri.slice(0, -1);
      }

      return uri;
    }

    function redirect(location) {
      return {
        statusCode: 301,
        statusDescription: "Moved Permanently",
        headers: {
          location: { value: location },
          "cache-control": { value: "max-age=31536000" }
        }
      };
    }

    function handler(event) {
      var request = event.request;
      var host = request.headers.host.value.toLowerCase();
      var uri = normalizeCanonicalPath(request.uri);
      var query = buildQueryString(request.querystring);
      var shouldRedirectUri = uri !== request.uri;

      if (host !== "${local.canonical_host}" || shouldRedirectUri) {
        return redirect("https://${local.canonical_host}" + uri + query);
      }

      if (uri === "/") {
        request.uri = "/index.html";
        return request;
      }

      if (uri === "/en/" || uri === "/fr/") {
        request.uri = uri + "index.html";
        return request;
      }

      if (!hasFileExtension(uri)) {
        request.uri = uri + ".html";
      }

      return request;
    }
  EOT
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = var.domain_name
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = local.aliases

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "s3-${aws_s3_bucket.site.id}"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-${aws_s3_bucket.site.id}"
    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    compress        = true

    cache_policy_id = data.aws_cloudfront_cache_policy.optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.canonical_redirect.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = var.tags
}

data "aws_iam_policy_document" "site" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.site.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site.json
}

resource "aws_route53_record" "apex" {
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www" {
  count   = var.create_www ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_s3_object" "site" {
  for_each = fileset(local.site_dir, "**")

  bucket = aws_s3_bucket.site.id
  key    = each.value
  source = "${local.site_dir}/${each.value}"
  etag   = filemd5("${local.site_dir}/${each.value}")

  content_type = lookup(
    local.mime_types,
    length(regexall("\\.[^.]+$", each.value)) > 0 ? lower(element(regexall("\\.[^.]+$", each.value), 0)) : "",
    "application/octet-stream"
  )
}
