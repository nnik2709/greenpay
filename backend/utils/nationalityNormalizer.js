/**
 * Nationality Normalizer
 * Handles conversion between 3-letter ISO codes and full country names
 * Ensures passport lookups work regardless of format stored in database
 */

// ISO 3166-1 Alpha-3 Country Codes to Nationality Names
const COUNTRY_CODE_MAP = {
  // Common countries in PNG context
  'PNG': 'Papua New Guinean',
  'AUS': 'Australian',
  'NZL': 'New Zealander',
  'USA': 'American',
  'GBR': 'British',
  'CHN': 'Chinese',
  'PHL': 'Filipino',
  'IND': 'Indian',
  'IDN': 'Indonesian',
  'JPN': 'Japanese',
  'KOR': 'Korean',
  'MYS': 'Malaysian',
  'SGP': 'Singaporean',
  'THA': 'Thai',
  'VNM': 'Vietnamese',

  // Full A-Z list
  'AFG': 'Afghan',
  'ALB': 'Albanian',
  'DZA': 'Algerian',
  'AND': 'Andorran',
  'AGO': 'Angolan',
  'ATG': 'Antiguan',
  'ARG': 'Argentinian',
  'ARM': 'Armenian',
  'AUT': 'Austrian',
  'AZE': 'Azerbaijani',
  'BHS': 'Bahamian',
  'BHR': 'Bahraini',
  'BGD': 'Bangladeshi',
  'BRB': 'Barbadian',
  'BLR': 'Belarusian',
  'BEL': 'Belgian',
  'BLZ': 'Belizean',
  'BEN': 'Beninese',
  'BTN': 'Bhutanese',
  'BOL': 'Bolivian',
  'BIH': 'Bosnian',
  'BWA': 'Botswanan',
  'BRA': 'Brazilian',
  'BRN': 'Bruneian',
  'BGR': 'Bulgarian',
  'BFA': 'Burkinabe',
  'BDI': 'Burundian',
  'KHM': 'Cambodian',
  'CMR': 'Cameroonian',
  'CAN': 'Canadian',
  'CPV': 'Cape Verdean',
  'CAF': 'Central African',
  'TCD': 'Chadian',
  'CHL': 'Chilean',
  'COL': 'Colombian',
  'COM': 'Comorian',
  'COG': 'Congolese',
  'COD': 'Congolese',
  'CRI': 'Costa Rican',
  'HRV': 'Croatian',
  'CUB': 'Cuban',
  'CYP': 'Cypriot',
  'CZE': 'Czech',
  'DNK': 'Denmark',
  'DJI': 'Djibouti',
  'DMA': 'Dominica',
  'DOM': 'Dominican',
  'ECU': 'Ecuadorean',
  'EGY': 'Egyptian',
  'SLV': 'Salvadoran',
  'GNQ': 'Equatorial Guinean',
  'ERI': 'Eritrean',
  'EST': 'Estonian',
  'ETH': 'Ethiopian',
  'FJI': 'Fijian',
  'FIN': 'Finnish',
  'FRA': 'French',
  'GAB': 'Gabonese',
  'GMB': 'Gambian',
  'GEO': 'Georgian',
  'DEU': 'German',
  'GHA': 'Ghanaian',
  'GRC': 'Greek',
  'GRD': 'Grenadian',
  'GTM': 'Guatemalan',
  'GIN': 'Guinean',
  'GNB': 'Guinea-Bissauan',
  'GUY': 'Guyanese',
  'HTI': 'Haitian',
  'HND': 'Honduran',
  'HUN': 'Hungarian',
  'ISL': 'Icelandic',
  'IRL': 'Irish',
  'ISR': 'Israeli',
  'ITA': 'Italian',
  'JAM': 'Jamaican',
  'JOR': 'Jordanian',
  'KAZ': 'Kazakhstani',
  'KEN': 'Kenyan',
  'KWT': 'Kuwaiti',
  'KGZ': 'Kyrgyz',
  'LAO': 'Laotian',
  'LVA': 'Latvian',
  'LBN': 'Lebanese',
  'LSO': 'Basotho',
  'LBR': 'Liberian',
  'LBY': 'Libyan',
  'LIE': 'Liechtensteiner',
  'LTU': 'Lithuanian',
  'LUX': 'Luxembourger',
  'MDG': 'Malagasy',
  'MWI': 'Malawian',
  'MDV': 'Maldivian',
  'MLI': 'Malian',
  'MLT': 'Maltese',
  'MHL': 'Marshallese',
  'MRT': 'Mauritanian',
  'MUS': 'Mauritian',
  'MEX': 'Mexican',
  'FSM': 'Micronesian',
  'MDA': 'Moldovan',
  'MCO': 'Monégasque',
  'MNG': 'Mongolian',
  'MNE': 'Montenegrin',
  'MAR': 'Moroccan',
  'MOZ': 'Mozambican',
  'MMR': 'Burmese',
  'NAM': 'Namibian',
  'NRU': 'Nauruan',
  'NPL': 'Nepalese',
  'NLD': 'Dutch',
  'NIC': 'Nicaraguan',
  'NER': 'Nigerien',
  'NGA': 'Nigerian',
  'MKD': 'Macedonian',
  'NOR': 'Norwegian',
  'OMN': 'Omani',
  'PAK': 'Pakistani',
  'PLW': 'Palauan',
  'PSE': 'Palestinian',
  'PAN': 'Panamanian',
  'PRY': 'Paraguayan',
  'PER': 'Peruvian',
  'POL': 'Polish',
  'PRT': 'Portuguese',
  'QAT': 'Qatari',
  'ROU': 'Romanian',
  'RUS': 'Russian',
  'RWA': 'Rwandan',
  'KNA': 'Kittitian',
  'LCA': 'Saint Lucian',
  'VCT': 'Saint Vincentian',
  'WSM': 'Samoan',
  'SMR': 'Sammarinese',
  'STP': 'Sao Tomean',
  'SAU': 'Saudi',
  'SEN': 'Senegalese',
  'SRB': 'Serbian',
  'SYC': 'Seychellois',
  'SLE': 'Sierra Leonean',
  'SVK': 'Slovak',
  'SVN': 'Slovenian',
  'SLB': 'Solomon Islander',
  'SOM': 'Somali',
  'ZAF': 'South African',
  'SSD': 'South Sudanese',
  'ESP': 'Spanish',
  'LKA': 'Sri Lankan',
  'SDN': 'Sudanese',
  'SUR': 'Surinamese',
  'SWZ': 'Swazi',
  'SWE': 'Swedish',
  'CHE': 'Swiss',
  'SYR': 'Syrian',
  'TWN': 'Taiwanese',
  'TJK': 'Tajik',
  'TZA': 'Tanzanian',
  'TLS': 'Timorese',
  'TGO': 'Togolese',
  'TON': 'Tongan',
  'TTO': 'Trinidadian',
  'TUN': 'Tunisian',
  'TUR': 'Turkish',
  'TKM': 'Turkmen',
  'TUV': 'Tuvaluan',
  'UGA': 'Ugandan',
  'UKR': 'Ukrainian',
  'ARE': 'Emirati',
  'URY': 'Uruguayan',
  'UZB': 'Uzbekistani',
  'VUT': 'Vanuatuan',
  'VAT': 'Vatican',
  'VEN': 'Venezuelan',
  'YEM': 'Yemeni',
  'ZMB': 'Zambian',
  'ZWE': 'Zimbabwean'
};

