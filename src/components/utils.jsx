export function createPageUrl(pageName) {
  const cleanedPageName = pageName.startsWith('/') ? pageName.substring(1) : pageName;
  return `/${cleanedPageName}`;
}

export function createProjectDetailsUrl(projectId) {
  return createPageUrl(`ProjectDetails?id=${projectId}`);
}

export function createPublicProjectDetailsUrl(projectId) {
  return createPageUrl(`ProjectPublicDetail?id=${projectId}`);
}

export function formatCurrency(amount) {
  if (typeof amount !== 'number') return '€0,00';
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

export const formatDate = (dateString) => {
  if (!dateString) return 'Geen datum';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    return date.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Datum fout';
  }
};

// AANGEPAST: Verbeterde formatDateTime voor correcte timezone handling
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ongeldige datum';
    
    // Gebruik de lokale tijdzone van de gebruiker
    return new Intl.DateTimeFormat('nl-NL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date);
    
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return dateString;
  }
};

export function calculateProgress(project) {
  if (!project || !project.start_date || !project.expected_end_date) return { progress: 0, isOverdue: false };

  const start = new Date(project.start_date);
  const end = new Date(project.expected_end_date);
  const now = new Date();

  if (now < start) return { progress: 0, isOverdue: false };

  const isOverdue = now > end && project.status !== 'afgerond';

  if (now >= end) return { progress: 100, isOverdue };

  const totalDuration = end.getTime() - start.getTime();
  if (totalDuration <= 0) return { progress: 100, isOverdue };

  const elapsedDuration = now.getTime() - start.getTime();
  const progress = Math.min(100, Math.round((elapsedDuration / totalDuration) * 100));

  return { progress, isOverdue };
}

export function generateReferralUrl(code) {
  if (!code) return '';
  return createPageUrl(`Referral?code=${code}`);
}