# Azure App Service Environment Variables

Add these in Azure Portal > App Service > Configuration > Application Settings:

## Required Settings

### Database
- `DATABASE_URL` = "your_azure_sql_connection_string"

### NextAuth
- `NEXTAUTH_URL` = "https://your-app-name.azurewebsites.net"
- `NEXTAUTH_SECRET` = "your_nextauth_secret_key"

### Square (Production)
- `SQUARE_CLIENT_ID` = "your_square_client_id"
- `SQUARE_CLIENT_SECRET` = "your_square_client_secret"
- `SQUARE_ENVIRONMENT` = "production"
- `NEXT_PUBLIC_SQUARE_CLIENT_ID` = "your_square_client_id"
- `NEXT_PUBLIC_SQUARE_APPLICATION_ID` = "your_square_application_id"
- `NEXT_PUBLIC_SQUARE_ENVIRONMENT` = "production"

### Azure Email
- `AZURE_COMMUNICATION_CONNECTION_STRING` = "your_azure_communication_connection_string"
- `AZURE_COMMUNICATION_EMAIL_DOMAIN` = "your_email_domain"
- `AZURE_COMMUNICATION_FROM_EMAIL` = "your_from_email"

### Optional (for later)
- `GITHUB_CLIENT_ID` = "your_github_client_id"
- `GITHUB_CLIENT_SECRET` = "your_github_client_secret"
- `SQUARE_ACCESS_TOKEN` = "your_square_access_token"
- `SQUARE_LOCATION_ID` = "your_square_location_id"

## Important Notes
- Update `NEXTAUTH_URL` to your actual Azure domain
- Update Square OAuth redirect URLs in Square Developer Dashboard to use your Azure domain
- All environment variables should be added as "Application Settings" not "Connection Strings"