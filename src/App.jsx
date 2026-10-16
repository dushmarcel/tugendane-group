import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "./firebase";
import {
  createRide,
  getAvailableRides,
  searchRides,
  bookRide,
  getLocalBookings,
  updateBookingStatus,
  getUserBookings,
} from "./services/rideService";
import {
  RWANDA_CITIES,
  POPULAR_ROUTES,
  CITY_PICKUP_POINTS,
  getSuggestedPrice,
  calculatePricingBreakdown,
} from "./services/rwandaRoutes";
import "./App.css";

// ============================================================================
// BILINGUAL DICTIONARY (English & Kinyarwanda)
// ============================================================================
const TEXTS = {
  en: {
    groupName: "TUGENDANE GROUP",
    brandName: "TUGENDANE RIDES",
    slogan: "Let's move forward together",
    sloganRw: "Tugendane, Ntugende wenyine",
    tagline: "Rwanda's Marketplace for Empty Car Seats",
    subtitle: "A division of Tugendane Group. Connect with verified drivers traveling your way. Share fuel costs, travel faster, and ride comfortably.",
    welcomeTitle: "Travel together across Rwanda & East Africa",
    createAccount: "Create an Account",
    login: "Log In",
    exploreGuest: "Explore Rides (Demo / Guest)",
    logout: "Log Out",
    back: "Back",
    home: "Find Rides",
    myTrips: "My Trips",
    safety: "Safety & SOS",
    profile: "Profile",
    driverMode: "Driver Mode",
    passengerMode: "Passenger Mode",
    switchToDriver: "Switch to Driver",
    switchToPassenger: "Switch to Passenger",
    
    // Safety & Regulatory banner
    complianceTitle: "Official Rwandan Ride-Sharing Model",
    complianceText: "Tugendane Rides is a community carpooling platform for fuel cost-sharing in private vehicles. Rides are pre-planned shared trips, not commercial taxi solicitations.",
    
    // Search form
    whereGoing: "Find an Empty Car Seat",
    fromCity: "From (Departure)",
    toCity: "To (Destination)",
    travelDate: "Date",
    seatsNeeded: "Seats needed",
    searchBtn: "Search Available Rides",
    frequentRoutes: "Popular Intercity Corridors",
    
    // Filters
    filterLabel: "Preferences:",
    prefWomenOnly: "👩 Women Only",
    prefNoSmoking: "🚭 No Smoking",
    prefAC: "❄️ AC Available",
    prefQuiet: "🤫 Quiet Ride",
    prefMusic: "🎵 Music Allowed",
    allPreferences: "All Rides",
    
    // Marketplace & Cards
    availableRidesTitle: "Available Rides with Empty Seats",
    noRidesFound: "No rides found matching this route or filter.",
    noRidesTip: "Try choosing 'Any date' or another popular corridor like Kigali ↔ Huye or Kigali ↔ Musanze.",
    bookSeat: "Book Seat",
    whatsAppDriver: "WhatsApp",
    callDriver: "Call",
    verifiedDriver: "ID & License Verified",
    tripsCount: "trips",
    seatsLeft: "seats left",
    pricePerSeat: "per seat",
    fuelShareNote: "Fuel contribution",
    
    // Booking modal
    modalBookTitle: "Reserve Your Empty Seat",
    modalBookSubtitle: "Confirm your trip details and fuel cost contribution.",
    selectSeats: "How many seats do you need?",
    pickupSpotLabel: "Your preferred pickup location:",
    notesLabel: "Message or notes for the driver (optional):",
    costBreakdown: "Transparent Cost Breakdown",
    seatContribution: "Seat fuel contribution:",
    platformFee: "Tugendane platform fee (5%):",
    totalPayable: "Total payable:",
    driverEarnings: "Driver receives for fuel:",
    paymentMethod: "Payment Method:",
    confirmBookingBtn: "Confirm & Book Now",
    bookingSuccess: "🎉 Your seat has been booked successfully on Tugendane Rides! Have a safe journey.",
    
    // SOS & Safety Modal
    sosTitle: "Emergency SOS & Trip Safety",
    sosSubtitle: "Immediate assistance and live trip sharing across Rwanda.",
    emergencyPolice: "Rwanda National Police (Toll-Free 112)",
    emergencyAmbulance: "Emergency Medical / Ambulance (111)",
    emergencyTraffic: "Traffic Police Emergency (113)",
    shareTripBtn: "Share My Ride Details on WhatsApp",
    shareTripText: "Send your driver's name, car plate, route, and departure time to family/friends so they know where you are.",
    
    // Driver Dashboard
    driverDashTitle: "Tugendane Driver Hub",
    driverDashSubtitle: "Share your empty seats, offset fuel costs, and meet great people traveling your route.",
    postNewRide: "+ Post a New Trip",
    upcomingTrips: "Active Posted Trips",
    passengerRequests: "Passenger Bookings & Requests",
    noDriverTrips: "You haven't posted any upcoming trips yet.",
    noRequests: "No passenger bookings yet.",
    accept: "Accept Booking",
    decline: "Decline",
    cancelTrip: "Cancel Trip",
    suggestedPriceLabel: "Suggested fair fuel price:",
    fairPriceExplainer: "Calculated based on standard fuel consumption to maintain legal cost-sharing.",
    driverEarningsNotice: "You receive 95% of the fuel contribution. Tugendane retains only 5% platform fee.",
    carModelLabel: "Car Make / Model",
    carPlateLabel: "Vehicle Plate (e.g. RAF 123 B)",
    
    // Post Ride Form
    postFormTitle: "Post Your Empty Seats",
    departureSpotLabel: "Pickup point in departure city:",
    dropoffSpotLabel: "Dropoff point in destination city:",
    departureTime: "Departure Time",
    seatsAvailable: "Number of empty seats (1 - 6):",
    seatPriceLabel: "Price per seat (RWF):",
    rideDescription: "Trip notes & luggage space:",
    publishRideBtn: "Publish Ride",
    
    // Driver Verification
    driverVerifyTitle: "Driver & Vehicle Verification",
    driverVerifyDesc: "To ensure maximum passenger safety and compliance with Rwandan regulations, please provide your details.",
    nationalId: "National ID Number (16 Digits)",
    drivingLicense: "Driving License Number",
    vehicleColor: "Vehicle Color",
    saveProfileBtn: "Save & Start Posting",

    // Auth & Guest & Privacy
    guestAccountTitle: "Welcome to Tugendane Group",
    guestAccountDesc: "Create an account or sign in to reserve empty car seats, message drivers, and manage tickets.",
    verifiedCitizen: "National ID Verified (Official)",
    idPendingReview: "ID Recorded (Pending Official Verification)",
    unverifiedCitizen: "ID Not Provided",
    privacyPolicy: "Privacy Policy",
    authRequiredToBook: "Please sign in or create an account to book your empty seat.",
    authRequiredToPost: "Please sign in or create an account to post a trip as a driver.",
    driverVehicleRequired: "Please enter your vehicle make/model and plate number before publishing a trip.",
    rolePassengerLabel: "🎒 Passenger (I want to book seats)",
    roleDriverLabel: "🚗 Driver (I offer empty car seats)",
    vehicleDetailsTitle: "Driver Vehicle Information",
  },
  
  rw: {
    groupName: "TUGENDANE GROUP",
    brandName: "TUGENDANE RIDES",
    slogan: "Tugendane, Ntugende wenyine",
    sloganRw: "Tugendane, Ntugende wenyine",
    tagline: "Isoko ry'intebe zisigaye mu modoka zo mu Rwanda",
    subtitle: "Ishami rya Tugendane Group. Hura n'abashoferi b'imodoka bwite bajya aho ugana. Sangira ikiguzi cya lisansi, gerayo vuba, kandi ugende neza.",
    welcomeTitle: "Tugendane hamwe mu Rwanda n'Akarere hose",
    createAccount: "Fungura Konti",
    login: "Injira",
    exploreGuest: "Reba Ingendo (Koresha Ako Kanya)",
    logout: "Sohoka",
    back: "Subira",
    home: "Shaka Urugendo",
    myTrips: "Ingendo Zanjye",
    safety: "Umutekano & SOS",
    profile: "Umwirondoro",
    driverMode: "Uburyo bw'Umushoferi",
    passengerMode: "Uburyo bw'Umugenzi",
    switchToDriver: "Hindukira Umushoferi",
    switchToPassenger: "Hindukira Umugenzi",
    
    // Safety banner
    complianceTitle: "Uburyo bwemewe bwo gusangira urugendo mu Rwanda",
    complianceText: "Tugendane Rides ni urubuga rwizewe rwo gufasha abafite imodoka bwite gusangira ikiguzi cya lisansi n'abagenzi. Ntabwo ari tagisi zitemewe, ahubwo ni ugufashanya mu ngendo.",
    
    // Search form
    whereGoing: "Shaka Intebe Isigaye mu Modoka",
    fromCity: "Aho Uhagurukira",
    toCity: "Aho Ugana",
    travelDate: "Itariki",
    seatsNeeded: "Intebe ukeneye",
    searchBtn: "Shakisha Ingendo Ziboneka",
    frequentRoutes: "Inzira Zikunzwe Cyane",
    
    // Filters
    filterLabel: "Ibyo wifuza:",
    prefWomenOnly: "👩 Abagore Gusa",
    prefNoSmoking: "🚭 Nta Kunywa Itabi",
    prefAC: "❄️ Imodoka Ifite AC",
    prefQuiet: "🤫 Urugendo Rutuje",
    prefMusic: "🎵 Umuziki Wemerwe",
    allPreferences: "Ingendo Zose",
    
    // Marketplace & Cards
    availableRidesTitle: "Ingendo Zifite Intebe Zisigaye",
    noRidesFound: "Nta ngendo zibonetse kuri iyi nzira ubu.",
    noRidesTip: "Gerageza guhitamo indi tariki cyangwa inzira nka Kigali ↔ Huye cyangwa Kigali ↔ Musanze.",
    bookSeat: "Fata Intebe",
    whatsAppDriver: "WhatsApp",
    callDriver: "Hamagara",
    verifiedDriver: "Indangamuntu & Permis Byemejwe",
    tripsCount: "ingendo",
    seatsLeft: "intebe zisigaye",
    pricePerSeat: "ku ntebe",
    fuelShareNote: "Umusanzu wa lisansi",
    
    // Booking modal
    modalBookTitle: "Fata Intebe Yawe",
    modalBookSubtitle: "Emeza ibisobanuro by'urugendo n'umusanzu wa lisansi.",
    selectSeats: "Ukeneye intebe zingahe?",
    pickupSpotLabel: "Aho wifuza guhagurukira:",
    notesLabel: "Ubutumwa ku mushoferi (niba buhari):",
    costBreakdown: "Ibisobanuro by'Ikiguzi",
    seatContribution: "Umusanzu w'intebe:",
    platformFee: "Amafaranga ya serivisi ya Tugendane (5%):",
    totalPayable: "Amafaranga yose hamwe:",
    driverEarnings: "Umushoferi ahabwa (lisansi):",
    paymentMethod: "Uburyo bwo Kwishyura:",
    confirmBookingBtn: "Emeza Urugendo Ako Kanya",
    bookingSuccess: "🎉 Intebe yawe yemejwe neza muri Tugendane Rides! Urugendo rwiza.",
    
    // SOS & Safety Modal
    sosTitle: "Ubutabazi bwihuse (SOS) & Umutekano",
    sosSubtitle: "Ubufasha bwihuse no gusangiza abo mu muryango aho uri.",
    emergencyPolice: "Polisi y'u Rwanda (Ku buntu 112)",
    emergencyAmbulance: "Ambulance / Ubutabazi (111)",
    emergencyTraffic: "Polisi y'Umuhanda (113)",
    shareTripBtn: "Sangiza Ibisobanuro by'Urugendo kuri WhatsApp",
    shareTripText: "Oherereza umuryango amazina y'umushoferi, plate y'imodoka, inzira n'igihe muhagurukira kugira ngo bamenye aho uri.",
    
    // Driver Dashboard
    driverDashTitle: "Urubuga rw'Umushoferi wa Tugendane",
    driverDashSubtitle: "Sangiza intebe zisigaye mu modoka yawe, ugabanye ikiguzi cya lisansi, kandi ufashanye.",
    postNewRide: "+ Sohaza Urugendo Rushya",
    upcomingTrips: "Ingendo Wasohoye",
    passengerRequests: "Abagenzi Basabye Kujyana Nawe",
    noDriverTrips: "Nta ngendo urasohora kugeza ubu.",
    noRequests: "Nta muntu urasaba intebe kugeza ubu.",
    accept: "Emeza Umugenzi",
    decline: "Kanga",
    cancelTrip: "Hagarika Urugendo",
    suggestedPriceLabel: "Igiciro cyemewe cyo gusangira lisansi:",
    fairPriceExplainer: "Gishingiye ku rugero nyarwo rwa lisansi ikoreshwa kugira ngo byubahirize amategeko.",
    driverEarningsNotice: "Uhabwa 95% by'umusanzu wa lisansi. Tugendane igumana 5% bya serivisi gusa.",
    carModelLabel: "Ubwoko bw'Imodoka",
    carPlateLabel: "Nimero ya Plate (urugero: RAF 123 B)",
    
    // Post Ride Form
    postFormTitle: "Sohora Intebe Zisigaye mu Modoka",
    departureSpotLabel: "Aho uzahagurukira mu mujyi w'itangiriro:",
    dropoffSpotLabel: "Aho uzabageza mu mujyi ugana:",
    departureTime: "Igihe cyo guhaguruka",
    seatsAvailable: "Umubare w'intebe zisigaye (1 - 6):",
    seatPriceLabel: "Igiciro ku ntebe (RWF):",
    rideDescription: "Ibisobanuro by'urugendo n'umwanya w'imizigo:",
    publishRideBtn: "Tangaza Urugendo",
    
    // Driver Verification
    driverVerifyTitle: "Kwemeza Umushoferi n'Imodoka",
    driverVerifyDesc: "Kugira ngo umutekano w'abagenzi wubahirizwe, shyiramo imyirondoro yawe.",
    nationalId: "Nimero y'Indangamuntu (Imibare 16)",
    drivingLicense: "Nimero ya Permis yo Gutwara",
    vehicleColor: "Ibara ry'Imodoka",
    saveProfileBtn: "Bika & Tangira Gusohora Ingendo",

    // Auth & Guest & Privacy
    guestAccountTitle: "Murakaza neza muri Tugendane Group",
    guestAccountDesc: "Fungura konti cyangwa winjire kugira ngo ufate intebe zisigaye mu modoka, uvugane n'abashoferi, kandi ucunge amatike yawe.",
    verifiedCitizen: "Indangamuntu Yemejwe ku Mugaragaro",
    idPendingReview: "Indangamuntu Yanditswe (Itegerezwa Kwemezwa)",
    unverifiedCitizen: "Nta Ndangamuntu Yatanzwe",
    privacyPolicy: "Amategeko agenga umutekano w'amakuru (Privacy Policy)",
    authRequiredToBook: "Banza winjire cyangwa ufungure konti kugira ngo ufate intebe.",
    authRequiredToPost: "Banza winjire cyangwa ufungure konti kugira ngo utangaze ingendo nk'umushoferi.",
    driverVehicleRequired: "Banza wandikishe ubwoko bw'imodoka na plate mbere yo gutangaza urugendo.",
    rolePassengerLabel: "🎒 Umugenzi (Nshaka gufata intebe)",
    roleDriverLabel: "🚗 Umushoferi (Mfite imodoka nshaka gutwara abagenzi)",
    vehicleDetailsTitle: "Ibisobanuro by'Imodoka",
  },
};

