// Analytics utility functions for role parsing and data aggregation

export interface RoleGroup {
  name: string;
  keywords: string[];
}

export const ROLE_GROUPS: RoleGroup[] = [
  { 
    name: "C-Level Executives", 
    keywords: ["ceo", "cfo", "cto", "coo", "cmo", "cio", "cpo", "chairman", "chairwoman", "chief", "founder", "co-founder", "president"] 
  },
  { 
    name: "Vice Presidents", 
    keywords: ["vice president", "vp ", "evp", "svp", "avp", "vice-president"] 
  },
  { 
    name: "Directors", 
    keywords: ["director", "managing director", "executive director", "associate director", "group director"] 
  },
  { 
    name: "Managers & Heads", 
    keywords: ["manager", "head of", "head -", "lead", "team lead", "supervisor", "coordinator"] 
  },
  { 
    name: "Specialists & Analysts", 
    keywords: ["specialist", "analyst", "consultant", "advisor", "expert", "engineer", "developer", "architect"] 
  },
];

export function categorizeTitle(title: string | null | undefined): string {
  if (!title) return "Other Roles";
  
  const lower = title.toLowerCase().trim();
  
  for (const group of ROLE_GROUPS) {
    if (group.keywords.some(k => lower.includes(k))) {
      return group.name;
    }
  }
  
  return "Other Roles";
}

export interface LocationStats {
  country: string;
  total: number;
  cities: { city: string; count: number }[];
}

export function aggregateLocations(contacts: Array<{ location_country: string | null; location_city: string | null }>): LocationStats[] {
  const locationMap = new Map<string, Map<string, number>>();
  
  contacts.forEach(contact => {
    const country = contact.location_country || "Unknown";
    const city = contact.location_city || "Unknown";
    
    if (!locationMap.has(country)) {
      locationMap.set(country, new Map());
    }
    
    const cityMap = locationMap.get(country)!;
    cityMap.set(city, (cityMap.get(city) || 0) + 1);
  });
  
  const result: LocationStats[] = [];
  
  locationMap.forEach((cityMap, country) => {
    let total = 0;
    const cities: { city: string; count: number }[] = [];
    
    cityMap.forEach((count, city) => {
      total += count;
      cities.push({ city, count });
    });
    
    cities.sort((a, b) => b.count - a.count);
    
    result.push({ country, total, cities });
  });
  
  result.sort((a, b) => b.total - a.total);
  
  return result;
}

export interface RoleStats {
  group: string;
  total: number;
  titles: { title: string; count: number }[];
}