// Reverse mapping: Full name to code
const NATIONALITY_TO_CODE = {};
Object.keys(COUNTRY_CODE_MAP).forEach(code => {
  const nationality = COUNTRY_CODE_MAP[code].toLowerCase();
  NATIONALITY_TO_CODE[nationality] = code;
});

/**
 * Normalize nationality to 3-letter ISO code
 * @param {string} input - Can be 3-letter code (DNK) or full name (Denmark)
 * @returns {string|null} - 3-letter ISO code or null if not found
 */
function normalizeToCode(input) {
  if (!input) return null;

  const cleaned = input.trim().toUpperCase();

  // Already a 3-letter code?
  if (cleaned.length === 3 && COUNTRY_CODE_MAP[cleaned]) {
    return cleaned;
  }

  // Full name? Look up code
  const code = NATIONALITY_TO_CODE[input.trim().toLowerCase()];
  return code || null;
}

/**
 * Normalize nationality to full name
 * @param {string} input - Can be 3-letter code (DNK) or full name (Denmark)
 * @returns {string|null} - Full nationality name or null if not found
 */
function normalizeToName(input) {
  if (!input) return null;

  const cleaned = input.trim().toUpperCase();

  // Is it a 3-letter code?
  if (cleaned.length === 3 && COUNTRY_CODE_MAP[cleaned]) {
    return COUNTRY_CODE_MAP[cleaned];
  }

  // Already a full name? Capitalize properly
  const lowerInput = input.trim().toLowerCase();
  if (NATIONALITY_TO_CODE[lowerInput]) {
    const code = NATIONALITY_TO_CODE[lowerInput];
    return COUNTRY_CODE_MAP[code];
  }

  // Not found - return original
  return input;
}

/**
 * Check if two nationalities match (handles both code and name formats)
 * @param {string} nationality1 - e.g., "DNK" or "Denmark"
 * @param {string} nationality2 - e.g., "Denmark" or "DNK"
 * @returns {boolean} - True if they represent the same country
 */
function nationalitiesMatch(nationality1, nationality2) {
  if (!nationality1 || !nationality2) return false;

  const code1 = normalizeToCode(nationality1);
  const code2 = normalizeToCode(nationality2);

  // Both resolved to codes? Compare codes
  if (code1 && code2) {
    return code1 === code2;
  }

  // Fallback: case-insensitive string comparison
  return nationality1.trim().toLowerCase() === nationality2.trim().toLowerCase();
}

/**
 * Build SQL WHERE clause for nationality matching
 * Handles both 3-letter codes and full names
 *
 * @param {string} nationality - Nationality from MRZ (usually 3-letter code)
 * @param {number} paramIndex - Parameter index for SQL ($1, $2, etc.)
 * @returns {object} - { whereClause, params }
 */
function buildNationalityWhereClause(nationality, paramIndex = 1) {
  if (!nationality) {
    return {
      whereClause: `(nationality IS NULL OR nationality = '')`,
      params: []
    };
  }

  const code = normalizeToCode(nationality);
  const name = normalizeToName(nationality);

  // Build OR clause to match either format
  const whereClause = `(
    nationality = $${paramIndex}
    OR nationality = $${paramIndex + 1}
    OR UPPER(nationality) = $${paramIndex}
    OR UPPER(nationality) = $${paramIndex + 1}
  )`;

  return {
    whereClause,
    params: [code || nationality, name || nationality]
  };
}

module.exports = {
  normalizeToCode,
  normalizeToName,
  nationalitiesMatch,
  buildNationalityWhereClause,
  COUNTRY_CODE_MAP
};
