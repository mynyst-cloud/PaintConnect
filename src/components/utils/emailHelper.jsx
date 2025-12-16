/**
 * Email Helper Utility voor backend functies
 * Deze functies werken alleen in backend functions (niet in frontend components)
 * omdat ze directe toegang tot RESEND_API_KEY nodig hebben via Deno.env
 */

const FROM_EMAIL = 'noreply@notifications.paintconnect.be';

/**
 * Verstuur een e-mail met een template
 * ALLEEN TE GEBRUIKEN IN BACKEND FUNCTIES
 */
export async function sendTemplatedEmail({ 
    to, 
    templateIdentifier, 
    variables = {}, 
    from_name = 'PaintConnect',
    base44Client 
}) {
    if (!base44Client) {
        throw new Error('base44Client is required for sendTemplatedEmail');
    }

    // Check if we're in a Deno environment (backend function)
    if (typeof Deno === 'undefined') {
        throw new Error('sendTemplatedEmail can only be used in backend functions');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
    }

    const templates = await base44Client.asServiceRole.entities.EmailTemplate.filter({
        identifier: templateIdentifier
    });

    if (!templates || templates.length === 0) {
        throw new Error(`Template '${templateIdentifier}' not found`);
    }

    const template = templates[0];
    let subject = template.subject;
    let bodyHtml = template.body_html;

    Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        subject = subject.replace(regex, variables[key] || '');
        bodyHtml = bodyHtml.replace(regex, variables[key] || '');
    });

    let footerHtml = '';
    try {
        const footerSettings = await base44Client.asServiceRole.entities.GlobalSettings.filter({
            setting_key: 'email_footer'
        });

        if (footerSettings && footerSettings.length > 0) {
            const footer = footerSettings[0].setting_value;
            footerHtml = `
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                    ${footer.company_name ? `<p style="margin: 5px 0;"><strong>${footer.company_name}</strong></p>` : ''}
                    ${footer.address ? `<p style="margin: 5px 0;">${footer.address}</p>` : ''}
                    ${footer.phone || footer.email ? `<p style="margin: 5px 0;">` : ''}
                    ${footer.phone ? `Tel: ${footer.phone}` : ''}
                    ${footer.phone && footer.email ? ' | ' : ''}
                    ${footer.email ? `Email: ${footer.email}` : ''}
                    ${footer.phone || footer.email ? `</p>` : ''}
                    ${footer.website ? `<p style="margin: 5px 0;"><a href="${footer.website}" style="color: #10b981;">${footer.website}</a></p>` : ''}
                    <p style="margin: 10px 0 5px 0;">
                        <a href="https://app.paintconnect.be/privacy" style="color: #10b981; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                        <a href="https://app.paintconnect.be/terms" style="color: #10b981; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                    </p>
                </div>
            `;
        }
    } catch (error) {
        console.warn('Could not load footer settings:', error.message);
    }

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 40px 0;">
                    <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">PaintConnect</h1>
                                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Professioneel Schildersbeheer</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px;">
                                ${bodyHtml}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 30px 30px 30px;">
                                ${footerHtml}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    const fromAddress = `${from_name} <${FROM_EMAIL}>`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject: subject,
            html: fullHtml
        })
    });

    if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const result = await resendResponse.json();
    return {
        success: true,
        message_id: result.id
    };
}

/**
 * Verstuur een simpele e-mail zonder template
 * ALLEEN TE GEBRUIKEN IN BACKEND FUNCTIES
 */
export async function sendSimpleEmail({ 
    to, 
    subject, 
    html, 
    from_name = 'PaintConnect' 
}) {
    // Check if we're in a Deno environment (backend function)
    if (typeof Deno === 'undefined') {
        throw new Error('sendSimpleEmail can only be used in backend functions');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
    }

    const fromAddress = `${from_name} <${FROM_EMAIL}>`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject: subject,
            html: html
        })
    });

    if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        throw new Error(`Resend API error: ${resendResponse.status} - ${errorText}`);
    }

    const result = await resendResponse.json();
    return {
        success: true,
        message_id: result.id
    };
}