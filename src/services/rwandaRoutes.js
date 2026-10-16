// Rwanda Route, Locations & Fair Pricing Engine for Tugendane Rides (Tugendane Group)
// Built for community carpooling & empty car seat marketplace

export const RWANDA_CITIES = [
  "Kigali",
  "Huye",
  "Musanze",
  "Rubavu",
  "Muhanga",
  "Rusizi",
  "Nyagatare",
  "Kayonza",
  "Rwamagana",
  "Nyanza",
  "Ruhango",
  "Karongi",
  "Gicumbi",
  "Bugesera",
  "Kampala (UG)",
  "Bujumbura (BI)",
  "Goma (DRC)",
  "Nairobi (KE)",
];

export const POPULAR_ROUTES = [
  { from: "Huye", to: "Kigali", avgDuration: "2h 30m", dist: "135 km" },
  { from: "Kigali", to: "Huye", avgDuration: "2h 30m", dist: "135 km" },
  { from: "Kigali", to: "Musanze", avgDuration: "1h 50m", dist: "95 km" },
  { from: "Musanze", to: "Kigali", avgDuration: "1h 50m", dist: "95 km" },
  { from: "Kigali", to: "Rubavu", avgDuration: "3h 15m", dist: "155 km" },
  { from: "Rubavu", to: "Kigali", avgDuration: "3h 15m", dist: "155 km" },
  { from: "Kigali", to: "Muhanga", avgDuration: "55m", dist: "50 km" },
  { from: "Kigali", to: "Rusizi", avgDuration: "5h 30m", dist: "235 km" },
  { from: "Kigali", to: "Nyagatare", avgDuration: "2h 45m", dist: "140 km" },
];

export const CITY_PICKUP_POINTS = {
  Kigali: ["Nyabugogo Bus Park Area", "Kigali Downtown", "Sonatubes Roundabout", "Gisimenti (Remera)", "Kimironko Market", "Kacyiru Executive", "Kicukiro Centre"],
  Huye: ["University of Rwanda (UR Huye Campus)", "Huye Town Centre / Market", "Taba", "Mukoni Roundabout"],
  Musanze: ["Musanze Modern Market", "Goico Plaza", "Musanze Bus Terminal Area", "Ruhengeri Hospital Junction"],
  Rubavu: ["Gisenyi Town / Serena area", "Rubavu Central Market", "La Corniche Border", "Petite Barrière"],
  Muhanga: ["Muhanga Town Roundabout", "Gitarama Market Area", "Kabgayi Junction"],
  Rusizi: ["Kamembe Town Centre", "Rusizi Border Post", "Cyangugu Port"],
  Nyagatare: ["Nyagatare Market", "University of Rwanda Nyagatare"],
  Kayonza: ["Kayonza Roundabout Junction", "Kayonza Market"],
  Rwamagana: ["Rwamagana Town Centre", "Dereva Hotel Junction"],
  Nyanza: ["King's Palace Road", "Nyanza Town Centre"],
  Karongi: ["Kibuye Lake Side", "Karongi Market"],
};

// Suggested Fair Pricing guide (Fuel cost-sharing standard in RWF)
export const ROUTE_PRICING = {
  "kigali-huye": 4500,
  "huye-kigali": 4500,
  "kigali-musanze": 4000,
  "musanze-kigali": 4000,
  "kigali-rubavu": 5500,
  "rubavu-kigali": 5500,
  "kigali-muhanga": 2500,
  "muhanga-kigali": 2500,
  "kigali-rusizi": 8500,
  "rusizi-kigali": 8500,
  "kigali-nyagatare": 4500,
  "nyagatare-kigali": 4500,
  "kigali-kayonza": 3000,
  "kayonza-kigali": 3000,
  "kigali-rwamagana": 2500,
  "rwamagana-kigali": 2500,
  "kigali-nyanza": 3500,
  "nyanza-kigali": 3500,
  "kigali-karongi": 5000,
  "karongi-kigali": 5000,
  "kigali-bugesera": 2000,
  "bugesera-kigali": 2000,
  "kigali-kampala (ug)": 25000,
  "kampala (ug)-kigali": 25000,
  "kigali-goma (drc)": 6000,
  "goma (drc)-kigali": 6000,
  "kigali-bujumbura (bi)": 20000,
  "bujumbura (bi)-kigali": 20000,
};

export const PLATFORM_COMMISSION_PERCENT = 5; // 5% platform fee for Tugendane Rides marketplace

export function getSuggestedPrice(from, to) {
  if (!from || !to) return 4000;
  const key = `${from.toLowerCase().trim()}-${to.toLowerCase().trim()}`;
  return ROUTE_PRICING[key] || 4000;
}

export function calculatePricingBreakdown(seatPrice, seatCount = 1) {
  const priceNum = typeof seatPrice === "number" ? seatPrice : parseInt(String(seatPrice).replace(/[^0-9]/g, ""), 10) || 4500;
  const subtotal = priceNum * seatCount;
  const platformFee = Math.round(subtotal * (PLATFORM_COMMISSION_PERCENT / 100));
  const driverNetEarnings = subtotal - platformFee;
  const passengerTotal = subtotal + platformFee;

  return {
    pricePerSeat: priceNum,
    seatCount,
    subtotal,
    platformFee,
    driverNetEarnings,
    passengerTotal,
  };
}
