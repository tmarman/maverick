import { EmailClient, EmailMessage } from '@azure/communication-email'

class AzureEmailService {
  private client: EmailClient

  constructor() {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING
    if (!connectionString) {
      throw new Error('AZURE_COMMUNICATION_CONNECTION_STRING environment variable is required')
    }
    
    this.client = new EmailClient(connectionString)
  }

  async sendMagicLinkEmail(to: string, magicLink: string): Promise<boolean> {
    try {
      const { host } = new URL(magicLink)
      const escapedEmail = to.replace(/\./g, '&#8203;.')
      
      const emailMessage: EmailMessage = {
        senderAddress: process.env.AZURE_COMMUNICATION_FROM_EMAIL!,
        content: {
          subject: '🪄 Your Maverick magic link',
          html: this.getMagicLinkTemplate(to, magicLink, host),
          plainText: this.getMagicLinkPlainText(to, magicLink, host)
        },
        recipients: {
          to: [{ address: to }]
        }
      }

      const poller = await this.client.beginSend(emailMessage)
      const result = await poller.pollUntilDone()
      
      console.log(`Magic link email sent to ${to}:`, result.status)
      return result.status === 'Succeeded'
      
    } catch (error) {
      console.error('Azure email error:', error)
      return false
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string, name?: string): Promise<boolean> {
    try {
      const emailMessage: EmailMessage = {
        senderAddress: process.env.AZURE_COMMUNICATION_FROM_EMAIL!,
        content: {
          subject: '🔐 Reset your Maverick password',
          html: this.getPasswordResetTemplate(to, resetLink, name),
          plainText: this.getPasswordResetPlainText(to, resetLink, name)
        },
        recipients: {
          to: [{ address: to }]
        }
      }

      const poller = await this.client.beginSend(emailMessage)
      const result = await poller.pollUntilDone()
      
      console.log(`Password reset email sent to ${to}:`, result.status)
      return result.status === 'Succeeded'
      
    } catch (error) {
      console.error('Azure password reset email error:', error)
      return false
    }
  }

  async sendWelcomeEmail(to: string, name?: string): Promise<boolean> {
    try {
      const emailMessage: EmailMessage = {
        senderAddress: process.env.AZURE_COMMUNICATION_FROM_EMAIL!,
        content: {
          subject: '🚀 Welcome to Maverick!',
          html: this.getWelcomeTemplate(to, name),
          plainText: this.getWelcomePlainText(to, name)
        },
        recipients: {
          to: [{ address: to }]
        }
      }

      const poller = await this.client.beginSend(emailMessage)
      const result = await poller.pollUntilDone()
      
      console.log(`Welcome email sent to ${to}:`, result.status)
      return result.status === 'Succeeded'
      
    } catch (error) {
      console.error('Azure welcome email error:', error)
      return false
    }
  }

  private getMagicLinkTemplate(email: string, magicLink: string, host: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Maverick Magic Link</title>
    <link href="https://cash-f.squarecdn.com/static/fonts/cashsans.css" rel="stylesheet">
    <style>
        body { 
            font-family: 'Cash Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #fafafa;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e1e5e9;
        }
        .header {
            background: #ffffff;
            padding: 40px 32px 32px 32px;
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
        }
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
        }
        .logo-icon {
            width: 48px;
            height: 48px;
            margin-right: 12px;
        }
        .logo-text {
            height: 32px;
        }
        .tagline {
            background: #000000;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 16px;
        }
        .content {
            padding: 40px 32px;
            text-align: center;
        }
        .content h1 {
            color: #000000;
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 16px 0;
        }
        .content p {
            color: #666666;
            font-size: 16px;
            margin: 0 0 32px 0;
        }
        .magic-button {
            display: inline-block;
            background: #000000;
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 0 0 32px 0;
            transition: background-color 0.2s;
        }
        .magic-button:hover {
            background: #333333;
        }
        .security-note {
            background: #f5f5f5;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 32px 0;
            font-size: 14px;
            text-align: left;
        }
        .security-note strong {
            color: #000000;
        }
        .url-box {
            word-break: break-all;
            background: #f5f5f5;
            padding: 16px;
            border-radius: 8px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            color: #666666;
            border: 1px solid #e1e5e9;
            margin: 16px 0 0 0;
        }
        .footer {
            background: #fafafa;
            padding: 32px;
            text-align: center;
            font-size: 14px;
            color: #999999;
            border-top: 1px solid #f0f0f0;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #000000;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="https://maverick.com/design/icon.png" alt="Maverick" class="logo-icon">
                <img src="https://maverick.com/design/textmark.png" alt="Maverick" class="logo-text">
            </div>
            <div class="tagline">🚀 The Complete Founder Platform</div>
            <p style="color: #666666; font-size: 16px; margin: 0;">Your secure sign-in link is ready</p>
        </div>
        
        <div class="content">
            <h1>Welcome back!</h1>
            <p>Click the button below to securely sign in to your Maverick account:</p>
            
            <a href="${magicLink}" class="magic-button">
                🪄 Sign in to Maverick
            </a>
            
            <div class="security-note">
                <strong>🔒 Security Notice</strong><br>
                This link will expire in 24 hours and can only be used once.
                If you didn't request this, you can safely ignore this email.
            </div>
            
            <p style="color: #666666; font-size: 14px; margin: 16px 0 0 0;">Or copy and paste this link into your browser:</p>
            <div class="url-box">${magicLink}</div>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${email}</p>
            <p><strong>Maverick</strong> • From idea to revenue • <a href="https://maverick.com">maverick.com</a></p>
        </div>
    </div>
</body>
</html>
    `
  }

  private getMagicLinkPlainText(email: string, magicLink: string, host: string): string {
    return `
🚀 MAVERICK - Your Magic Link

Welcome back! 

Click this link to securely sign in to your Maverick account:
${magicLink}

🔒 Security Notice:
This link will expire in 24 hours and can only be used once.
If you didn't request this, you can safely ignore this email.

---
This email was sent to ${email}
Maverick • From idea to revenue • maverick.com
    `
  }

  private getWelcomeTemplate(email: string, name?: string): string {
    const greeting = name ? `Welcome ${name}!` : 'Welcome to Maverick!'
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Maverick</title>
    <link href="https://cash-f.squarecdn.com/static/fonts/cashsans.css" rel="stylesheet">
    <style>
        body { 
            font-family: 'Cash Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #fafafa;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e1e5e9;
        }
        .header {
            background: #ffffff;
            padding: 40px 32px 32px 32px;
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
        }
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
        }
        .logo-icon {
            width: 56px;
            height: 56px;
            margin-right: 16px;
        }
        .logo-text {
            height: 40px;
        }
        .tagline {
            background: #000000;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 16px;
        }
        .content {
            padding: 40px 32px;
        }
        .content h1 {
            color: #000000;
            font-size: 32px;
            font-weight: 600;
            margin: 0 0 24px 0;
            text-align: center;
        }
        .content > p {
            color: #666666;
            font-size: 18px;
            margin: 0 0 32px 0;
            text-align: center;
        }
        .feature {
            display: flex;
            align-items: flex-start;
            margin: 24px 0;
            padding: 24px;
            background: #f5f5f5;
            border-radius: 12px;
            border: 1px solid #e1e5e9;
        }
        .feature-icon {
            width: 48px;
            height: 48px;
            background: #000000;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-right: 20px;
            flex-shrink: 0;
        }
        .feature h3 {
            margin: 0 0 8px 0;
            color: #000000;
            font-size: 18px;
            font-weight: 600;
        }
        .feature p {
            margin: 0;
            color: #666666;
            font-size: 14px;
            line-height: 1.5;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
            padding: 32px;
            background: #f5f5f5;
            border-radius: 12px;
            border: 1px solid #e1e5e9;
        }
        .cta-button {
            display: inline-block;
            background: #000000;
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 16px 0;
            transition: background-color 0.2s;
        }
        .cta-button:hover {
            background: #333333;
        }
        .help-note {
            background: #f5f5f5;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 20px;
            margin: 32px 0;
            font-size: 14px;
            text-align: center;
            color: #666666;
        }
        .footer {
            background: #fafafa;
            padding: 32px;
            text-align: center;
            font-size: 14px;
            color: #999999;
            border-top: 1px solid #f0f0f0;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #000000;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="https://maverick.com/design/icon.png" alt="Maverick" class="logo-icon">
                <img src="https://maverick.com/design/textmark.png" alt="Maverick" class="logo-text">
            </div>
            <div class="tagline">🚀 The Complete Founder Platform</div>
            <p style="color: #666666; font-size: 16px; margin: 0;">You're now part of the Maverick community!</p>
        </div>
        
        <div class="content">
            <h1>${greeting}</h1>
            <p>We're excited to help you turn your ideas into revenue. Here's what you can do with Maverick:</p>
            
            <div class="feature">
                <div class="feature-icon">🏢</div>
                <div>
                    <h3>Business Formation</h3>
                    <p>LLC, S-Corp, C-Corp—choose the right structure for your business goals with expert guidance</p>
                </div>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🤖</div>
                <div>
                    <h3>AI Business Partner</h3>
                    <p>Get guidance on product decisions, market strategy, and growth—available 24/7 to support your journey</p>
                </div>
            </div>
            
            <div class="feature">
                <div class="feature-icon">💻</div>
                <div>
                    <h3>Custom Software Built</h3>
                    <p>Production apps, websites, and tools—built to your specifications and ready to scale with your business</p>
                </div>
            </div>
            
            <div class="cta-section">
                <h3 style="margin: 0 0 16px 0; color: #000000; font-size: 20px;">Ready to get started?</h3>
                <p style="margin: 0 0 24px 0; color: #666666; font-size: 16px;">Launch your business cockpit and start building today</p>
                <a href="https://maverick.com/cockpit" class="cta-button">
                    🚀 Enter Cockpit
                </a>
            </div>
            
            <div class="help-note">
                <strong style="color: #000000;">Questions? We're here to help!</strong><br>
                Just reply to this email or visit our support center. We're committed to your success.
            </div>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${email}</p>
            <p><strong>Maverick</strong> • From idea to revenue • <a href="https://maverick.com">maverick.com</a></p>
        </div>
    </div>
</body>
</html>
    `
  }

  private getPasswordResetTemplate(email: string, resetLink: string, name?: string): string {
    const greeting = name ? `Hi ${name}` : 'Hello'
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your Maverick password</title>
    <link href="https://cash-f.squarecdn.com/static/fonts/cashsans.css" rel="stylesheet">
    <style>
        body { 
            font-family: 'Cash Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #000000;
            background-color: #fafafa;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e1e5e9;
        }
        .header {
            background: #ffffff;
            padding: 40px 32px 32px 32px;
            text-align: center;
            border-bottom: 1px solid #f0f0f0;
        }
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
        }
        .logo-icon {
            width: 48px;
            height: 48px;
            margin-right: 12px;
        }
        .logo-text {
            height: 32px;
        }
        .tagline {
            background: #dc2626;
            color: #ffffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            display: inline-block;
            margin-bottom: 16px;
        }
        .content {
            padding: 40px 32px;
            text-align: center;
        }
        .content h1 {
            color: #000000;
            font-size: 28px;
            font-weight: 600;
            margin: 0 0 16px 0;
        }
        .content p {
            color: #666666;
            font-size: 16px;
            margin: 0 0 32px 0;
        }
        .reset-button {
            display: inline-block;
            background: #dc2626;
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 0 0 32px 0;
            transition: background-color 0.2s;
        }
        .reset-button:hover {
            background: #b91c1c;
        }
        .security-note {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin: 32px 0;
            font-size: 14px;
            text-align: left;
        }
        .security-note strong {
            color: #dc2626;
        }
        .warning-box {
            background: #fffbeb;
            border: 1px solid #fed7aa;
            border-radius: 8px;
            padding: 20px;
            margin: 32px 0;
            font-size: 14px;
            text-align: left;
        }
        .warning-box strong {
            color: #d97706;
        }
        .url-box {
            word-break: break-all;
            background: #f5f5f5;
            padding: 16px;
            border-radius: 8px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            color: #666666;
            border: 1px solid #e1e5e9;
            margin: 16px 0 0 0;
        }
        .footer {
            background: #fafafa;
            padding: 32px;
            text-align: center;
            font-size: 14px;
            color: #999999;
            border-top: 1px solid #f0f0f0;
        }
        .footer p {
            margin: 0 0 8px 0;
        }
        .footer a {
            color: #000000;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="https://maverick.com/design/icon.png" alt="Maverick" class="logo-icon">
                <img src="https://maverick.com/design/textmark.png" alt="Maverick" class="logo-text">
            </div>
            <div class="tagline">🔐 Password Reset Request</div>
            <p style="color: #666666; font-size: 16px; margin: 0;">We received a request to reset your password</p>
        </div>
        
        <div class="content">
            <h1>${greeting}!</h1>
            <p>We received a request to reset the password for your Maverick account.</p>
            
            <a href="${resetLink}" class="reset-button">
                🔐 Reset Your Password
            </a>
            
            <div class="security-note">
                <strong>🔒 Security Notice</strong><br>
                This link will expire in 1 hour and can only be used once.
                If you didn't request this password reset, you can safely ignore this email.
            </div>
            
            <div class="warning-box">
                <strong>⚠️ Important</strong><br>
                If you didn't request this password reset, please secure your account immediately.
                Someone may be trying to access your account.
            </div>
            
            <p style="color: #666666; font-size: 14px; margin: 16px 0 0 0;">Or copy and paste this link into your browser:</p>
            <div class="url-box">${resetLink}</div>
        </div>
        
        <div class="footer">
            <p>This email was sent to ${email}</p>
            <p><strong>Maverick</strong> • From idea to revenue • <a href="https://maverick.com">maverick.com</a></p>
        </div>
    </div>
</body>
</html>
    `
  }

  private getPasswordResetPlainText(email: string, resetLink: string, name?: string): string {
    const greeting = name ? `Hi ${name}` : 'Hello'
    
    return `
🚀 MAVERICK - Password Reset Request

${greeting}!

We received a request to reset the password for your Maverick account.

Click this link to reset your password:
${resetLink}

🔒 Security Notice:
This link will expire in 1 hour and can only be used once.
If you didn't request this password reset, you can safely ignore this email.

⚠️ Important:
If you didn't request this password reset, please secure your account immediately.
Someone may be trying to access your account.

---
This email was sent to ${email}
Maverick • From idea to revenue • maverick.com
    `
  }

  private getWelcomePlainText(email: string, name?: string): string {
    const greeting = name ? `Welcome ${name}!` : 'Welcome to Maverick!'
    
    return `
🚀 MAVERICK - ${greeting}

You're now part of the Maverick community! We're excited to help you turn your ideas into revenue.

What you can do with Maverick:

🏢 Business Formation
LLC, S-Corp, C-Corp—choose the right structure for your business goals

🤖 AI Business Partner  
Get guidance on product decisions, market strategy, and growth—24/7

💻 Custom Software Built
Production apps, websites, and tools—built to your specs, ready to scale

Get started: https://maverick.com/app

Questions? Just reply to this email—we're here to help!

---
This email was sent to ${email}
Maverick • From idea to revenue • maverick.com
    `
  }
}

export const azureEmailService = new AzureEmailService()