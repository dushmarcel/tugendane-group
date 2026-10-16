import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

const STORAGE_KEY_RIDES = "tugendane_rides_v1";
const STORAGE_KEY_BOOKINGS = "tugendane_bookings_v1";

// Realistic initial sample rides connecting Rwandan towns with private cars
const INITIAL_RIDES = [
  {
    id: "ride-huye-kigali-1",
    driverId: "driver-marcel",
    driverName: "Marcel Dushimimana",
    driverPhone: "+250 788 123 456",
    driverRating: "4.9",
    driverTrips: 24,
    isVerified: true,
    nationalIdVerified: true,
    licenseVerified: true,
    from: "Huye",
    to: "Kigali",
    pickupLocation: "University of Rwanda (UR Huye Main Gate)",
    dropoffLocation: "Nyabugogo / Kigali Downtown",
    departureDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    departureTime: "08:30",
    availableSeats: 3,
    totalSeats: 4,
    price: 4500,
    vehicle: "Toyota RAV4 (Silver)",
    plate: "RAF 782 C",
    status: "active",
    description: "Traveling to Kigali for business. Spacious trunk for luggage, clean AC car. Safe driving guaranteed.",
    preferences: {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: true,
      luggage: "Medium suitcase ok",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "ride-kigali-huye-2",
    driverId: "driver-aime",
    driverName: "Aimé Mucyo",
    driverPhone: "+250 783 998 112",
    driverRating: "4.8",
    driverTrips: 16,
    isVerified: true,
    nationalIdVerified: true,
    licenseVerified: true,
    from: "Kigali",
    to: "Huye",
    pickupLocation: "Sonatubes Roundabout (Shell Station)",
    dropoffLocation: "Huye Town Centre / Market",
    departureDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    departureTime: "16:00",
    availableSeats: 2,
    totalSeats: 3,
    price: 4500,
    vehicle: "Toyota Corolla (Blue)",
    plate: "RAC 340 M",
    status: "active",
    description: "Heading home to Huye for the weekend. Leaving promptly at 4:00 PM from Sonatubes. Welcome aboard!",
    preferences: {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: true,
      luggage: "Small / Handbag only",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "ride-kigali-musanze-3",
    driverId: "driver-clarisse",
    driverName: "Clarisse Uwase",
    driverPhone: "+250 785 432 109",
    driverRating: "5.0",
    driverTrips: 31,
    isVerified: true,
    nationalIdVerified: true,
    licenseVerified: true,
    from: "Kigali",
    to: "Musanze",
    pickupLocation: "Gisimenti (Remera)",
    dropoffLocation: "Musanze Modern Market / Goico",
    departureDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    departureTime: "07:15",
    availableSeats: 3,
    totalSeats: 4,
    price: 4000,
    vehicle: "Hyundai Tucson (White)",
    plate: "RAD 612 K",
    status: "active",
    description: "Women-friendly ride. Calm driving, comfortable seats, phone charging cables available in car.",
    preferences: {
      noSmoking: true,
      musicAllowed: false,
      quietRide: true,
      womenOnly: true,
      ac: true,
      luggage: "Medium suitcase ok",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "ride-kigali-rubavu-4",
    driverId: "driver-jean",
    driverName: "Jean-Paul Ndayisaba",
    driverPhone: "+250 788 554 221",
    driverRating: "4.7",
    driverTrips: 19,
    isVerified: true,
    nationalIdVerified: true,
    licenseVerified: true,
    from: "Kigali",
    to: "Rubavu",
    pickupLocation: "Nyabugogo Bus Park (Opposite Main Gate)",
    dropoffLocation: "Gisenyi Town / Serena Hotel",
    departureDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    departureTime: "14:00",
    availableSeats: 3,
    totalSeats: 4,
    price: 5500,
    vehicle: "Subaru Forester (Grey)",
    plate: "RAE 905 P",
    status: "active",
    description: "Scenic trip to Rubavu/Gisenyi. Reliable private car, no delays waiting for buses to fill up.",
    preferences: {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: true,
      luggage: "Large suitcase ok",
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: "ride-muhanga-kigali-5",
    driverId: "driver-eric",
    driverName: "Eric Habimana",
    driverPhone: "+250 782 110 339",
    driverRating: "4.9",
    driverTrips: 14,
    isVerified: true,
    nationalIdVerified: true,
    licenseVerified: true,
    from: "Muhanga",
    to: "Kigali",
    pickupLocation: "Muhanga Roundabout",
    dropoffLocation: "Kigali Downtown",
    departureDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    departureTime: "06:45",
    availableSeats: 2,
    totalSeats: 3,
    price: 2500,
    vehicle: "Toyota Yaris (Black)",
    plate: "RAC 118 X",
    status: "active",
    description: "Daily morning commute to Kigali. Direct, fast, comfortable.",
    preferences: {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: false,
      luggage: "Small backpack",
    },
    createdAt: new Date().toISOString(),
  },
];

// Helper to get local stored rides
function getLocalRides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RIDES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(INITIAL_RIDES));
      return INITIAL_RIDES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : INITIAL_RIDES;
  } catch {
    return INITIAL_RIDES;
  }
}

function saveLocalRides(rides) {
  try {
    localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(rides));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
}

// Bookings / Passenger Requests helper
export function getLocalBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  } catch (err) {
    console.warn("Could not save bookings to localStorage:", err);
  }
}

