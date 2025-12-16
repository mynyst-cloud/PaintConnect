/**
 * Gestandaardiseerde e-mail template generator voor PaintConnect
 * Gebruikt de officiële PaintConnect branding zoals goedgekeurd
 * 
 * LET OP: Dit bestand bevat alleen HTML generators voor FRONTEND gebruik
 * Voor daadwerkelijk versturen van emails, gebruik de backend functies
 */

const PAINTCONNECT_LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/688ddf9fafec117afa44cb01/8f6c3b85c_Colorlogo-nobackground.png';

/**
 * Genereer een volledige HTML e-mail met PaintConnect branding
 * Deze functie genereert alleen HTML - het daadwerkelijk versturen gebeurt in backend functies
 */
export function generateBrandedEmail({ 
  title, 
  content, 
  buttonText = null, 
  buttonLink = null,
  additionalContent = null
}) {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
        <tr>
            <td style="padding: 0;">
                <!-- Header -->
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <tr>
                        <td style="padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">PaintConnect</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">Professioneel Schildersbeheer</p>
                        </td>
                    </tr>
                </table>
                
                <!-- Content Box -->
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #f3f4f6;">
                    <tr>
                        <td style="padding: 40px 20px;">
                            <table role="presentation" style="width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Logo in content box -->
                                <tr>
                                    <td style="padding: 40px 40px 20px 40px; text-align: center;">
                                        <img src="${PAINTCONNECT_LOGO_URL}" alt="PaintConnect" style="max-width: 150px; height: auto;" />
                                    </td>
                                </tr>
                                
                                <!-- Title -->
                                <tr>
                                    <td style="padding: 20px 40px 10px 40px;">
                                        <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #1f2937; text-align: center;">${title}</h2>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 10px 40px 30px 40px;">
                                        <div style="font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                                            ${content}
                                        </div>
                                    </td>
                                </tr>
                                
                                <!-- Button -->
                                ${buttonText && buttonLink ? `
                                <tr>
                                    <td style="padding: 10px 40px 40px 40px; text-align: center;">
                                        <a href="${buttonLink}" style="display: inline-block; padding: 16px 40px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${buttonText}</a>
                                    </td>
                                </tr>
                                ` : ''}
                                
                                <!-- Additional Content -->
                                ${additionalContent ? `
                                <tr>
                                    <td style="padding: 0 40px 40px 40px;">
                                        ${additionalContent}
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer -->
                <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 30px 20px; text-align: center;">
                            <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">
                                © ${new Date().getFullYear()} PaintConnect. Alle rechten voorbehouden.
                            </p>
                            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
                                PaintConnect, Voorbeeldstraat 1, 1000 Brussel, België
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

/**
 * Frontend helper - genereert email preview HTML
 * Gebruikt dezelfde template als echte emails voor consistent voorbeeld
 */
export function generateEmailPreview({ title, content, buttonText, buttonLink, additionalContent }) {
  return generateBrandedEmail({ title, content, buttonText, buttonLink, additionalContent });
}

/**
 * Simpele email HTML generator zonder volledige branding
 * Handig voor snelle notificaties
 */
export function generateSimpleEmail({ title, message, actionUrl, actionText }) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">${title}</h2>
        <p>${message}</p>
        ${actionUrl && actionText ? `
            <p style="margin-top: 20px;">
                <a href="${actionUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    ${actionText}
                </a>
            </p>
        ` : ''}
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
            © ${new Date().getFullYear()} PaintConnect. Alle rechten voorbehouden.
        </p>
    </div>
</body>
</html>
  `;
}