import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  runTransaction,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { calculateServiceFee } from "./rwandaRoutes";

const STORAGE_KEY_RIDES = "tugendane_rides_v1";
const STORAGE_KEY_BOOKINGS = "tugendane_bookings_v1";

// Old demo entries are removed from cached marketplace data.
const DEMO_RIDE_IDS = new Set([
  "ride-huye-kigali-1", "ride-kigali-huye-2", "ride-kigali-musanze-3",
  "ride-kigali-rubavu-4", "ride-muhanga-kigali-5",
]);

// Helper to get local stored rides
function getLocalRides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RIDES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const safeRides = Array.isArray(parsed) ? parsed.filter((ride) => !DEMO_RIDE_IDS.has(ride.id) && !String(ride.driverId || "").startsWith("driver-") ) : [];
    if (safeRides.length !== parsed.length) localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(safeRides));
    return safeRides;
  } catch {
    return [];
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
    driverPhone: data.driverPhone || "",
    driverRating: null,
    driverTrips: 0,
    // Verification and review flows are not yet connected to an official reviewer.
    isVerified: false,
    nationalIdVerified: false,
    licenseVerified: false,
    from: data.from,
    to: data.to,
    pickupLocation: data.pickupLocation || "",
    pickupLatitude: typeof data.pickupLatitude === "number" ? data.pickupLatitude : null,
    pickupLongitude: typeof data.pickupLongitude === "number" ? data.pickupLongitude : null,
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
  const newRide = {
    id: "",
    firestoreId: "",
    driverId: rideData.driverId || "demo-driver",
    driverName: rideData.driverName || "Driver",
    driverPhone: rideData.driverPhone || "",
    driverRating: null,
    driverTrips: 0,
    isVerified: false,
    nationalIdVerified: false,
    licenseVerified: false,
    from: rideData.from,
    to: rideData.to,
    pickupLocation: rideData.pickupLocation || `${rideData.from} Centre`,
    pickupLatitude: Number.isFinite(rideData.pickupLatitude) ? rideData.pickupLatitude : null,
    pickupLongitude: Number.isFinite(rideData.pickupLongitude) ? rideData.pickupLongitude : null,
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

  const rideRef = await addDoc(collection(db, "rides"), { ...newRide, createdAt: serverTimestamp() });
  newRide.id = rideRef.id;
  newRide.firestoreId = rideRef.id;
  const localRides = getLocalRides();
  saveLocalRides([newRide, ...localRides]);

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
      saveLocalRides(firestoreRides);
      return firestoreRides;
    }
  } catch (err) {
    console.log("Using cached/local rides:", err?.message);
  }

  return localRides.filter((r) => r.firestoreId && r.status === "active");
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
  const ride = allRides.find((item) => item.id === rideId || item.firestoreId === rideId);
  if (!ride) throw new Error("This ride is no longer available. Refresh the list and choose another ride.");
  if (!passenger?.uid) throw new Error("Sign in before requesting a seat.");
  if (!Number.isInteger(seatsCount) || seatsCount < 1) throw new Error("Choose at least one seat.");
  const rideRef = doc(db, "rides", ride.firestoreId || ride.id);
  const bookingRef = doc(collection(db, "bookings"));
  const booking = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(rideRef);
    if (!snapshot.exists()) throw new Error("This ride is no longer available. Refresh the list and choose another ride.");
    const currentRide = mapRideDoc(snapshot);
    if (currentRide.status !== "active" || currentRide.availableSeats < seatsCount) throw new Error("Those seats were just taken. Refresh the rides and try again.");
    if (currentRide.driverId === passenger.uid) throw new Error("You cannot book your own ride.");
    const remaining = currentRide.availableSeats - seatsCount;
    const subtotal = currentRide.price * seatsCount;
    const platformFee = calculateServiceFee(subtotal);
    const bookingData = {
      id: bookingRef.id, rideId: rideRef.id, driverId: currentRide.driverId,
      driverName: currentRide.driverName, driverPhone: currentRide.driverPhone,
      passengerId: passenger.uid, passengerName: passenger.fullName || "Passenger",
      passengerProfilePicture: passenger.profilePicture || "",
      passengerPhone: passenger.phone || "", from: currentRide.from, to: currentRide.to,
      pickupLocation: pickupPoint || currentRide.pickupLocation,
      pickupLatitude: currentRide.pickupLatitude ?? null, pickupLongitude: currentRide.pickupLongitude ?? null,
      dropoffLocation: currentRide.dropoffLocation, departureDate: currentRide.departureDate,
      departureTime: currentRide.departureTime, seatsBooked: seatsCount,
      pricePerSeat: currentRide.price, subtotal, platformFee, totalPrice: subtotal,
      vehicle: currentRide.vehicle, plate: currentRide.plate,
      paymentMethod: paymentMethod || "Pay driver directly",
      paymentStatus: "Ticket payable to driver at meetup", serviceFeeStatus: "unpaid", status: "Pending", notes: notes || "",
      bookedAt: new Date().toISOString(), createdAt: serverTimestamp(),
    };
    transaction.update(rideRef, { availableSeats: remaining, status: remaining === 0 ? "full" : "active", lastBookingId: bookingRef.id });
    transaction.set(bookingRef, bookingData);
    return { ...bookingData, firestoreId: bookingRef.id };
  });
  const updatedRides = getLocalRides().map((item) => item.id === ride.id ? { ...item, availableSeats: Math.max(0, item.availableSeats - seatsCount), seats: Math.max(0, item.availableSeats - seatsCount) } : item);
  saveLocalRides(updatedRides);
  saveLocalBookings([booking, ...getLocalBookings()]);
  return booking;
}

// Update booking request status (Driver action: Accept or Decline)
export async function updateBookingStatus(bookingId, newStatus) {
  const bookings = getLocalBookings();
  const idx = bookings.findIndex((b) => b.id === bookingId || b.firestoreId === bookingId);
  const bookingIdInFirestore = idx >= 0 ? bookings[idx].firestoreId || bookings[idx].id : bookingId;
  if (!bookingIdInFirestore) throw new Error("This request is not synced yet. Connect to the internet and refresh before responding.");
  const bookingRef = doc(db, "bookings", bookingIdInFirestore);
  const updated = await runTransaction(db, async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists()) throw new Error("Booking not found. Refresh your requests.");
    const booking = bookingSnapshot.data();
    if (booking.status !== "Pending") throw new Error("This request has already been answered.");
    if (newStatus === "Declined") {
      const rideRef = doc(db, "rides", booking.rideId);
      const rideSnapshot = await transaction.get(rideRef);
      if (rideSnapshot.exists()) {
        const ride = rideSnapshot.data();
        const seats = Number(ride.availableSeats || 0) + Number(booking.seatsBooked || 0);
        transaction.update(rideRef, { availableSeats: seats, status: "active" });
      }
    }
    transaction.update(bookingRef, { status: newStatus });
    return { ...booking, firestoreId: bookingIdInFirestore, status: newStatus };
  });
  if (idx >= 0) {
    bookings[idx] = updated;
    saveLocalBookings(bookings);
  }
  return updated;
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