function mapRideDoc(docSnapshot) {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    driverId: data.driverId || "",
    driver: data.driverName || "Driver",
    driverName: data.driverName || "Driver",
    driverPhone: data.driverPhone || "+250 788 000 000",
    driverRating: data.driverRating || "5.0",
    driverTrips: data.driverTrips || 1,
    isVerified: Boolean(data.isVerified ?? true),
    nationalIdVerified: Boolean(data.nationalIdVerified ?? true),
    licenseVerified: Boolean(data.licenseVerified ?? true),
    from: data.from,
    to: data.to,
    pickupLocation: data.pickupLocation || "",
    dropoffLocation: data.dropoffLocation || "",
    departureDate: data.departureDate,
    departureTime: data.departureTime,
    availableSeats: Number(data.availableSeats ?? 3),
    seats: Number(data.availableSeats ?? 3),
    totalSeats: Number(data.totalSeats ?? 4),
    price: typeof data.price === "number" ? data.price : parseInt(String(data.price).replace(/[^0-9]/g, ""), 10) || 4500,
    vehicle: data.vehicle || "Private Car",
    car: data.vehicle || "Private Car",
    plate: data.plate || "RAC 000 A",
    status: data.status || "active",
    createdAt: data.createdAt,
    description: data.description || "",
    preferences: data.preferences || {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: true,
      luggage: "Standard",
    },
  };
}

export async function createRide(rideData) {
  const localRides = getLocalRides();
  const newRide = {
    id: `ride-${Date.now()}`,
    driverId: rideData.driverId || "demo-driver",
    driverName: rideData.driverName || "Driver",
    driverPhone: rideData.driverPhone || "+250 788 123 456",
    driverRating: "5.0",
    driverTrips: 1,
    isVerified: true,
    nationalIdVerified: true,
    licenseVerified: true,
    from: rideData.from,
    to: rideData.to,
    pickupLocation: rideData.pickupLocation || `${rideData.from} Centre`,
    dropoffLocation: rideData.dropoffLocation || `${rideData.to} Centre`,
    departureDate: rideData.departureDate,
    departureTime: rideData.departureTime,
    availableSeats: Number(rideData.availableSeats || 3),
    seats: Number(rideData.availableSeats || 3),
    totalSeats: Number(rideData.totalSeats || rideData.availableSeats || 4),
    price: typeof rideData.price === "number" ? rideData.price : parseInt(String(rideData.price).replace(/[^0-9]/g, ""), 10) || 4500,
    vehicle: rideData.vehicle || "Toyota Corolla",
    plate: rideData.plate || "RAC 100 A",
    status: "active",
    description: rideData.description || "Shared private car trip.",
    preferences: rideData.preferences || {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: true,
      luggage: "Standard bag",
    },
    createdAt: new Date().toISOString(),
  };

  // Save to local storage first for snappy response
  const updatedRides = [newRide, ...localRides];
  saveLocalRides(updatedRides);

  // Sync to Firestore if online & auth available
  try {
    const ridesCollection = collection(db, "rides");
    const payload = {
      ...newRide,
      createdAt: serverTimestamp(),
    };
    const rideRef = await addDoc(ridesCollection, payload);
    newRide.firestoreId = rideRef.id;
  } catch (err) {
    console.log("Firestore write optional / skipped:", err?.message);
  }

  return newRide;
}

export async function getAvailableRides() {
  const localRides = getLocalRides();

  // Try to query Firestore if online
  try {
    const ridesCollection = collection(db, "rides");
    const ridesQuery = query(
      ridesCollection,
      where("status", "==", "active"),
      orderBy("departureDate", "asc"),
      orderBy("departureTime", "asc")
    );
    const snapshot = await getDocs(ridesQuery);
    if (!snapshot.empty) {
      const firestoreRides = snapshot.docs.map(mapRideDoc);
      // Merge unique by ID
      const existingIds = new Set(firestoreRides.map((r) => r.id));
      const combined = [...firestoreRides, ...localRides.filter((r) => !existingIds.has(r.id))];
      saveLocalRides(combined);
      return combined;
    }
  } catch (err) {
    console.log("Using cached/local rides:", err?.message);
  }

  return localRides.filter((r) => r.status === "active");
}

export async function searchRides(from, to, date, preferences = {}) {
  const allRides = await getAvailableRides();

  return allRides.filter((ride) => {
    if (from && ride.from.toLowerCase() !== from.toLowerCase()) return false;
    if (to && ride.to.toLowerCase() !== to.toLowerCase()) return false;
    if (date && ride.departureDate !== date) return false;

    // Preference filters
    if (preferences.womenOnly && !ride.preferences?.womenOnly) return false;
    if (preferences.noSmoking && !ride.preferences?.noSmoking) return false;
    if (preferences.ac && !ride.preferences?.ac) return false;
    if (preferences.quietRide && !ride.preferences?.quietRide) return false;

    return ride.status === "active" && ride.availableSeats > 0;
  });
}

