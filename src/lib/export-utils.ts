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
  const fileName = `${contact.name.replace(/[^a-zA-Z0-9]/g, '-')}.vcf`;
  
  // Try multiple MIME types for better Android compatibility
  const mimeTypes = ['text/vcard', 'text/x-vcard', 'text/directory'];
  
  // Try Web Share API first with different MIME types
  for (const mimeType of mimeTypes) {
    const blob = new Blob([vcard], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: contact.name,
          text: `Contact: ${contact.name}`
        });
        return true;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return false;
        }
        console.error('Share failed with MIME type:', mimeType, err);
        // Try next MIME type
      }
    }
  }
  
  // Fallback: download the file using data URI (better Android support)
  downloadVCard(vcard, fileName);
  return true;
}

/**
 * Export multiple contacts as single VCF file
 */
export async function exportMultipleToPhone(contacts: ExportContact[]): Promise<boolean> {
  if (contacts.length === 0) return false;

  const vcards = contacts.map(generateVCard).join('\r\n');
  const fileName = `CardSnap-contacts-${contacts.length}.vcf`;
  
  // Try multiple MIME types for better Android compatibility
  const mimeTypes = ['text/vcard', 'text/x-vcard', 'text/directory'];
  
  for (const mimeType of mimeTypes) {
    const blob = new Blob([vcards], { type: mimeType });
    const file = new File([blob], fileName, { type: mimeType });
    
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return true;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return false;
        }
        console.error('Share failed with MIME type:', mimeType, err);
      }
    }
  }
  
  // Fallback: download the file using data URI
  downloadVCard(vcards, fileName);
  return true;
}

/**
 * Helper to download vCard using data URI (better Android browser support)
 */
function downloadVCard(vcardContent: string, fileName: string): void {
  // Use data URI instead of blob URL for better Android compatibility
  const dataUri = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcardContent);
  const a = document.createElement('a');
  a.href = dataUri;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // Cleanup after a short delay
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

/**
 * Helper to trigger file download (legacy fallback)
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
