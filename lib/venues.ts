export interface Venue {
  name: string;
  lat: number;
  lng: number;
  type: "airport" | "station" | "stadium" | "mall";
  city: string;
}

/** Curated venue shortlist — search runs on live OSM; the Google CTA covers unmapped spots. */
export const VENUE_PRESETS: Venue[] = [
  // Airports
  { name: "IGI Airport", lat: 28.5562, lng: 77.1, type: "airport", city: "Delhi" },
  { name: "CSMIA Mumbai", lat: 19.0896, lng: 72.8656, type: "airport", city: "Mumbai" },
  { name: "Kempegowda Airport", lat: 13.1986, lng: 77.7066, type: "airport", city: "Bengaluru" },
  { name: "Sardar Vallabhbhai Patel Airport", lat: 23.0725, lng: 72.6266, type: "airport", city: "Ahmedabad" },
  { name: "Heathrow", lat: 51.47, lng: -0.4543, type: "airport", city: "London" },
  { name: "JFK Airport", lat: 40.6413, lng: -73.7781, type: "airport", city: "New York" },
  // Stations
  { name: "CSMT Station", lat: 18.9401, lng: 72.8351, type: "station", city: "Mumbai" },
  { name: "New Delhi Railway", lat: 28.6426, lng: 77.2205, type: "station", city: "Delhi" },
  { name: "Bengaluru City Station", lat: 12.9784, lng: 77.5667, type: "station", city: "Bengaluru" },
  { name: "Ahmedabad Junction", lat: 23.0258, lng: 72.6013, type: "station", city: "Ahmedabad" },
  { name: "Vadodara Junction", lat: 22.3107, lng: 73.1863, type: "station", city: "Vadodara" },
  // Stadiums
  { name: "Wankhede Stadium", lat: 18.9388, lng: 72.8257, type: "stadium", city: "Mumbai" },
  { name: "M Chinnaswamy Stadium", lat: 12.9788, lng: 77.5996, type: "stadium", city: "Bengaluru" },
  { name: "Narendra Modi Stadium", lat: 23.0917, lng: 72.5975, type: "stadium", city: "Ahmedabad" },
  { name: "Wembley Stadium", lat: 51.556, lng: -0.2795, type: "stadium", city: "London" },
  // Malls / event zones
  { name: "Phoenix Marketcity", lat: 19.0867, lng: 72.889, type: "mall", city: "Mumbai" },
  { name: "Select CityWalk", lat: 28.5289, lng: 77.2193, type: "mall", city: "Delhi" },
];

export const VENUE_TYPE_LABEL: Record<Venue["type"], string> = {
  airport: "Airport",
  station: "Station",
  stadium: "Stadium",
  mall: "Mall",
};
