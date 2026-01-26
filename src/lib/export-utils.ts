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
        console.log('✓ Web Share API succeeded with MIME type:', mimeType);
        return true;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          console.log('Share cancelled by user');
          return false;
        }
        console.error('Share failed with MIME type:', mimeType, err);
        // Try next MIME type
      }
    }
  }
  
  console.log('Web Share API not available, falling back to download');
  // Fallback: download the file using multi-layered approach
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
        console.log('✓ Web Share API succeeded with MIME type:', mimeType);
        return true;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          console.log('Share cancelled by user');
          return false;
        }
        console.error('Share failed with MIME type:', mimeType, err);
      }
    }
  }
  
  console.log('Web Share API not available, falling back to download');
  // Fallback: download the file using multi-layered approach
  downloadVCard(vcards, fileName);
  return true;
}

/**
 * Multi-layered download approach for better Android compatibility
 * Strategy 1: Base64 Data URI (bypasses blob URL issues)
 * Strategy 2: Blob with application/octet-stream (forces binary download)
 * Strategy 3: Clipboard fallback with user instructions
 */
function downloadVCard(vcardContent: string, fileName: string): void {
  // Strategy 1: Try Base64 Data URI (best for Android)
  try {
    const base64Content = btoa(unescape(encodeURIComponent(vcardContent)));
    const dataUri = `data:text/x-vcard;charset=utf-8;base64,${base64Content}`;
    
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    setTimeout(() => {
      a.click();
      console.log('✓ Base64 Data URI download triggered for:', fileName);
    }, 50);
    
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 1000);
    
    return; // Exit after triggering download
  } catch (e) {
    console.error('Base64 Data URI failed:', e);
  }

  // Strategy 2: Try octet-stream blob (forces binary mode)
  try {
    const blob = new Blob([vcardContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    
    setTimeout(() => {
      a.click();
      console.log('✓ Octet-stream blob download triggered for:', fileName);
    }, 50);
    
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 1000);
    
    return; // Exit after triggering download
  } catch (e) {
    console.error('Octet-stream blob failed:', e);
  }

  // Strategy 3: Clipboard fallback (ultimate safety net)
  console.warn('⚠ All download methods failed, trying clipboard');
  copyVCardToClipboard(vcardContent, fileName);
}

/**
 * Copy vCard to clipboard as ultimate fallback
 */
async function copyVCardToClipboard(vcardContent: string, fileName: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(vcardContent);
    console.log('✓ vCard copied to clipboard');
    
    // Show user instructions
    alert(
      `Download failed, but contact copied to clipboard!\n\n` +
      `To save to your contacts:\n` +
      `1. Open your Contacts app\n` +
      `2. Tap "Import" or menu → "Import contacts"\n` +
      `3. Choose "Import from file" or paste the contact\n\n` +
      `File name: ${fileName}`
    );
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    
    // Last resort: show the vCard content
    const userConfirm = confirm(
      `Unable to save contact automatically.\n\n` +
      `Would you like to see the contact data to copy manually?`
    );
    
    if (userConfirm) {
      prompt('Copy this vCard data:', vcardContent);
    }
  }
}
