// Nominatim API Service for Location Search
// Free geocoding service using OpenStreetMap data
// No API key required, but please respect usage policy

export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    province?: string;
    region?: string;
    country?: string;
    postcode?: string;
    building?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
    office?: string;
  };
}

export interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// User agent required by Nominatim usage policy
const USER_AGENT = 'SafeTransit/1.0';

/**
 * Search for locations using Nominatim geocoding
 * Focused on Philippines/Manila region
 */
export async function searchLocations(
  query: string,
  limit: number = 5
): Promise<LocationSearchResult[]> {
  try {
    // Focus search on Philippines (countrycodes=ph)
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: (limit * 2).toString(), // Fetch more to filter/sort
      countrycodes: 'ph', // Limit to Philippines
      viewbox: '120.8,14.8,121.2,14.4', // Manila area bounding box
      bounded: '0', // Allow results outside viewbox but prioritize within
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }

    const data: NominatimPlace[] = await response.json();

    const results = data.map((place) => {
      const name = getShortName(place);
      return {
        id: place.place_id.toString(),
        name,
        address: place.display_name,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        type: place.type,
        // Score for sorting (higher = better match)
        score: calculateRelevanceScore(query, name, place.display_name),
      };
    });

    // Sort by relevance score and take top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ score: _score, ...result }) => result);
  } catch (error) {
    console.error('Nominatim search error:', error);
    return [];
  }
}

/**
 * Calculate relevance score for search results
 * Prioritizes matches in the name over matches in full address
 */
function calculateRelevanceScore(query: string, name: string, fullAddress: string): number {
  const queryLower = query.toLowerCase();
  const nameLower = name.toLowerCase();
  const addressLower = fullAddress.toLowerCase();

  let score = 0;

  // Exact match in name (highest priority)
  if (nameLower === queryLower) {
    score += 1000;
  }

  // Name starts with query (very high priority)
  if (nameLower.startsWith(queryLower)) {
    score += 500;
  }

  // Query appears in name (high priority)
  if (nameLower.includes(queryLower)) {
    score += 100;
  }

  // Name starts with any word in query
  const queryWords = queryLower.split(' ');
  for (const word of queryWords) {
    if (word.length > 2 && nameLower.startsWith(word)) {
      score += 50;
    }
  }

  // Query appears in address (lower priority)
  if (addressLower.includes(queryLower)) {
    score += 10;
  }

  // Prefer shorter names (more specific)
  score -= name.length * 0.1;

  return score;
}

/**
 * Reverse geocode: Get address from coordinates
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationSearchResult | null> {
  try {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lon: longitude.toString(),
      format: 'json',
      addressdetails: '1',
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?${params.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim reverse geocode error: ${response.statusText}`);
    }

    const place: NominatimPlace = await response.json();

    return {
      id: place.place_id.toString(),
      name: getShortName(place),
      address: place.display_name,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      type: place.type,
    };
  } catch (error) {
    console.error('Nominatim reverse geocode error:', error);
    return null;
  }
}

/**
 * Get a short, user-friendly name from the place data
 */
function getShortName(place: NominatimPlace): string {
  // Get the first part of display_name (usually the most specific location)
  const firstPart = place.display_name.split(',')[0].trim();

  if (place.address) {
    const {
      road,
      suburb,
      city,
      municipality,
      building,
      amenity,
      shop,
      tourism,
      office
    } = place.address;

    // Prioritize specific place names
    if (building && building !== firstPart) return building;
    if (amenity) return amenity;
    if (shop) return shop;
    if (tourism) return tourism;
    if (office) return office;

    // Then roads with area context
    if (road) {
      const area = suburb || city || municipality;
      if (area && area !== road) {
        return `${road}, ${area}`;
      }
      return road;
    }

    // Area names
    if (suburb) return suburb;
    if (city) return city;
    if (municipality) return municipality;
  }

  // Fallback to first part of display name
  return firstPart;
}

/**
 * Curated popular places in Metro Manila with verified coordinates.
 * Hand-checked against authoritative sources (Wikipedia infoboxes, Nominatim live)
 * on 2026-04-26. Returning hardcoded coords avoids two real failure modes:
 *   1. Nominatim text-search for "Ortigas Center" returns a pedestrian footbridge
 *      in Pasig — not the CBD — which produced wrong suggestions.
 *   2. Brand renames (e.g. Resorts World Manila -> Newport World Resorts) leave
 *      stale text searches pointing at the wrong place.
 */
export async function getManilaPopularPlaces(): Promise<LocationSearchResult[]> {
  return [
    {
      id: 'popular-makati-city-hall',
      name: 'Makati City Hall',
      address: 'J. P. Rizal Street, Poblacion, Makati, Metro Manila, Philippines',
      latitude: 14.5705,
      longitude: 121.0272,
      type: 'townhall',
    },
    {
      id: 'popular-sm-moa',
      name: 'SM Mall of Asia',
      address: 'Seaside Boulevard, Pasay, Metro Manila, Philippines',
      latitude: 14.5352,
      longitude: 120.9816,
      type: 'mall',
    },
    {
      id: 'popular-bgc',
      name: 'Bonifacio Global City',
      address: 'Fort Bonifacio, Taguig, Metro Manila, Philippines',
      latitude: 14.5494,
      longitude: 121.0546,
      type: 'neighbourhood',
    },
    {
      id: 'popular-naia-t3',
      name: 'NAIA Terminal 3',
      address: 'Andrews Avenue, Pasay, Metro Manila, Philippines',
      latitude: 14.5201,
      longitude: 121.0142,
      type: 'aeroway',
    },
    {
      id: 'popular-qc-city-hall',
      name: 'Quezon City Hall',
      address: 'Mayaman Street, Diliman, Quezon City, Metro Manila, Philippines',
      latitude: 14.6464,
      longitude: 121.0500,
      type: 'townhall',
    },
    {
      id: 'popular-manila-city-hall',
      name: 'Manila City Hall',
      address: 'Taft Avenue, Ermita, Manila, Metro Manila, Philippines',
      latitude: 14.5893,
      longitude: 120.9816,
      type: 'townhall',
    },
    {
      id: 'popular-ortigas-center',
      name: 'Ortigas Center',
      address: 'Pasig, Metro Manila, Philippines',
      latitude: 14.5854,
      longitude: 121.0641,
      type: 'commercial',
    },
    {
      id: 'popular-greenhills',
      name: 'Greenhills Shopping Center',
      address: 'Greenhills, San Juan, Metro Manila, Philippines',
      latitude: 14.6017,
      longitude: 121.0499,
      type: 'mall',
    },
  ];
}