export default function App() {
  // Localization
  const [lang, setLang] = useState("en");
  const t = TEXTS[lang];

  // Auth & User State
  const [authMode, setAuthMode] = useState("app"); // "welcome", "signup", "login", "app"
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authPendingAction, setAuthPendingAction] = useState(null); // { type: 'book', ride, seatsCount, ... }
  const [authModalReason, setAuthModalReason] = useState("");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // App Navigation & Role
  const [role, setRole] = useState("passenger"); // "passenger" | "driver"
  const [currentTab, setCurrentTab] = useState("home"); // "home" | "trips" | "safety" | "profile"

  // Search State
  const [fromCity, setFromCity] = useState("Huye");
  const [toCity, setToCity] = useState("Kigali");
  const [searchDate, setSearchDate] = useState("");
  const [searchSeats, setSearchSeats] = useState(1);
  const [activePreference, setActivePreference] = useState(null); // null | "womenOnly" | "noSmoking" | "ac" | "quietRide"

  // Rides & Data
  const [rides, setRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [bookings, setBookings] = useState([]);

  // Modals
  const [selectedRideForBooking, setSelectedRideForBooking] = useState(null);
  const [bookingSeatsCount, setBookingSeatsCount] = useState(1);
  const [bookingPickupSpot, setBookingPickupSpot] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("MTN Mobile Money (*182#)");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  const [showSosModal, setShowSosModal] = useState(false);
  const [showDriverSetupModal, setShowDriverSetupModal] = useState(false);

  // Driver Post Form State
  const [driverPostForm, setDriverPostForm] = useState({
    from: "Huye",
    to: "Kigali",
    pickupLocation: "University of Rwanda (UR Huye Campus)",
    dropoffLocation: "Nyabugogo / Kigali Downtown",
    departureDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    departureTime: "08:30",
    availableSeats: 3,
    price: 4500,
    vehicle: "Toyota RAV4 (Silver)",
    plate: "RAF 782 C",
    description: "Leaving early morning. Spacious boot for bags, comfortable AC.",
    preferences: {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: true,
      luggage: "Standard suitcase",
    },
  });

  // Auth Form State (Signup / Login)
  const [authForm, setAuthForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    nationalId: "",
    isDriver: false,
    vehicle: "",
    plate: "",
    drivingLicense: "",
  });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Initial Data Load
  useEffect(() => {
    async function initData() {
      setLoadingRides(true);
      try {
        const loadedRides = await getAvailableRides();
        setRides(loadedRides);
        setBookings(getLocalBookings());
      } catch (err) {
        console.error("Error loading rides:", err);
      } finally {
        setLoadingRides(false);
      }
    }
    initData();

    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            if (data.role) setRole(data.role);
          } else {
            setUserProfile({
              uid: user.uid,
              fullName: user.displayName || user.email?.split("@")[0] || "Tugendane Traveler",
              phone: user.phoneNumber || "+250 788 000 000",
              email: user.email,
              role: "passenger",
              nationalIdVerified: false,
            });
          }
          const userBookings = await getUserBookings(user.uid);
          setBookings(userBookings);
        } catch (e) {
          console.warn("Could not fetch user profile from Firestore:", e);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setBookings(getLocalBookings());
      }
    });

    return () => unsubscribe();
  }, []);

  // Update Suggested Price when Driver Post Form route changes
  useEffect(() => {
    const suggested = getSuggestedPrice(driverPostForm.from, driverPostForm.to);
    setDriverPostForm((prev) => ({
      ...prev,
      price: suggested,
      pickupLocation: CITY_PICKUP_POINTS[prev.from]?.[0] || `${prev.from} Centre`,
      dropoffLocation: CITY_PICKUP_POINTS[prev.to]?.[0] || `${prev.to} Centre`,
    }));
  }, [driverPostForm.from, driverPostForm.to]);

  // Search Action
  const filteredRides = rides.filter((ride) => {
    if (fromCity && ride.from.toLowerCase() !== fromCity.toLowerCase()) return false;
    if (toCity && ride.to.toLowerCase() !== toCity.toLowerCase()) return false;
    if (searchDate && ride.departureDate !== searchDate) return false;
    if (ride.availableSeats < searchSeats) return false;
    if (activePreference && !ride.preferences?.[activePreference]) return false;
    return ride.status === "active";
  });

  // Handle Route Shortcut Click
  function handleSelectRouteShortcut(route) {
    setFromCity(route.from);
    setToCity(route.to);
    setCurrentTab("home");
  }

  // Handle Booking
  async function handleConfirmBooking() {
    if (!selectedRideForBooking) return;

    if (!currentUser) {
      setAuthPendingAction({
        type: "book",
        ride: selectedRideForBooking,
        seatsCount: bookingSeatsCount,
        pickupPoint: bookingPickupSpot || selectedRideForBooking.pickupLocation,
        notes: bookingNotes,
        paymentMethod: bookingPaymentMethod,
      });
      setSelectedRideForBooking(null);
      setAuthModalReason(t.authRequiredToBook);
      setAuthMode("signup");
      return;
    }

    try {
      const passenger = {
        uid: currentUser.uid,
        fullName: userProfile?.fullName || currentUser.displayName || currentUser.email?.split("@")[0] || "Tugendane Passenger",
        phone: userProfile?.phone || "+250 788 000 000",
      };

      await bookRide({
        rideId: selectedRideForBooking.id,
        passenger,
        seatsCount: bookingSeatsCount,
        pickupPoint: bookingPickupSpot || selectedRideForBooking.pickupLocation,
        notes: bookingNotes,
        paymentMethod: bookingPaymentMethod,
      });

      // Refresh rides and bookings
      const updatedRides = await getAvailableRides();
      setRides(updatedRides);
      const userBookings = await getUserBookings(currentUser.uid);
      setBookings(userBookings);

      setBookingSuccessMsg(t.bookingSuccess);
      setTimeout(() => {
        setSelectedRideForBooking(null);
        setBookingSuccessMsg("");
        setCurrentTab("trips");
      }, 1500);
    } catch (err) {
      alert("Booking error: " + err.message);
    }
  }

  // Handle Driver Post Ride
  async function handlePublishRide(e) {
    e.preventDefault();

    if (!currentUser) {
      setAuthModalReason(t.authRequiredToPost);
      setAuthMode("signup");
      return;
    }

    const vehicleName = driverPostForm.vehicle || userProfile?.vehicle;
    const vehiclePlate = driverPostForm.plate || userProfile?.plate;
    if (!vehicleName?.trim() || !vehiclePlate?.trim()) {
      alert(t.driverVehicleRequired);
      setShowDriverSetupModal(true);
      return;
    }

    try {
      const newRide = await createRide({
        driverId: currentUser.uid,
        driverName: userProfile?.fullName || currentUser.displayName || "Verified Driver",
        driverPhone: userProfile?.phone || "+250 788 000 000",
        from: driverPostForm.from,
        to: driverPostForm.to,
        pickupLocation: driverPostForm.pickupLocation,
        dropoffLocation: driverPostForm.dropoffLocation,
        departureDate: driverPostForm.departureDate,
        departureTime: driverPostForm.departureTime,
        availableSeats: Number(driverPostForm.availableSeats),
        totalSeats: Number(driverPostForm.availableSeats),
        price: Number(driverPostForm.price),
        vehicle: driverPostForm.vehicle || userProfile?.vehicle || "Toyota RAV4 (Silver)",
        plate: driverPostForm.plate || userProfile?.plate || "RAF 782 C",
        description: driverPostForm.description,
        preferences: driverPostForm.preferences,
      });

      setRides([newRide, ...rides]);
      alert("✅ Ride published successfully! Empty seats are now discoverable on Tugendane Rides.");
      setCurrentTab("home");
    } catch (err) {
      alert("Failed to publish ride: " + err.message);
    }
  }

  // Driver Request Action (Accept / Decline)
  function handleBookingStatusUpdate(bookingId, status) {
    updateBookingStatus(bookingId, status);
    if (currentUser) {
      getUserBookings(currentUser.uid).then(setBookings);
    } else {
      setBookings(getLocalBookings());
    }
  }

  // Handle User Log Out
  async function handleLogout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setBookings(getLocalBookings());
      setRole("passenger");
      setAuthPendingAction(null);
      alert(lang === "en" ? "Logged out successfully." : "Mwasohotse muri konti neza.");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  // Generate WhatsApp Direct Chat Link
  function getWhatsAppLink(phone, ride) {
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      lang === "en"
        ? `Hello! I saw your Tugendane empty seat trip from ${ride.from} to ${ride.to} on ${ride.departureDate} at ${ride.departureTime}. Are seats still available?`
        : `Muraho! Nabonye urugendo rwawe kuri Tugendane Rides ruva ${ride.from} rugana ${ride.to} kuwa ${ride.departureDate} saa ${ride.departureTime}. Haba hakirimo intebe?`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  }

  // Generate Trip Sharing Link for Safety
  function getShareTripMessage(ride) {
    const text =
      lang === "en"
        ? `I am traveling with Tugendane Rides with driver ${ride.driverName} (${ride.vehicle}, Plate: ${ride.plate || "N/A"}) from ${ride.from} to ${ride.to}. Departure: ${ride.departureDate} at ${ride.departureTime}. For safety, track my trip on Tugendane Group.`
        : `Ndi mu rugendo na Tugendane Rides hamwe n'umushoferi ${ride.driverName} (${ride.vehicle}, Plate: ${ride.plate || "N/A"}) kuva ${ride.from} ujya ${ride.to}. Duhaguruka kuwa ${ride.departureDate} saa ${ride.departureTime}. Reba aho ngeze kuri Tugendane Group.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  // Auth Handling (Signup / Login)
  async function handleAuthSubmit(type) {
    setAuthLoading(true);
    setAuthError("");
    try {
      let loggedUser = null;
      let profile = null;

      if (type === "signup") {
        if (!authForm.fullName.trim() || !authForm.email.trim() || !authForm.password.trim()) {
          throw new Error(lang === "en" ? "Please fill in all required fields (Full Name, Email, Password)." : "Uzuza imyirondoro yose isabwa.");
        }
        const userCred = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        loggedUser = userCred.user;
        profile = {
          uid: loggedUser.uid,
          fullName: authForm.fullName.trim(),
          phone: authForm.phone.trim() || "+250 788 000 000",
          email: authForm.email.trim(),
          nationalId: authForm.nationalId.trim(),
          nationalIdVerified: false,
          nationalIdStatus: authForm.nationalId.trim().length === 16 ? "pending_review" : "unverified",
          role: authForm.isDriver ? "driver" : "passenger",
          isDriver: Boolean(authForm.isDriver),
          vehicle: authForm.vehicle?.trim() || "",
          plate: authForm.plate?.trim() || "",
          drivingLicense: authForm.drivingLicense?.trim() || "",
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, "users", loggedUser.uid), profile);
        setUserProfile(profile);
        if (authForm.isDriver) {
          setRole("driver");
        }
      } else {
        const userCred = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        loggedUser = userCred.user;
        const userDoc = await getDoc(doc(db, "users", loggedUser.uid));
        if (userDoc.exists()) {
          profile = userDoc.data();
          setUserProfile(profile);
          if (profile.role) setRole(profile.role);
        } else {
          profile = {
            uid: loggedUser.uid,
            fullName: loggedUser.displayName || loggedUser.email?.split("@")[0] || "Traveler",
            phone: "+250 788 000 000",
            email: loggedUser.email,
            role: "passenger",
            nationalIdVerified: false,
          };
          setUserProfile(profile);
        }
      }

      setCurrentUser(loggedUser);
      const userBookings = await getUserBookings(loggedUser.uid);
      setBookings(userBookings);

      // Return to main app
      setAuthMode("app");
      setAuthModalReason("");

      // Resume pending action if any
      if (authPendingAction) {
        if (authPendingAction.type === "book") {
          setSelectedRideForBooking(authPendingAction.ride);
          if (authPendingAction.seatsCount) setBookingSeatsCount(authPendingAction.seatsCount);
          if (authPendingAction.pickupPoint) setBookingPickupSpot(authPendingAction.pickupPoint);
        }
        setAuthPendingAction(null);
      }
    } catch (err) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed";
      if (err.code === "auth/email-already-in-use") {
        msg = lang === "en" ? "This email is already registered. Please log in instead." : "Iyi imeli isanzwe ikoreshwa. Gerageza kwinjira.";
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = lang === "en" ? "Invalid email or password. Please try again." : "Imeli cyangwa ijambobanga si byo. Ongera ugerageze.";
      } else if (err.code === "auth/weak-password") {
        msg = lang === "en" ? "Password should be at least 6 characters." : "Ijambobanga rigomba kugira byibuze inyuguti 6.";
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  }

  // ============================================================================
  // RENDER: WELCOME / LOGIN / SIGNUP SCREENS
  // ============================================================================
  if (authMode === "welcome") {
    return (
      <div className="welcome-page">
        <div className="welcome-card">
          <div className="welcome-logo-container">
            <div className="welcome-logo-badge">
              <img src="/tugendane-logo.svg" alt="Tugendane Group Logo" />
            </div>
            <div className="brand-group-pill">{t.groupName}</div>
            <div className="brand-title">{t.brandName}</div>
            <div className="slogan-pill">{t.slogan}</div>
          </div>

          <h1>{t.welcomeTitle}</h1>
          <p className="welcome-text">{t.subtitle}</p>

          <div className="value-points">
            <div className="value-point">
              <span>🚗</span>
              <strong>{lang === "en" ? "Marketplace for empty seats" : "Isoko ry'intebe zisigaye mu modoka"}</strong>
            </div>
            <div className="value-point">
              <span>⛽</span>
              <span>{lang === "en" ? "Share fuel costs, save up to 50%" : "Sangira ikiguzi cya lisansi, uzigame"}</span>
            </div>
            <div className="value-point">
              <span>🛡️</span>
              <span>{lang === "en" ? "National ID & Driving license verified" : "Indangamuntu & Permis zemejwe"}</span>
            </div>
            <div className="value-point">
              <span>⚡</span>
              <span>{lang === "en" ? "No long bus park delays, leave on time" : "Nta gutegereza imodoka ngo yuzure"}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button className="btn btn-primary btn-full" onClick={() => setAuthMode("app")}>
              🚀 {t.exploreGuest}
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => setAuthMode("signup")}>
              {t.createAccount}
            </button>
            <button className="btn btn-full" style={{ background: "transparent", color: "var(--primary)" }} onClick={() => setAuthMode("login")}>
              {t.login}
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              onClick={() => setLang(lang === "en" ? "rw" : "en")}
              style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "999px", padding: "6px 14px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}
            >
              🌐 {lang === "en" ? "Kinyarwanda" : "English"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authMode === "signup" || authMode === "login") {
    return (
      <div className="welcome-page">
        <div className="welcome-card signup-card">
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setAuthModalReason("");
              setAuthMode("app");
            }}
            style={{ marginBottom: "16px" }}
          >
            ← {lang === "en" ? "Back to Browse Rides" : "Subira kureba ingendo"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)" }}>
              <img src="/tugendane-logo.svg" alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--secondary)", letterSpacing: "0.5px" }}>{t.groupName}</div>
              <h2 style={{ fontSize: "19px", fontWeight: "800" }}>{authMode === "signup" ? t.createAccount : t.login}</h2>
              <p style={{ fontSize: "12.5px", color: "var(--dark-muted)" }}>{t.tagline}</p>
            </div>
          </div>

          {authModalReason && (
            <div style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>ℹ️</span> {authModalReason}
            </div>
          )}

          {authError && <div style={{ background: "var(--danger-light)", color: "var(--danger)", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>{authError}</div>}

          {authMode === "signup" && (
            <>
              {/* Role Selector: Passenger or Driver */}
              <div className="form-group">
                <label style={{ fontWeight: "700" }}>{lang === "en" ? "I am joining as:" : "Ninjiyemo nka:"}</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${!authForm.isDriver ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setAuthForm({ ...authForm, isDriver: false })}
                    style={{ padding: "8px" }}
                  >
                    🎒 {lang === "en" ? "Passenger" : "Umugenzi"}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${authForm.isDriver ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setAuthForm({ ...authForm, isDriver: true })}
                    style={{ padding: "8px" }}
                  >
                    🚗 {lang === "en" ? "Driver" : "Umushoferi"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jean Damascene Hakizimana"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone Number (MTN / Airtel)</label>
                <input
                  type="tel"
                  placeholder="0788123456"
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t.nationalId}</label>
                <input
                  type="text"
                  placeholder="1 1998 8 0012345 0 12"
                  value={authForm.nationalId}
                  onChange={(e) => setAuthForm({ ...authForm, nationalId: e.target.value })}
                />
              </div>

              {authForm.isDriver && (
                <div style={{ background: "var(--light-bg)", padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "16px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--secondary)", marginBottom: "8px" }}>
                    🚗 {t.vehicleDetailsTitle}
                  </div>
                  <div className="form-group" style={{ marginBottom: "10px" }}>
                    <label style={{ fontSize: "12px" }}>{t.carModelLabel}</label>
                    <input
                      type="text"
                      placeholder="e.g. Toyota RAV4 (Silver)"
                      value={authForm.vehicle}
                      onChange={(e) => setAuthForm({ ...authForm, vehicle: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: "0" }}>
                    <label style={{ fontSize: "12px" }}>{t.carPlateLabel}</label>
                    <input
                      type="text"
                      placeholder="e.g. RAF 782 C"
                      value={authForm.plate}
                      onChange={(e) => setAuthForm({ ...authForm, plate: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
            />
          </div>

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: "10px" }}
            onClick={() => handleAuthSubmit(authMode)}
            disabled={authLoading}
          >
            {authLoading ? "Processing..." : authMode === "signup" ? t.createAccount : t.login}
          </button>

          <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13.5px" }}>
            {authMode === "signup" ? (
              <span>Already registered? <strong style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => setAuthMode("login")}>Log in</strong></span>
            ) : (
              <span>Don't have an account? <strong style={{ color: "var(--primary)", cursor: "pointer" }} onClick={() => setAuthMode("signup")}>Create account</strong></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN APP INTERFACE (Passenger & Driver Modes)
  // ============================================================================
  return (
    <div className="app-layout">
      {/* HEADER */}
      <header className="app-header">
        <div className="header-container">
          <div className="header-brand" onClick={() => setCurrentTab("home")}>
            <div className="header-logo">
              <img src="/tugendane-logo.svg" alt="Tugendane Group Logo" />
            </div>
            <div className="header-title-box">
              <div className="header-group-tag">TUGENDANE GROUP</div>
              <div className="header-title">TUGENDANE RIDES</div>
              <div className="header-subtitle">{t.slogan}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="header-nav">
            <button className={`nav-link ${currentTab === "home" ? "active" : ""}`} onClick={() => setCurrentTab("home")}>
              🔍 {t.home}
            </button>
            <button className={`nav-link ${currentTab === "trips" ? "active" : ""}`} onClick={() => setCurrentTab("trips")}>
              🧳 {t.myTrips} {bookings.length > 0 && <span className="role-badge">{bookings.length}</span>}
            </button>
            <button className={`nav-link ${currentTab === "safety" ? "active" : ""}`} onClick={() => setShowSosModal(true)}>
              🛡️ {t.safety}
            </button>
            <button className={`nav-link ${currentTab === "profile" ? "active" : ""}`} onClick={() => setCurrentTab("profile")}>
              👤 {t.profile}
            </button>
          </nav>

          {/* Header Controls (Role Switcher, Auth, Language & SOS) */}
          <div className="header-actions">
            <button
              className="role-switcher-btn"
              onClick={() => {
                const nextRole = role === "passenger" ? "driver" : "passenger";
                setRole(nextRole);
                if (nextRole === "driver" && !userProfile?.isDriver) {
                  setShowDriverSetupModal(true);
                }
              }}
            >
              <span>{role === "passenger" ? "🚗" : "🎒"}</span>
              <span>{role === "passenger" ? t.switchToDriver : t.switchToPassenger}</span>
            </button>

            {/* Auth State Button / User Badge */}
            {currentUser ? (
              <div className="header-auth-group">
                <div
                  className="header-user-chip"
                  onClick={() => setCurrentTab("profile")}
                  title={userProfile?.fullName || currentUser.email}
                >
                  <div className="user-avatar-mini">
                    {userProfile?.fullName?.charAt(0) || currentUser.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="user-name-mini">
                    {userProfile?.fullName?.split(" ")[0] || currentUser.email?.split("@")[0]}
                  </span>
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: "#f1f5f9", color: "var(--dark-muted)", padding: "6px 10px", fontSize: "12px", border: "1px solid var(--border)" }}
                  onClick={handleLogout}
                  title={t.logout}
                >
                  🚪 {t.logout}
                </button>
              </div>
            ) : (
              <div className="header-auth-group">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    setAuthModalReason("");
                    setAuthMode("login");
                  }}
                  style={{ padding: "6px 12px", fontSize: "12.5px" }}
                >
                  🔑 {t.login}
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    setAuthModalReason("");
                    setAuthMode("signup");
                  }}
                  style={{ padding: "6px 12px", fontSize: "12.5px" }}
                >
                  ✨ {t.createAccount}
                </button>
              </div>
            )}

            <button
              onClick={() => setLang(lang === "en" ? "rw" : "en")}
              style={{
                background: "var(--light-bg)",
                border: "1px solid var(--border)",
                borderRadius: "999px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
              title="Toggle Language"
            >
              🌐 {lang.toUpperCase()}
            </button>

            <button
              className="btn btn-sm btn-sos"
              onClick={() => setShowSosModal(true)}
              title="Emergency SOS"
            >
              🚨 SOS
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="app-main">
        {/* COMPLIANCE & LEGAL NOTICE BANNER */}
        <div className="compliance-banner">
          <span className="icon">⚖️</span>
          <div>
            <strong>{t.complianceTitle}: </strong>
            <span>{t.complianceText}</span>
          </div>
        </div>

        {/* HERO BANNER */}
        <section className="dashboard-hero">
          <div className="hero-text">
            <div style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9, marginBottom: "4px" }}>
              Tugendane Group Mobility
            </div>
            <h1>
              {role === "passenger"
                ? `${lang === "en" ? "Muraho" : "Murakaza neza"}, ${userProfile?.fullName?.split(" ")[0] || "Traveler"} 👋`
                : `${t.driverDashTitle} 🚗`}
            </h1>
            <p>
              {role === "passenger"
                ? `${t.subtitle}`
                : `${t.driverDashSubtitle}`}
            </p>
          </div>
          <div className="hero-badges">
            <div className="hero-pill">✅ ID & License Verified</div>
            <div className="hero-pill">⚡ Direct Booking</div>
            <div className="hero-pill">💳 MTN MoMo / eKash</div>
          </div>
        </section>

        {/* ================================================================== */}
        {/* VIEW: PASSENGER SEARCH & MARKETPLACE */}
        {/* ================================================================== */}
        {role === "passenger" && currentTab === "home" && (
          <>
            {/* SEARCH CARD */}
            <section className="search-card">
              <div className="search-header">
                <div className="search-title">
                  <span>🚗</span>
                  <span>{t.whereGoing}</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
                  {rides.filter((r) => r.status === "active").length} {lang === "en" ? "available rides across Rwanda" : "ingendo ziboneka mu Rwanda"}
                </div>
              </div>

              <div className="search-grid">
                <div className="form-group">
                  <label>{t.fromCity}</label>
                  <select value={fromCity} onChange={(e) => setFromCity(e.target.value)}>
                    {RWANDA_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.toCity}</label>
                  <select value={toCity} onChange={(e) => setToCity(e.target.value)}>
                    {RWANDA_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.travelDate}</label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t.seatsNeeded}</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={searchSeats}
                    onChange={(e) => setSearchSeats(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Ride Preferences Filter Pills */}
              <div className="preference-filters">
                <span className="filter-label">{t.filterLabel}</span>
                <button
                  className={`pref-chip ${activePreference === null ? "active" : ""}`}
                  onClick={() => setActivePreference(null)}
                >
                  {t.allPreferences}
                </button>
                <button
                  className={`pref-chip ${activePreference === "womenOnly" ? "active" : ""}`}
                  onClick={() => setActivePreference(activePreference === "womenOnly" ? null : "womenOnly")}
                >
                  {t.prefWomenOnly}
                </button>
                <button
                  className={`pref-chip ${activePreference === "noSmoking" ? "active" : ""}`}
                  onClick={() => setActivePreference(activePreference === "noSmoking" ? null : "noSmoking")}
                >
                  {t.prefNoSmoking}
                </button>
                <button
                  className={`pref-chip ${activePreference === "ac" ? "active" : ""}`}
                  onClick={() => setActivePreference(activePreference === "ac" ? null : "ac")}
                >
                  {t.prefAC}
                </button>
                <button
                  className={`pref-chip ${activePreference === "quietRide" ? "active" : ""}`}
                  onClick={() => setActivePreference(activePreference === "quietRide" ? null : "quietRide")}
                >
                  {t.prefQuiet}
                </button>
              </div>
            </section>

            {/* FREQUENT INTERCITY SHORTCUTS */}
            <div style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "700", color: "var(--dark-muted)" }}>
              {t.frequentRoutes}:
            </div>
            <div className="quick-routes-row">
              {POPULAR_ROUTES.map((route, i) => (
                <button
                  key={i}
                  className="quick-route-btn"
                  onClick={() => handleSelectRouteShortcut(route)}
                >
                  <span>{route.from}</span>
                  <span className="quick-route-arrow">➔</span>
                  <span>{route.to}</span>
                  <span style={{ fontSize: "11px", color: "var(--dark-muted)", background: "var(--light-bg)", padding: "2px 6px", borderRadius: "4px" }}>
                    {route.avgDuration}
                  </span>
                </button>
              ))}
            </div>

            {/* RIDES LIST */}
            <div className="rides-section-title">
              <h2>{t.availableRidesTitle}</h2>
              <span className="rides-count-badge">
                {filteredRides.length} {lang === "en" ? "Found" : "Zibonetse"}
              </span>
            </div>

            {filteredRides.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon">🚗</div>
                <div className="empty-title">{t.noRidesFound}</div>
                <p className="empty-subtitle">{t.noRidesTip}</p>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setFromCity("");
                    setToCity("");
                    setSearchDate("");
                    setActivePreference(null);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="rides-list-grid">
                {filteredRides.map((ride) => (
                  <div key={ride.id} className="ride-card">
                    <div>
                      {/* Driver top info */}
                      <div className="ride-card-top">
                        <div className="driver-mini-profile">
                          <div className="driver-avatar">
                            {ride.driverName.charAt(0)}
                          </div>
                          <div className="driver-meta">
                            <span className="driver-name">
                              {ride.driverName}
                              <span className="verified-icon" title={t.verifiedDriver}>
                                ✓
                              </span>
                            </span>
                            <span className="driver-rating-sub">
                              <span className="star-text">★ {ride.driverRating}</span>
                              <span>• {ride.driverTrips || 12} {t.tripsCount}</span>
                            </span>
                          </div>
                        </div>

                        <div className="price-tag-box">
                          <div className="price-amount">
                            {ride.price.toLocaleString()} RWF
                          </div>
                          <div className="price-sub">{t.fuelShareNote}</div>
                        </div>
                      </div>

                      {/* Timeline (Pickup -> Dropoff) */}
                      <div className="route-timeline">
                        <div className="timeline-point">
                          <div className="point-dot" />
                          <div className="point-info">
                            <div>
                              <div className="point-city">{ride.from}</div>
                              <div className="point-spot">{ride.pickupLocation}</div>
                            </div>
                            <div style={{ fontWeight: "700", color: "var(--primary)" }}>
                              {ride.departureTime}
                            </div>
                          </div>
                        </div>

                        <div className="timeline-divider" />

                        <div className="timeline-point">
                          <div className="point-dot dest" />
                          <div className="point-info">
                            <div>
                              <div className="point-city">{ride.to}</div>
                              <div className="point-spot">{ride.dropoffLocation}</div>
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--dark-muted)" }}>
                              {ride.departureDate}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Car Details */}
                      <div className="ride-car-info">
                        <span>🚘</span>
                        <span>{ride.vehicle}</span>
                        <span>•</span>
                        <span style={{ fontWeight: "600", color: "var(--dark)" }}>{ride.plate}</span>
                      </div>

                      {/* Preferences & Features Badges */}
                      <div className="ride-badges-row">
                        <span className="badge-pill badge-seats">
                          🪑 {ride.availableSeats} {t.seatsLeft}
                        </span>
                        {ride.preferences?.womenOnly && (
                          <span className="badge-pill badge-women">👩 Women Only</span>
                        )}
                        {ride.preferences?.noSmoking && (
                          <span className="badge-pill">🚭 No Smoking</span>
                        )}
                        {ride.preferences?.ac && (
                          <span className="badge-pill">❄️ AC</span>
                        )}
                        {ride.preferences?.quietRide && (
                          <span className="badge-pill">🤫 Quiet</span>
                        )}
                        {ride.preferences?.musicAllowed && (
                          <span className="badge-pill">🎵 Music</span>
                        )}
                      </div>

                      {ride.description && (
                        <p style={{ fontSize: "13px", color: "var(--dark-muted)", fontStyle: "italic", marginBottom: "16px" }}>
                          "{ride.description}"
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="ride-card-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setSelectedRideForBooking(ride);
                          setBookingSeatsCount(1);
                        }}
                      >
                        {t.bookSeat}
                      </button>

                      <a
                        href={getWhatsAppLink(ride.driverPhone, ride)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-whatsapp btn-sm"
                        title="Chat with driver on WhatsApp"
                      >
                        💬 {t.whatsAppDriver}
                      </a>

                      <a
                        href={`tel:${ride.driverPhone || "+250788123456"}`}
                        className="btn btn-secondary btn-sm"
                        title="Call driver directly"
                      >
                        📞 {t.callDriver}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ================================================================== */}
        {/* VIEW: MY TRIPS */}
        {/* ================================================================== */}
        {currentTab === "trips" && (
          <div>
            <div className="rides-section-title">
              <h2>🧳 {t.myTrips}</h2>
            </div>

            {bookings.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon">🎒</div>
                <div className="empty-title">
                  {lang === "en" ? "No booked trips yet" : "Nta ngendo uratunganya"}
                </div>
                <p className="empty-subtitle">
                  {lang === "en" ? "Search for an empty seat and travel comfortably across Rwanda with Tugendane Rides." : "Shakisha intebe isigaye maze ugende neza mu gihugu hose na Tugendane Rides."}
                </p>
                <button className="btn btn-primary" onClick={() => setCurrentTab("home")}>
                  {t.home}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {bookings.map((booking) => (
                  <div key={booking.id} className="ride-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--primary)" }}>
                          {booking.from} ➔ {booking.to}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
                          📅 {booking.departureDate} at {booking.departureTime}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "700",
                          background: booking.status === "Confirmed" ? "var(--success-light)" : "var(--warning-light)",
                          color: booking.status === "Confirmed" ? "var(--success)" : "var(--warning)",
                        }}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div style={{ background: "var(--light-bg)", padding: "14px", borderRadius: "var(--radius-md)", marginBottom: "14px", border: "1px solid var(--border)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13.5px" }}>
                        <div>
                          <strong>Driver: </strong> {booking.driverName} ({booking.vehicle})
                        </div>
                        <div>
                          <strong>Car Plate: </strong> {booking.plate}
                        </div>
                        <div>
                          <strong>Pickup: </strong> {booking.pickupLocation}
                        </div>
                        <div>
                          <strong>Seats Booked: </strong> {booking.seatsBooked}
                        </div>
                        <div>
                          <strong>Total Contribution: </strong> {booking.totalPrice?.toLocaleString()} RWF
                        </div>
                        <div>
                          <strong>Payment: </strong> {booking.paymentMethod}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <a
                        href={getShareTripMessage({
                          driverName: booking.driverName,
                          vehicle: booking.vehicle,
                          plate: booking.plate,
                          from: booking.from,
                          to: booking.to,
                          departureDate: booking.departureDate,
                          departureTime: booking.departureTime,
                        })}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        📤 {t.shareTripBtn}
                      </a>

                      <a
                        href={`https://wa.me/${(booking.driverPhone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-whatsapp"
                      >
                        💬 WhatsApp Driver
                      </a>

                      <a
                        href={`tel:${booking.driverPhone || "+250788123456"}`}
                        className="btn btn-sm btn-call"
                      >
                        📞 Call Driver
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW: DRIVER MODE DASHBOARD & POSTING */}
        {/* ================================================================== */}
        {role === "driver" && (
          <div>
            {/* Stat Cards */}
            <div className="driver-stat-grid">
              <div className="driver-stat-card">
                <div className="stat-num">{rides.filter((r) => r.driverName === userProfile?.fullName).length}</div>
                <div className="stat-desc">{t.upcomingTrips}</div>
              </div>

              <div className="driver-stat-card">
                <div className="stat-num">{bookings.length}</div>
                <div className="stat-desc">{t.passengerRequests}</div>
              </div>

              <div className="driver-stat-card">
                <div className="stat-num">
                  {(bookings.reduce((sum, b) => sum + (b.subtotal || 0), 0) * 0.95).toLocaleString()} RWF
                </div>
                <div className="stat-desc">{t.driverEarnings} (Net Fuel Recovery)</div>
              </div>
            </div>

            {/* POST A RIDE FORM */}
            <div className="search-card" style={{ marginBottom: "32px" }}>
              <div className="search-header">
                <div className="search-title">
                  <span>🚗</span>
                  <span>{t.postFormTitle}</span>
                </div>
                <span className="role-badge">Tugendane Driver</span>
              </div>

              <form onSubmit={handlePublishRide}>
                <div className="form-row">
                  <div className="form-group">
                    <label>{t.fromCity}</label>
                    <select
                      value={driverPostForm.from}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, from: e.target.value })}
                    >
                      {RWANDA_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t.toCity}</label>
                    <select
                      value={driverPostForm.to}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, to: e.target.value })}
                    >
                      {RWANDA_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t.departureSpotLabel}</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Rwanda Huye Main Gate"
                      value={driverPostForm.pickupLocation}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, pickupLocation: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t.dropoffSpotLabel}</label>
                    <input
                      type="text"
                      placeholder="e.g. Nyabugogo or Kigali Downtown"
                      value={driverPostForm.dropoffLocation}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, dropoffLocation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t.travelDate}</label>
                    <input
                      type="date"
                      value={driverPostForm.departureDate}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, departureDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t.departureTime}</label>
                    <input
                      type="time"
                      value={driverPostForm.departureTime}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, departureTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t.seatsAvailable}</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={driverPostForm.availableSeats}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, availableSeats: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t.seatPriceLabel}</label>
                    <input
                      type="number"
                      step="500"
                      value={driverPostForm.price}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, price: Number(e.target.value) })}
                    />
                    <div className="suggested-price-notice">
                      <span>💡</span>
                      <span>
                        {t.suggestedPriceLabel} <strong>{getSuggestedPrice(driverPostForm.from, driverPostForm.to).toLocaleString()} RWF</strong>. {t.fairPriceExplainer}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t.carModelLabel}</label>
                    <input
                      type="text"
                      placeholder="e.g. Toyota RAV4 (Silver)"
                      value={driverPostForm.vehicle}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, vehicle: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t.carPlateLabel}</label>
                    <input
                      type="text"
                      placeholder="e.g. RAF 782 C"
                      value={driverPostForm.plate}
                      onChange={(e) => setDriverPostForm({ ...driverPostForm, plate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Driver Preferences */}
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "13.5px", fontWeight: "700", display: "block", marginBottom: "8px" }}>
                    {lang === "en" ? "Ride Preferences:" : "Ibyo wemerera mu modoka:"}
                  </label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13.5px" }}>
                      <input
                        type="checkbox"
                        checked={driverPostForm.preferences.noSmoking}
                        onChange={(e) =>
                          setDriverPostForm({
                            ...driverPostForm,
                            preferences: { ...driverPostForm.preferences, noSmoking: e.target.checked },
                          })
                        }
                      />
                      🚭 No Smoking
                    </label>

                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13.5px" }}>
                      <input
                        type="checkbox"
                        checked={driverPostForm.preferences.womenOnly}
                        onChange={(e) =>
                          setDriverPostForm({
                            ...driverPostForm,
                            preferences: { ...driverPostForm.preferences, womenOnly: e.target.checked },
                          })
                        }
                      />
                      👩 Women Only
                    </label>

                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13.5px" }}>
                      <input
                        type="checkbox"
                        checked={driverPostForm.preferences.ac}
                        onChange={(e) =>
                          setDriverPostForm({
                            ...driverPostForm,
                            preferences: { ...driverPostForm.preferences, ac: e.target.checked },
                          })
                        }
                      />
                      ❄️ AC Available
                    </label>

                    <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13.5px" }}>
                      <input
                        type="checkbox"
                        checked={driverPostForm.preferences.quietRide}
                        onChange={(e) =>
                          setDriverPostForm({
                            ...driverPostForm,
                            preferences: { ...driverPostForm.preferences, quietRide: e.target.checked },
                          })
                        }
                      />
                      🤫 Quiet Trip
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t.rideDescription}</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Plenty of space for bags, safe driving, leaving on time."
                    value={driverPostForm.description}
                    onChange={(e) => setDriverPostForm({ ...driverPostForm, description: e.target.value })}
                  />
                </div>

                <div style={{ background: "var(--light-bg)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "16px", fontSize: "13px", color: "var(--dark-muted)" }}>
                  💰 <strong>Earnings Transparency:</strong> If you take 3 passengers at {driverPostForm.price.toLocaleString()} RWF = {(driverPostForm.price * 3).toLocaleString()} RWF total. You receive {Math.round(driverPostForm.price * 3 * 0.95).toLocaleString()} RWF for fuel. Tugendane platform fee is only 5% ({Math.round(driverPostForm.price * 3 * 0.05).toLocaleString()} RWF).
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  🚀 {t.publishRideBtn}
                </button>
              </form>
            </div>

            {/* PASSENGER REQUESTS LIST */}
            <div className="rides-section-title">
              <h2>📥 {t.passengerRequests}</h2>
            </div>

            {bookings.length === 0 ? (
              <div className="empty-box">
                <div className="empty-icon">📭</div>
                <div className="empty-title">{t.noRequests}</div>
                <p className="empty-subtitle">
                  {lang === "en" ? "When passengers book your empty seats, their requests will appear here." : "Igihe abagenzi bafashe intebe zawe, ubutumwa buzaboneka hano."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {bookings.map((booking) => (
                  <div key={booking.id} className="ride-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <strong style={{ fontSize: "16px" }}>{booking.passengerName}</strong>
                        <div style={{ fontSize: "13px", color: "var(--dark-muted)" }}>
                          Route: {booking.from} ➔ {booking.to} • {booking.seatsBooked} seat(s)
                        </div>
                        <div style={{ fontSize: "12.5px", color: "var(--secondary)", fontWeight: "600" }}>
                          Pickup: {booking.pickupLocation}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "17px", fontWeight: "800", color: "var(--primary)" }}>
                          {booking.totalPrice?.toLocaleString()} RWF
                        </div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: booking.status === "Confirmed" ? "var(--success-light)" : "var(--warning-light)",
                            color: booking.status === "Confirmed" ? "var(--success)" : "var(--warning)",
                          }}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      {booking.status !== "Confirmed" && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleBookingStatusUpdate(booking.id, "Confirmed")}
                        >
                          ✓ {t.accept}
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${(booking.passengerPhone || "").replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-whatsapp"
                      >
                        💬 WhatsApp Passenger
                      </a>
                      <a
                        href={`tel:${booking.passengerPhone || "+250788000000"}`}
                        className="btn btn-sm btn-secondary"
                      >
                        📞 Call Passenger
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW: PROFILE */}
        {/* ================================================================== */}
        {currentTab === "profile" && (
          <div className="search-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
            {!currentUser ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 16px" }}>
                  👤
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "6px" }}>{t.guestAccountTitle}</h2>
                <p style={{ fontSize: "14px", color: "var(--dark-muted)", marginBottom: "24px" }}>
                  {t.guestAccountDesc}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={() => {
                      setAuthModalReason("");
                      setAuthMode("signup");
                    }}
                  >
                    ✨ {t.createAccount}
                  </button>
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => {
                      setAuthModalReason("");
                      setAuthMode("login");
                    }}
                  >
                    🔑 {t.login}
                  </button>
                </div>

                <div style={{ background: "var(--light-bg)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "left", fontSize: "13px", color: "var(--dark-muted)", border: "1px solid var(--border)", marginBottom: "18px" }}>
                  <strong style={{ color: "var(--dark)" }}>🌟 {lang === "en" ? "Tugendane Member Benefits:" : "Ibyiza byo kugira konti:"}</strong>
                  <ul style={{ paddingLeft: "18px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <li>{lang === "en" ? "Reserve empty car seats with direct driver WhatsApp & call" : "Gufata intebe mu modoka no kuvugana n'umushoferi ako kanya"}</li>
                    <li>{lang === "en" ? "Verified Rwandan National ID security badge" : "Kugaragaza indangamuntu yemejwe mu mutekano"}</li>
                    <li>{lang === "en" ? "Instant trip confirmation & booking receipt records" : "Kubona inyemezabwishyu n'amatike y'ingendo zose"}</li>
                    <li>{lang === "en" ? "Register private car and publish trips to share fuel" : "Kwandikisha imodoka yawe no gusangira lisansi"}</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary)", textDecoration: "underline", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
                >
                  📜 {t.privacyPolicy}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <div className="driver-avatar" style={{ width: "64px", height: "64px", fontSize: "24px" }}>
                    {userProfile?.fullName?.charAt(0) || currentUser.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
                      {userProfile?.fullName || currentUser.displayName || currentUser.email?.split("@")[0]}
                    </h2>
                    <div style={{ fontSize: "13px", color: userProfile?.nationalIdVerified ? "var(--secondary)" : "var(--dark-muted)", fontWeight: "600" }}>
                      {userProfile?.nationalIdVerified ? (
                        `✅ ${t.verifiedCitizen}`
                      ) : userProfile?.nationalId ? (
                        `📝 ${t.idPendingReview}`
                      ) : (
                        `ℹ️ ${t.unverifiedCitizen}`
                      )}
                      {userProfile?.nationalId ? ` • ID: ${userProfile.nationalId.slice(0, 5)}...` : ""}
                    </div>
                  </div>
                </div>

                <div style={{ background: "var(--light-bg)", padding: "16px", borderRadius: "var(--radius-md)", marginBottom: "20px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                    <div><strong>Email: </strong> {currentUser.email}</div>
                    <div><strong>Phone: </strong> {userProfile?.phone || "+250 788 000 000"}</div>
                    <div><strong>Account Type: </strong> {role === "driver" ? "Tugendane Verified Driver 🚗" : "Tugendane Traveler 🎒"}</div>
                    {userProfile?.vehicle && <div><strong>Vehicle: </strong> {userProfile.vehicle} ({userProfile.plate || "N/A"})</div>}
                    <div><strong>Language: </strong> {lang === "en" ? "English" : "Kinyarwanda"}</div>
                    <div><strong>Emergency Contact: </strong> Toll-Free 112 (Rwanda Police)</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    className="btn btn-secondary btn-full"
                    onClick={() => {
                      const nextRole = role === "passenger" ? "driver" : "passenger";
                      setRole(nextRole);
                      if (nextRole === "driver" && !userProfile?.isDriver) {
                        setShowDriverSetupModal(true);
                      }
                    }}
                  >
                    {role === "passenger" ? `🚗 ${t.switchToDriver}` : `🎒 ${t.switchToPassenger}`}
                  </button>

                  <button
                    className="btn btn-full"
                    style={{ background: "#ffffff", border: "1px solid var(--border)", color: "var(--dark-muted)", fontSize: "13.5px" }}
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    📜 {t.privacyPolicy}
                  </button>

                  <button
                    className="btn btn-full"
                    style={{ background: "var(--danger-light)", color: "var(--danger)", border: "1px solid rgba(239, 68, 68, 0.2)" }}
                    onClick={handleLogout}
                  >
                    🚪 {t.logout}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL: SEAT BOOKING */}
      {/* ==================================================================== */}
      {selectedRideForBooking && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <button className="modal-close-btn" onClick={() => setSelectedRideForBooking(null)}>
              ✕
            </button>

            <div className="modal-title">{t.modalBookTitle}</div>
            <div className="modal-subtitle">
              {selectedRideForBooking.from} ➔ {selectedRideForBooking.to} ({selectedRideForBooking.departureDate} at {selectedRideForBooking.departureTime})
            </div>

            {bookingSuccessMsg ? (
              <div style={{ background: "var(--success-light)", color: "var(--success)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "center", fontWeight: "700" }}>
                {bookingSuccessMsg}
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label>{t.selectSeats}</label>
                  <select
                    value={bookingSeatsCount}
                    onChange={(e) => setBookingSeatsCount(Number(e.target.value))}
                  >
                    {Array.from({ length: selectedRideForBooking.availableSeats }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "seat" : "seats"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.pickupSpotLabel}</label>
                  <input
                    type="text"
                    value={bookingPickupSpot || selectedRideForBooking.pickupLocation}
                    onChange={(e) => setBookingPickupSpot(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t.paymentMethod}</label>
                  <select
                    value={bookingPaymentMethod}
                    onChange={(e) => setBookingPaymentMethod(e.target.value)}
                  >
                    <option value="MTN Mobile Money (*182#)">MTN Mobile Money (*182# MoMoPay)</option>
                    <option value="Airtel Money (*500#)">Airtel Money (*500#)</option>
                    <option value="Cash at Pickup">Cash at Pickup (Fuel contribution)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t.notesLabel}</label>
                  <input
                    type="text"
                    placeholder="e.g. I have one small backpack"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>

                {/* Price Breakdown */}
                {(() => {
                  const pricing = calculatePricingBreakdown(selectedRideForBooking.price, bookingSeatsCount);
                  return (
                    <div className="price-breakdown-card">
                      <div className="breakdown-row">
                        <span>{t.seatContribution} ({bookingSeatsCount} × {pricing.pricePerSeat.toLocaleString()} RWF)</span>
                        <span>{pricing.subtotal.toLocaleString()} RWF</span>
                      </div>
                      <div className="breakdown-row">
                        <span>{t.platformFee}</span>
                        <span>{pricing.platformFee.toLocaleString()} RWF</span>
                      </div>
                      <div className="breakdown-row total-row">
                        <span>{t.totalPayable}</span>
                        <span style={{ color: "var(--primary)" }}>{pricing.passengerTotal.toLocaleString()} RWF</span>
                      </div>
                      <div className="breakdown-row driver-net-row">
                        <span>{t.driverEarnings}</span>
                        <span>{pricing.subtotal.toLocaleString()} RWF</span>
                      </div>
                    </div>
                  );
                })()}

                <button className="btn btn-primary btn-full" onClick={handleConfirmBooking}>
                  {t.confirmBookingBtn}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EMERGENCY SOS & TRIP SHARING */}
      {/* ==================================================================== */}
      {showSosModal && (
        <div className="modal-backdrop">
          <div className="modal-window sos-card">
            <button className="modal-close-btn" onClick={() => setShowSosModal(false)}>
              ✕
            </button>

            <div className="sos-icon">🚨</div>
            <div className="modal-title">{t.sosTitle}</div>
            <p className="modal-subtitle">{t.sosSubtitle}</p>

            <div className="sos-call-buttons">
              <a href="tel:112" className="sos-call-btn sos-police">
                <span>👮 {t.emergencyPolice}</span>
                <span>Call 112 ➔</span>
              </a>

              <a href="tel:111" className="sos-call-btn sos-ambulance">
                <span>🚑 {t.emergencyAmbulance}</span>
                <span>Call 111 ➔</span>
              </a>

              <a href="tel:113" className="sos-call-btn" style={{ background: "#0284c7" }}>
                <span>🚦 {t.emergencyTraffic}</span>
                <span>Call 113 ➔</span>
              </a>
            </div>

            <div style={{ background: "var(--light-bg)", padding: "16px", borderRadius: "var(--radius-md)", textAlign: "left", fontSize: "13px", color: "var(--dark-muted)", marginBottom: "16px" }}>
              <strong>Trip Safety Guide:</strong>
              <p style={{ marginTop: "4px" }}>
                Always verify the driver's license plate matches the vehicle in the Tugendane app before entering. Share your live trip details with family.
              </p>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                "Hello, I am traveling with Tugendane Rides carpooling across Rwanda. My emergency SOS is active."
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp btn-full"
            >
              📤 {t.shareTripBtn}
            </a>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ==================================================================== */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${currentTab === "home" ? "active" : ""}`}
          onClick={() => setCurrentTab("home")}
        >
          <span className="mobile-nav-icon">🔍</span>
          <span>{t.home}</span>
        </button>
        <button
          className={`mobile-nav-item ${currentTab === "trips" ? "active" : ""}`}
          onClick={() => setCurrentTab("trips")}
        >
          <span className="mobile-nav-icon">🧳</span>
          <span>{t.myTrips}</span>
          {bookings.length > 0 && <span className="mobile-nav-badge">{bookings.length}</span>}
        </button>
        <button
          className="mobile-nav-item"
          onClick={() => setShowSosModal(true)}
        >
          <span className="mobile-nav-icon">🚨</span>
          <span>{t.safety}</span>
        </button>
        <button
          className={`mobile-nav-item ${currentTab === "profile" ? "active" : ""}`}
          onClick={() => setCurrentTab("profile")}
        >
          <span className="mobile-nav-icon">👤</span>
          <span>{currentUser ? (userProfile?.fullName?.split(" ")[0] || "Profile") : t.login}</span>
        </button>
      </nav>

      {/* ==================================================================== */}
      {/* MODAL: PRIVACY POLICY & PLAY STORE COMPLIANCE */}
      {/* ==================================================================== */}
      {showPrivacyModal && (
        <div className="modal-backdrop">
          <div className="modal-window" style={{ maxWidth: "600px", maxHeight: "85vh", overflowY: "auto", textAlign: "left" }}>
            <button className="modal-close-btn" onClick={() => setShowPrivacyModal(false)}>
              ✕
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span style={{ fontSize: "28px" }}>📜</span>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800" }}>Tugendane Privacy Policy</h2>
                <div style={{ fontSize: "12px", color: "var(--dark-muted)" }}>Tugendane Group • Compliance with Rwandan Law N° 058/2021</div>
              </div>
            </div>

            <div style={{ fontSize: "13.5px", lineHeight: "1.6", color: "var(--dark)", display: "flex", flexDirection: "column", gap: "12px" }}>
              <p><strong>1. Purpose & Carpooling Model:</strong> Tugendane Rides is a community marketplace developed by Tugendane Group for fuel cost-sharing in private vehicles between Rwandan cities (e.g. Kigali, Huye, Musanze, Rubavu). We do not operate commercial taxis; we facilitate pre-planned cost-sharing.</p>
              <p><strong>2. Information We Collect:</strong> When you create an account, we collect your name, phone number, email, and Rwandan National Identification number (NIN). For drivers, we collect vehicle details and driver license numbers to ensure passenger safety.</p>
              <p><strong>3. Use of Personal Information:</strong> Your phone number and pickup spot are shared exclusively with your confirmed driver or booked passenger for trip coordination. We never sell your personal data to commercial third parties.</p>
              <p><strong>4. Payments & Mobile Money:</strong> Fuel cost contributions are transacted through authorized telecom operators (MTN Mobile Money, Airtel Money, or cash on pickup). We do not store private payment PINs or banking credentials.</p>
              <p><strong>5. Emergency SOS:</strong> The emergency SOS function triggers direct phone calls to the Rwanda National Police (112) or emergency services (111). Location data is sent only upon explicit user action.</p>
              <p><strong>6. Account Deletion:</strong> You retain the right to access, modify, or permanently delete your account and personal records at any time by contacting privacy@tugendane.rw or through your profile.</p>
            </div>

            <button className="btn btn-primary btn-full" style={{ marginTop: "20px" }} onClick={() => setShowPrivacyModal(false)}>
              {lang === "en" ? "I Understand & Agree" : "Nabyumvise kandi ndabyemeye"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}