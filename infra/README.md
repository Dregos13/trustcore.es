# Despliegue de trustcore.es con Terraform

## Requisitos
- Terraform >= 1.5
- Credenciales de AWS configuradas (perfil o variables de entorno)
- Hosted Zone de Route53 para el dominio

## Pasos
1. Entra en la carpeta de infraestructura:

```bash
cd infra
```

2. Inicializa Terraform:

```bash
terraform init
```

3. Aplica el despliegue (ajusta las variables necesarias):

```bash
terraform apply \
  -var="domain_name=trustcore.es" \
  -var="hosted_zone_id=ZXXXXXXXXXXXX"
```

Opcional: usa `infra/terraform.tfvars.example` como plantilla y crea tu propio `terraform.tfvars` para no pasar variables por línea de comandos.

## Notas
- El certificado ACM se crea en `us-east-1` porque CloudFront lo requiere.
- Los archivos de `site/` se suben al bucket vía Terraform. Si cambias el contenido, vuelve a ejecutar `terraform apply`.
- CloudFront puede tardar varios minutos en propagar cambios.
- Para forzar refresco de caché:

```bash
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=infra output -raw distribution_id) \
  --paths "/*"
```