export async function getRideById(id) {
  const localRides = getLocalRides();
  const localMatch = localRides.find((r) => r.id === id);
  if (localMatch) return localMatch;

  try {
    const rideDoc = doc(db, "rides", id);
    const snapshot = await getDoc(rideDoc);
    if (snapshot.exists()) {
      return mapRideDoc(snapshot);
    }
  } catch (err) {
    console.log("Firestore fetch error:", err?.message);
  }

  return null;
}

// Seat Booking / Reservation Flow
export async function bookRide({ rideId, passenger, seatsCount, pickupPoint, notes, paymentMethod }) {
  const allRides = getLocalRides();
  const rideIndex = allRides.findIndex((r) => r.id === rideId);

  if (rideIndex === -1) {
    throw new Error("Ride not found");
  }

  const ride = allRides[rideIndex];
  if (ride.availableSeats < seatsCount) {
    throw new Error("Not enough empty seats available");
  }

  // Deduct seats
  ride.availableSeats -= seatsCount;
  ride.seats = ride.availableSeats;
  if (ride.availableSeats === 0) {
    ride.status = "full";
  }
  allRides[rideIndex] = ride;
  saveLocalRides(allRides);

  // Create booking record
  const booking = {
    id: `book-${Date.now()}`,
    rideId: ride.id,
    driverId: ride.driverId,
    driverName: ride.driverName,
    driverPhone: ride.driverPhone,
    passengerId: passenger.uid || "guest-passenger",
    passengerName: passenger.fullName || "Passenger",
    passengerPhone: passenger.phone || "+250 788 000 000",
    from: ride.from,
    to: ride.to,
    pickupLocation: pickupPoint || ride.pickupLocation,
    dropoffLocation: ride.dropoffLocation,
    departureDate: ride.departureDate,
    departureTime: ride.departureTime,
    seatsBooked: seatsCount,
    pricePerSeat: ride.price,
    subtotal: ride.price * seatsCount,
    platformFee: Math.round(ride.price * seatsCount * 0.05),
    totalPrice: Math.round(ride.price * seatsCount * 1.05),
    vehicle: ride.vehicle,
    plate: ride.plate,
    paymentMethod: paymentMethod || "MTN Mobile Money",
    paymentStatus: "Pending Pickup Contribution",
    status: "Confirmed",
    notes: notes || "",
    bookedAt: new Date().toISOString(),
  };

  const existingBookings = getLocalBookings();
  const updatedBookings = [booking, ...existingBookings];
  saveLocalBookings(updatedBookings);

  // Sync booking to Firestore
  try {
    const bookingsCollection = collection(db, "bookings");
    const docRef = await addDoc(bookingsCollection, {
      ...booking,
      createdAt: serverTimestamp(),
    });
    booking.firestoreId = docRef.id;

    // Update availableSeats on the ride in Firestore if it has an id
    if (ride.firestoreId || (!ride.id.startsWith("ride-huye") && !ride.id.startsWith("ride-kigali") && !ride.id.startsWith("ride-muhanga"))) {
      const rideDocRef = doc(db, "rides", ride.firestoreId || ride.id);
      await updateDoc(rideDocRef, {
        availableSeats: ride.availableSeats,
        status: ride.status,
      });
    }
  } catch (err) {
    console.log("Firestore booking sync error:", err?.message);
  }

  return booking;
}

// Update booking request status (Driver action: Accept or Decline)
export async function updateBookingStatus(bookingId, newStatus) {
  const bookings = getLocalBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId || b.firestoreId === bookingId);
  if (idx !== -1) {
    bookings[idx].status = newStatus;
    saveLocalBookings(bookings);

    // Sync status to Firestore
    try {
      if (bookings[idx].firestoreId) {
        const bookDocRef = doc(db, "bookings", bookings[idx].firestoreId);
        await updateDoc(bookDocRef, { status: newStatus });
      }
    } catch (err) {
      console.log("Firestore status sync error:", err?.message);
    }

    return bookings[idx];
  }
  return null;
}

// Fetch user bookings from Firestore
export async function getUserBookings(userId) {
  const local = getLocalBookings();
  if (!userId) return local;

  try {
    const bookingsRef = collection(db, "bookings");
    const q1 = query(bookingsRef, where("passengerId", "==", userId));
    const snap1 = await getDocs(q1);

    const q2 = query(bookingsRef, where("driverId", "==", userId));
    const snap2 = await getDocs(q2);

    const remote = [];
    snap1.forEach((d) => remote.push({ firestoreId: d.id, ...d.data() }));
    snap2.forEach((d) => remote.push({ firestoreId: d.id, ...d.data() }));

    if (remote.length > 0) {
      const ids = new Set(remote.map((b) => b.id || b.firestoreId));
      const combined = [...remote, ...local.filter((b) => !ids.has(b.id))];
      saveLocalBookings(combined);
      return combined;
    }
  } catch (err) {
    console.log("Firestore getUserBookings error:", err?.message);
  }
  return local;
}
