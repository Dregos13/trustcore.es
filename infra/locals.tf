locals {
  site_dir       = "${path.module}/../site"
  canonical_host = var.create_www ? "www.${var.domain_name}" : var.domain_name
  aliases        = var.create_www ? [var.domain_name, "www.${var.domain_name}"] : [var.domain_name]

  mime_types = {
    ".css"   = "text/css"
    ".eot"   = "application/vnd.ms-fontobject"
    ".gif"   = "image/gif"
    ".htm"   = "text/html"
    ".html"  = "text/html"
    ".ico"   = "image/x-icon"
    ".jpeg"  = "image/jpeg"
    ".jpg"   = "image/jpeg"
    ".js"    = "application/javascript"
    ".json"  = "application/json"
    ".mjs"   = "application/javascript"
    ".pdf"   = "application/pdf"
    ".png"   = "image/png"
    ".svg"   = "image/svg+xml"
    ".txt"   = "text/plain"
    ".ttf"   = "font/ttf"
    ".webp"  = "image/webp"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".xml"   = "application/xml"
  }
}