export function aggregateRoles(contacts: Array<{ title: string | null }>): RoleStats[] {
  const groupMap = new Map<string, Map<string, number>>();
  
  contacts.forEach(contact => {
    const group = categorizeTitle(contact.title);
    const title = contact.title?.trim() || "No Title";
    
    if (!groupMap.has(group)) {
      groupMap.set(group, new Map());
    }
    
    const titleMap = groupMap.get(group)!;
    titleMap.set(title, (titleMap.get(title) || 0) + 1);
  });
  
  const result: RoleStats[] = [];
  
  groupMap.forEach((titleMap, group) => {
    let total = 0;
    const titles: { title: string; count: number }[] = [];
    
    titleMap.forEach((count, title) => {
      total += count;
      titles.push({ title, count });
    });
    
    titles.sort((a, b) => b.count - a.count);
    
    result.push({ group, total, titles });
  });
  
  // Sort by predefined order, then by total
  const groupOrder = ROLE_GROUPS.map(g => g.name);
  result.sort((a, b) => {
    const aIndex = groupOrder.indexOf(a.group);
    const bIndex = groupOrder.indexOf(b.group);
    if (aIndex === -1 && bIndex === -1) return b.total - a.total;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
  
  return result;
}

export interface CategoryStats {
  category: string;
  label: string;
  count: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  client: "Client",
  prospect_client: "Prospect - Client",
  prospect_partner: "Prospect - Partner",
  partner: "Partner",
  influencer: "Influencer",
  random: "Random/Other",
};

export function aggregateCategories(contacts: Array<{ category: string | null }>): CategoryStats[] {
  const categoryMap = new Map<string, number>();
  
  contacts.forEach(contact => {
    const category = contact.category || "random";
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });
  
  const result: CategoryStats[] = [];
  
  categoryMap.forEach((count, category) => {
    result.push({
      category,
      label: CATEGORY_LABELS[category] || category,
      count,
    });
  });
  
  result.sort((a, b) => b.count - a.count);
  
  return result;
}

// Infer location from email domain
export function inferCountryFromEmail(email: string): string | null {
  if (!email) return null;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  
  const tld = domain.split('.').pop();
  
  const countryTLDs: Record<string, string> = {
    'ae': 'UAE',
    'in': 'India',
    'sg': 'Singapore',
    'jp': 'Japan',
    'uk': 'United Kingdom',
    'gb': 'United Kingdom',
    'us': 'United States',
    'au': 'Australia',
    'de': 'Germany',
    'fr': 'France',
    'cn': 'China',
    'hk': 'Hong Kong',
    'my': 'Malaysia',
    'id': 'Indonesia',
    'th': 'Thailand',
    'ph': 'Philippines',
    'kr': 'South Korea',
    'sa': 'Saudi Arabia',
    'qa': 'Qatar',
    'kw': 'Kuwait',
    'bh': 'Bahrain',
    'om': 'Oman',
    'eg': 'Egypt',
    'za': 'South Africa',
    'ng': 'Nigeria',
    'ke': 'Kenya',
    'br': 'Brazil',
    'mx': 'Mexico',
    'ca': 'Canada',
    'nz': 'New Zealand',
    'ie': 'Ireland',
    'nl': 'Netherlands',
    'be': 'Belgium',
    'ch': 'Switzerland',
    'at': 'Austria',
    'it': 'Italy',
    'es': 'Spain',
    'pt': 'Portugal',
    'se': 'Sweden',
    'no': 'Norway',
    'dk': 'Denmark',
    'fi': 'Finland',
    'pl': 'Poland',
    'ru': 'Russia',
    'tr': 'Turkey',
    'il': 'Israel',
  };
  
  return countryTLDs[tld || ''] || null;
}

// Infer country from phone number country code
export function inferCountryFromPhone(phone: string): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  const countryCodes: Record<string, string> = {
    '+971': 'UAE',
    '+91': 'India',
    '+65': 'Singapore',
    '+81': 'Japan',
    '+44': 'United Kingdom',
    '+1': 'United States',
    '+61': 'Australia',
    '+49': 'Germany',
    '+33': 'France',
    '+86': 'China',
    '+852': 'Hong Kong',
    '+60': 'Malaysia',
    '+62': 'Indonesia',
    '+66': 'Thailand',
    '+63': 'Philippines',
    '+82': 'South Korea',
    '+966': 'Saudi Arabia',
    '+974': 'Qatar',
    '+965': 'Kuwait',
    '+973': 'Bahrain',
    '+968': 'Oman',
    '+20': 'Egypt',
    '+27': 'South Africa',
    '+234': 'Nigeria',
    '+254': 'Kenya',
    '+55': 'Brazil',
    '+52': 'Mexico',
    '+64': 'New Zealand',
    '+353': 'Ireland',
    '+31': 'Netherlands',
    '+32': 'Belgium',
    '+41': 'Switzerland',
    '+43': 'Austria',
    '+39': 'Italy',
    '+34': 'Spain',
    '+351': 'Portugal',
    '+46': 'Sweden',
    '+47': 'Norway',
    '+45': 'Denmark',
    '+358': 'Finland',
    '+48': 'Poland',
    '+7': 'Russia',
    '+90': 'Turkey',
    '+972': 'Israel',
  };
  
  // Check longer codes first
  const sortedCodes = Object.keys(countryCodes).sort((a, b) => b.length - a.length);
  
  for (const code of sortedCodes) {
    if (cleaned.startsWith(code)) {
      return countryCodes[code];
    }
  }
  
  return null;
}
