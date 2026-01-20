export interface ExportContact {
  name: string;
  title?: string | null;
  company: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  location_city?: string | null;
  location_country?: string | null;
  handwritten_notes?: string | null;
}

/**
 * Generate vCard 3.0 format with CardSnap tag for identification
 */
function generateVCard(contact: ExportContact): string {
  const nameParts = contact.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Build address string
  const addressParts = [
    contact.address,
    contact.location_city,
    contact.location_country
  ].filter(Boolean).join(', ');

  // Escape special characters for vCard
  const escape = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escape(lastName)};${escape(firstName)};;;`,
    `FN:${escape(contact.name)}`,
  ];

  if (contact.company) {
    lines.push(`ORG:${escape(contact.company)}`);
  }
  if (contact.title) {
    lines.push(`TITLE:${escape(contact.title)}`);
  }
  if (contact.phone) {
    lines.push(`TEL;TYPE=CELL:${contact.phone}`);
  }
  if (contact.email) {
    lines.push(`EMAIL:${contact.email}`);
  }
  if (addressParts) {
    lines.push(`ADR;TYPE=WORK:;;${escape(addressParts)};;;;`);
  }
  if (contact.handwritten_notes) {
    lines.push(`NOTE:${escape(contact.handwritten_notes)}`);
  }
  
  // Add CardSnap tag for identification on iOS/Android
  lines.push('CATEGORIES:CardSnap');
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * Export single contact to phone contacts using Web Share API
 * Falls back to download on unsupported browsers
 */
export async function exportToPhoneContacts(contact: ExportContact): Promise<boolean> {
  const vcard = generateVCard(contact);
  const blob = new Blob([vcard], { type: 'text/vcard' });
  const fileName = `${contact.name.replace(/[^a-zA-Z0-9]/g, '-')}.vcf`;
  const file = new File([blob], fileName, { type: 'text/vcard' });

  // Check if Web Share API supports file sharing
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: contact.name,
        text: `Contact: ${contact.name}`
      });
      return true;
    } catch (err) {
      // User cancelled the share
      if ((err as Error).name === 'AbortError') {
        return false;
      }
      console.error('Share failed:', err);
      // Fall through to download fallback
    }
  }
  
  // Fallback: download the file
  downloadBlob(blob, fileName);
  return true;
}

/**
 * Export multiple contacts as single VCF file
 */
export async function exportMultipleToPhone(contacts: ExportContact[]): Promise<boolean> {
  if (contacts.length === 0) return false;

  const vcards = contacts.map(generateVCard).join('\r\n');
  const blob = new Blob([vcards], { type: 'text/vcard' });
  const fileName = `CardSnap-contacts-${contacts.length}.vcf`;
  const file = new File([blob], fileName, { type: 'text/vcard' });

  // Check if Web Share API supports file sharing
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (err) {
      // User cancelled the share
      if ((err as Error).name === 'AbortError') {
        return false;
      }
      console.error('Share failed:', err);
      // Fall through to download fallback
    }
  }
  
  // Fallback: download the file
  downloadBlob(blob, fileName);
  return true;
}

/**
 * Helper to trigger file download
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
