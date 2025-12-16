/**
 * Notification Manager voor frontend
 * Gebruikt ALLEEN Resend via backend functies
 * 
 * NOTE: Alle e-mail verzending gebeurt via backend functions
 * Deze utility is alleen voor het triggeren van notificaties vanuit frontend
 */

/**
 * Send a notification to users (creates in-app notification + email via Resend)
 * Deze functie roept de backend sendNotification functie aan
 */
export async function notify({ 
  company_id, 
  user_emails, 
  type = 'generic', 
  message, 
  link = null, 
  project_id = null,
  triggering_user_name = null,
  send_email = true 
}) {
  if (!company_id || !user_emails || !Array.isArray(user_emails) || user_emails.length === 0) {
    throw new Error('company_id and user_emails (array) are required');
  }

  if (!message) {
    throw new Error('message is required');
  }

  try {
    // Import the sendNotification function (Platform V2 style)
    const { sendNotification } = await import('@/api/functions');
    
    const response = await sendNotification({
      company_id,
      user_emails,
      type,
      message,
      link,
      project_id,
      triggering_user_name,
      send_email
    });

    return response.data;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}

/**
 * Send notification to all admins of a company
 */
export async function notifyAdmins({ 
  company_id, 
  type = 'generic', 
  message, 
  link = null, 
  project_id = null,
  triggering_user_name = null,
  send_email = true 
}) {
  try {
    // Get all admin users for this company
    const { User } = await import('@/api/entities');
    const users = await User.filter({ 
      company_id: company_id,
      company_role: 'admin'
    });

    if (!users || users.length === 0) {
      console.warn(`No admin users found for company ${company_id}`);
      return { success: false, message: 'No admins found' };
    }

    const admin_emails = users.map(u => u.email);

    return await notify({
      company_id,
      user_emails: admin_emails,
      type,
      message,
      link,
      project_id,
      triggering_user_name,
      send_email
    });
  } catch (error) {
    console.error('Failed to notify admins:', error);
    throw error;
  }
}

/**
 * Send notification to specific painters
 */
export async function notifyPainters({ 
  company_id, 
  painter_emails, 
  type = 'generic', 
  message, 
  link = null, 
  project_id = null,
  triggering_user_name = null,
  send_email = true 
}) {
  if (!painter_emails || !Array.isArray(painter_emails) || painter_emails.length === 0) {
    throw new Error('painter_emails (array) is required');
  }

  return await notify({
    company_id,
    user_emails: painter_emails,
    type,
    message,
    link,
    project_id,
    triggering_user_name,
    send_email
  });
}