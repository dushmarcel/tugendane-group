import { useEffect, useRef, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Geolocation } from "@capacitor/geolocation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "./firebase";
import {
  createRide,
  getAvailableRides,
  bookRide,
  getLocalBookings,
  updateBookingStatus,
  getUserBookings,
} from "./services/rideService";
import {
  CITY_PICKUP_POINTS,
  getSuggestedPrice,
} from "./services/rwandaRoutes";
import {
  registerPushNotifications,
  setupNotificationListeners,
  sendNotificationToUser,
} from "./services/notificationService";
import { ADMIN_EMAIL, TEXTS } from "./locales/texts";

import Header from "./components/Header";
import ComplianceBanner from "./components/ComplianceBanner";
import BrandIntro from "./components/BrandIntro";
import AppIntro from "./components/onboarding/AppIntro";
import LanguageSelect from "./components/onboarding/LanguageSelect";
import PassengerHome from "./pages/PassengerHome";
import DriverDashboard from "./pages/DriverDashboard";
import TripsView from "./pages/TripsView";
import ProfileView from "./pages/ProfileView";
import AdminDashboard from "./pages/AdminDashboard";
import AuthScreen from "./pages/AuthScreen";

import BookingModal from "./modals/BookingModal";
import DriverSetupModal from "./modals/DriverSetupModal";
import TripChatModal from "./modals/TripChatModal";
import SosModal from "./modals/SosModal";
import PrivacyModal from "./modals/PrivacyModal";

import "./App.css";

const DEFAULT_DEPARTURE_DATE = new Date(Date.now() + 86400000).toISOString().split("T")[0];

export default function App() {
  // Localization
  const [lang, setLang] = useState("en");
  const t = TEXTS[lang];

  // Auth & User State
  const [authMode, setAuthMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [introStage, setIntroStage] = useState("navy");
  const [introFinished, setIntroFinished] = useState(false);
  const [langSelected, setLangSelected] = useState(false);
  const [showStoryWalkthrough, setShowStoryWalkthrough] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [authPendingAction, setAuthPendingAction] = useState(null);
  const [authModalReason, setAuthModalReason] = useState("");
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [adminSelectedUser, setAdminSelectedUser] = useState(null);
  const [adminUserHistory, setAdminUserHistory] = useState(null);
  const [adminHistoryLoading, setAdminHistoryLoading] = useState(false);
  const knownBookingStates = useRef(new Map());
  const driverBookingsInitialized = useRef(false);
  const knownActiveRideIds = useRef(null);

  // App Navigation & Role
  const [role, setRole] = useState("passenger");
  const [currentTab, setCurrentTab] = useState("home");

  // Search State
  const [fromCity, setFromCity] = useState("Huye");
  const [toCity, setToCity] = useState("Kigali");
  const [searchDate, setSearchDate] = useState("");
  const [searchSeats, setSearchSeats] = useState(1);
  const [activePreference, setActivePreference] = useState(null);

  // Rides & Data
  const [rides, setRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [bookings, setBookings] = useState([]);

  // Modals
  const [selectedRideForBooking, setSelectedRideForBooking] = useState(null);
  const [bookingSeatsCount, setBookingSeatsCount] = useState(1);
  const [bookingPickupSpot, setBookingPickupSpot] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("Cash at Pickup");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  const [showSosModal, setShowSosModal] = useState(false);
  const [showDriverSetupModal, setShowDriverSetupModal] = useState(false);
  const [driverUpgradeForm, setDriverUpgradeForm] = useState({ vehicle: "", plate: "", drivingLicense: "" });
  const [driverRulesAccepted, setDriverRulesAccepted] = useState(false);
  const [activeChatBooking, setActiveChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const chatBooking = bookings.find((b) => b.firestoreId === activeChatBooking?.firestoreId) || activeChatBooking;

  // Driver Post Form State
  const [driverPostForm, setDriverPostForm] = useState({
    from: "Huye",
    to: "Kigali",
    pickupLocation: "",
    pickupLatitude: null,
    pickupLongitude: null,
    dropoffLocation: "",
    departureDate: DEFAULT_DEPARTURE_DATE,
    departureTime: "08:30",
    availableSeats: 3,
    price: 4500,
    vehicle: "",
    plate: "",
    description: "",
    preferences: {
      noSmoking: true,
      musicAllowed: true,
      quietRide: false,
      womenOnly: false,
      ac: true,
      luggage: "Standard suitcase",
    },
  });

  // Auth Form State
  const [authForm, setAuthForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    nationalId: "",
    isDriver: false,
    loginAs: "passenger",
    vehicle: "",
    plate: "",
    drivingLicense: "",
  });

  useEffect(() => {
    if (!showMenu) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [showMenu]);

  useEffect(() => {
    if (!currentUser) return undefined;
    const notificationsQuery = query(
      collection(db, "users", currentUser.uid, "notifications"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(notificationsQuery, (snapshot) => {
      snapshot.docChanges().filter((change) => change.type === "added").forEach((change) => {
        const notification = change.doc.data();
        if (notification.read !== false) return;
        setNotificationMessage(`${notification.title || "Tugendane Alert"}: ${notification.body || ""}`);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title || "Tugendane Alert", { body: notification.body || "" });
        }
        updateDoc(doc(db, "users", currentUser.uid, "notifications", change.doc.id), { read: true })
          .catch((error) => console.warn("Could not mark notification as read:", error));
      });
    }, (error) => console.warn("Could not listen for notifications:", error));
  }, [currentUser]);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Load private marketplace data
  useEffect(() => {
    let cancelled = false;
    if (!currentUser) return () => { cancelled = true; };

    async function initData() {
      setLoadingRides(true);
      try {
        const loadedRides = await getAvailableRides();
        if (!cancelled) setRides(loadedRides);
      } catch (err) {
        console.error("Error loading rides:", err);
      } finally {
        if (!cancelled) setLoadingRides(false);
      }
    }
    initData();
    return () => { cancelled = true; };
  }, [currentUser]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthMode("app");
        setAuthInitialized(true);
        registerPushNotifications(user.uid);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile(data);
            setRole(user.email?.toLowerCase() === ADMIN_EMAIL ? "admin" : data.role === "driver" && data.isDriver !== false ? "driver" : "passenger");
            setCurrentTab("home");
          } else {
            setUserProfile({
              uid: user.uid,
              fullName: user.displayName || user.email?.split("@")[0] || "Tugendane Traveler",
              phone: user.phoneNumber || "",
              email: user.email,
              role: user.email?.toLowerCase() === ADMIN_EMAIL ? "admin" : "passenger",
              active: true,
              nationalIdVerified: false,
            });
            setRole(user.email?.toLowerCase() === ADMIN_EMAIL ? "admin" : "passenger");
            setCurrentTab("home");
          }
          const userBookings = await getUserBookings(user.uid);
          setBookings(userBookings);
        } catch (e) {
          console.warn("Could not fetch user profile from Firestore:", e);
        }
      } else {
        setCurrentUser(null);
        setRides([]);
        setLoadingRides(false);
        setUserProfile(null);
        setBookings(getLocalBookings());
        setAuthMode("login");
        setAuthInitialized(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Setup foreground push notification listener
  useEffect(() => {
    if (!currentUser) return undefined;
    const cleanup = setupNotificationListeners((notification) => {
      const title = notification.title || "Tugendane Alert";
      const body = notification.body || "";
      setNotificationMessage(`${title}: ${body}`);
    });
    return cleanup;
  }, [currentUser]);

  // Android system back button
  useEffect(() => {
    const goBack = () => {
      if (chatBooking) { setActiveChatBooking(null); setChatMessages([]); }
      else if (selectedRideForBooking) setSelectedRideForBooking(null);
      else if (showDriverSetupModal) setShowDriverSetupModal(false);
      else if (showPrivacyModal) setShowPrivacyModal(false);
      else if (showSosModal) setShowSosModal(false);
      else if (showMenu) setShowMenu(false);
      else if (currentTab !== "home") setCurrentTab("home");
    };
    let listener;
    let cancelled = false;
    CapacitorApp.addListener("backButton", goBack).then((handle) => {
      if (cancelled) handle.remove();
      else listener = handle;
    });
    const handlePopState = () => goBack();
    window.addEventListener("popstate", handlePopState);
    return () => {
      cancelled = true;
      listener?.remove();
      window.removeEventListener("popstate", handlePopState);
    };
  }, [chatBooking, selectedRideForBooking, showDriverSetupModal, showPrivacyModal, showSosModal, showMenu, currentTab]);

  // Chat message listener
  useEffect(() => {
    if (!chatBooking?.firestoreId || chatBooking.status !== "Confirmed") return undefined;
    const messagesQuery = query(
      collection(db, "bookings", chatBooking.firestoreId, "messages"),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(messagesQuery, (snapshot) => {
      setChatMessages(snapshot.docs.map((message) => ({ id: message.id, ...message.data() })));
    }, (error) => console.warn("Could not load trip chat:", error));
  }, [chatBooking]);

  // Bookings real-time listener
  useEffect(() => {
    if (!currentUser) return undefined;
    knownBookingStates.current.clear();
    driverBookingsInitialized.current = false;
    const bookingRef = collection(db, "bookings");
    const byPassenger = onSnapshot(query(bookingRef, where("passengerId", "==", currentUser.uid)), (snapshot) => {
      snapshot.docs.forEach((bookingDoc) => {
        const booking = bookingDoc.data();
        const previousStatus = knownBookingStates.current.get(bookingDoc.id);
        if (previousStatus && previousStatus !== booking.status && booking.status === "Confirmed") {
          setNotificationMessage(`Your ride from ${booking.from} to ${booking.to} was approved. Chat is now available.`);
        }
        knownBookingStates.current.set(bookingDoc.id, booking.status);
      });
      setBookings((current) => {
        const otherSide = current.filter((booking) => booking.driverId === currentUser.uid);
        return [...snapshot.docs.map((bookingDoc) => ({ firestoreId: bookingDoc.id, ...bookingDoc.data() })), ...otherSide];
      });
    }, (error) => console.warn("Passenger booking updates unavailable:", error));

    const byDriver = onSnapshot(query(bookingRef, where("driverId", "==", currentUser.uid)), (snapshot) => {
      snapshot.docs.forEach((bookingDoc) => {
        const booking = bookingDoc.data();
        if (driverBookingsInitialized.current && !knownBookingStates.current.has(bookingDoc.id) && booking.status === "Pending") {
          setNotificationMessage(`New booking request: ${booking.from} to ${booking.to}.`);
        }
        knownBookingStates.current.set(bookingDoc.id, booking.status);
      });
      driverBookingsInitialized.current = true;
      setBookings((current) => {
        const otherSide = current.filter((booking) => booking.passengerId === currentUser.uid);
        return [...otherSide, ...snapshot.docs.map((bookingDoc) => ({ firestoreId: bookingDoc.id, ...bookingDoc.data() }))];
      });
    }, (error) => console.warn("Driver booking updates unavailable:", error));

    return () => { byPassenger(); byDriver(); };
  }, [currentUser]);

  // Available rides listener
  useEffect(() => {
    if (!currentUser || role !== "passenger") return undefined;
    knownActiveRideIds.current = null;
    const ridesQuery = query(collection(db, "rides"), where("status", "==", "active"));
    return onSnapshot(ridesQuery, (snapshot) => {
      const ids = new Set(snapshot.docs.map((rideDoc) => rideDoc.id));
      if (knownActiveRideIds.current) {
        const freshRide = snapshot.docs.find((rideDoc) => {
          const ride = rideDoc.data();
          return !knownActiveRideIds.current.has(rideDoc.id)
            && ride.from?.toLowerCase() === fromCity.toLowerCase()
            && ride.to?.toLowerCase() === toCity.toLowerCase();
        });
        if (freshRide) {
          const ride = freshRide.data();
          setNotificationMessage(`A new ride is available: ${ride.from} to ${ride.to}.`);
        }
      }
      knownActiveRideIds.current = ids;
    }, (error) => console.warn("Ride availability notifications unavailable:", error));
  }, [currentUser, role, fromCity, toCity]);

  // Dismiss notification after 6.5s
  useEffect(() => {
    if (!notificationMessage) return undefined;
    const timer = setTimeout(() => setNotificationMessage(""), 6500);
    return () => clearTimeout(timer);
  }, [notificationMessage]);

  // Admin user directory
  useEffect(() => {
    if (currentUser?.email?.toLowerCase() !== ADMIN_EMAIL) return undefined;
    const usersQuery = query(collection(db, "users"));
    return onSnapshot(usersQuery, (snapshot) => {
      setAdminUsers(snapshot.docs.map((userDoc) => ({ uid: userDoc.id, ...userDoc.data(), active: userDoc.data().active ?? true })));
      setAdminUsersLoading(false);
      setAdminError("");
    }, (error) => {
      setAdminError(`Firestore denied the administrator member list: ${error.message}`);
      setAdminUsersLoading(false);
    });
  }, [currentUser]);

  // Intro splash progression for standalone BrandIntro
  useEffect(() => {
    const backgroundTimer = setTimeout(() => setIntroStage("background"), 750);
    const logoTimer = setTimeout(() => setIntroStage("logo"), 1900);
    return () => {
      clearTimeout(backgroundTimer);
      clearTimeout(logoTimer);
    };
  }, []);

  function updatePostRoute(field, value) {
    const next = { ...driverPostForm, [field]: value };
    setDriverPostForm({
      ...next,
      price: getSuggestedPrice(next.from, next.to),
      ...(field === "from" ? { pickupLocation: CITY_PICKUP_POINTS[value]?.[0] || `${value} Centre` } : {}),
      ...(field === "to" ? { dropoffLocation: CITY_PICKUP_POINTS[value]?.[0] || `${value} Centre` } : {}),
    });
  }

  function openTripChat(booking) {
    setChatMessages([]);
    setActiveChatBooking(booking);
  }

  const filteredRides = rides.filter((ride) => {
    if (fromCity && ride.from.toLowerCase() !== fromCity.toLowerCase()) return false;
    if (toCity && ride.to.toLowerCase() !== toCity.toLowerCase()) return false;
    if (searchDate && ride.departureDate !== searchDate) return false;
    if (ride.availableSeats < searchSeats) return false;
    if (activePreference && !ride.preferences?.[activePreference]) return false;
    return ride.status === "active";
  });

  function handleSelectRouteShortcut(route) {
    setFromCity(route.from);
    setToCity(route.to);
    setCurrentTab("home");
  }

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
        phone: userProfile?.phone || "",
      };

      await bookRide({
        rideId: selectedRideForBooking.id,
        passenger,
        seatsCount: bookingSeatsCount,
        pickupPoint: bookingPickupSpot || selectedRideForBooking.pickupLocation,
        notes: bookingNotes,
        paymentMethod: bookingPaymentMethod,
      });

      if (selectedRideForBooking.driverId) {
        sendNotificationToUser({
          recipientUserId: selectedRideForBooking.driverId,
          title: "New Seat Booking Request 🚘",
          body: `${passenger.fullName} booked ${bookingSeatsCount} seat(s) for ${selectedRideForBooking.from} to ${selectedRideForBooking.to}`,
          data: { rideId: selectedRideForBooking.id },
        });
      }

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
    const departure = new Date(`${driverPostForm.departureDate}T${driverPostForm.departureTime}`);
    if (driverPostForm.from === driverPostForm.to || !driverPostForm.departureDate || Number.isNaN(departure.getTime()) || departure <= new Date()) {
      alert(lang === "en" ? "Choose two different cities and a future departure time." : "Hitamo imijyi ibiri itandukanye n'igihe kiri imbere.");
      return;
    }
    if (!driverPostForm.pickupLocation.trim() || !driverPostForm.dropoffLocation.trim()) {
      alert(lang === "en" ? "Add the exact pickup and drop-off locations so passengers know where to meet you." : "Andika neza aho uzafatira n'aho uzageza abagenzi.");
      return;
    }
    if (!Number.isInteger(Number(driverPostForm.availableSeats)) || Number(driverPostForm.availableSeats) < 1 || Number(driverPostForm.availableSeats) > 6 || !Number.isFinite(Number(driverPostForm.price)) || Number(driverPostForm.price) <= 0) {
      alert(lang === "en" ? "Enter between 1 and 6 seats and a contribution greater than zero." : "Shyiramo intebe kuva kuri 1 kugeza kuri 6 n'umusanzu urenze zeru.");
      return;
    }

    try {
      const newRide = await createRide({
        driverId: currentUser.uid,
        driverName: userProfile?.fullName || currentUser.displayName || "Verified Driver",
        driverPhone: userProfile?.phone || "",
        from: driverPostForm.from,
        to: driverPostForm.to,
        pickupLocation: driverPostForm.pickupLocation,
        pickupLatitude: driverPostForm.pickupLatitude,
        pickupLongitude: driverPostForm.pickupLongitude,
        dropoffLocation: driverPostForm.dropoffLocation,
        departureDate: driverPostForm.departureDate,
        departureTime: driverPostForm.departureTime,
        availableSeats: Number(driverPostForm.availableSeats),
        totalSeats: Number(driverPostForm.availableSeats),
        price: Number(driverPostForm.price),
        vehicle: vehicleName,
        plate: vehiclePlate,
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

  async function pinCurrentPickup() {
    try {
      const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      const pickupLatitude = Number(coords.latitude.toFixed(6));
      const pickupLongitude = Number(coords.longitude.toFixed(6));
      setDriverPostForm((form) => ({
        ...form,
        pickupLatitude,
        pickupLongitude,
        pickupLocation: `Pinned pickup (${pickupLatitude}, ${pickupLongitude})`,
      }));
    } catch (error) {
      alert(`Could not get your location: ${error.message}. You can still enter a pickup address.`);
    }
  }

  async function handleBookingStatusUpdate(bookingId, status) {
    try {
      await updateBookingStatus(bookingId, status);
      const targetBooking = bookings.find((b) => b.id === bookingId || b.firestoreId === bookingId);
      if (targetBooking && targetBooking.passengerId) {
        const isApproved = status === "Confirmed";
        sendNotificationToUser({
          recipientUserId: targetBooking.passengerId,
          title: isApproved ? "Booking Approved! 🎉" : "Booking Request Update ℹ️",
          body: isApproved
            ? `Your booking request from ${targetBooking.from} to ${targetBooking.to} was confirmed by the driver!`
            : `Your booking request from ${targetBooking.from} to ${targetBooking.to} was declined by the driver.`,
          data: { bookingId, status },
        });
      }
      if (currentUser) setBookings(await getUserBookings(currentUser.uid));
      else setBookings(getLocalBookings());
    } catch (error) {
      alert(`Could not update booking: ${error.message}`);
    }
  }

  async function handleDriverUpgrade() {
    const vehicle = driverUpgradeForm.vehicle.trim();
    const plate = driverUpgradeForm.plate.trim();
    const drivingLicense = driverUpgradeForm.drivingLicense.trim();
    if (!vehicle || !plate || !drivingLicense || !currentUser || !driverRulesAccepted) {
      alert("Add your vehicle, plate, driving licence, and accept the driver rules to continue.");
      return;
    }
    const updatedProfile = { ...userProfile, role: "driver", isDriver: true, vehicle, plate, drivingLicense };
    try {
      await setDoc(doc(db, "users", currentUser.uid), updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
      setRole("driver");
      setDriverPostForm((form) => ({ ...form, vehicle, plate }));
      setShowDriverSetupModal(false);
      setCurrentTab("home");
      setDriverRulesAccepted(false);
      setNotificationMessage(lang === "en" ? "Thank you for becoming part of Tugendane Rides. Your driver account is ready." : "Urakoze kuba umwe mu bashoferi ba Tugendane Rides. Konti yawe y’umushoferi irakora.");
    } catch (error) {
      alert(`Driver registration could not be saved: ${error.message}`);
    }
  }

  async function handleAccountModeChange() {
    const nextRole = role === "driver" ? "passenger" : "driver";
    setAuthForm((form) => ({ ...form, loginAs: nextRole }));
    setShowMenu(false);
    await handleLogout();
  }

  async function sendChatMessage(event, replyTo = null) {
    event.preventDefault();
    const text = chatDraft.trim();
    if (!text || !chatBooking?.firestoreId || !currentUser) return;
    if (chatBooking.status !== "Confirmed") {
      alert("Chat opens after the driver approves this booking.");
      return;
    }
    try {
      const fullName = userProfile?.fullName || currentUser.email || "Tugendane member";
      const senderName = fullName.trim().split(/\s+/)[0] || "User";
      await addDoc(collection(db, "bookings", chatBooking.firestoreId, "messages"), {
        senderId: currentUser.uid,
        senderName,
        text,
        ...(replyTo ? { replyTo: { id: replyTo.id, senderId: replyTo.senderId, senderName: replyTo.senderName, text: replyTo.text } } : {}),
        createdAt: serverTimestamp(),
      });
      setChatDraft("");

      const recipientId = chatBooking.driverId === currentUser.uid ? chatBooking.passengerId : chatBooking.driverId;
      if (recipientId) {
        sendNotificationToUser({
          recipientUserId: recipientId,
          title: `New message from ${senderName} 💬`,
          body: text,
          data: { bookingId: chatBooking.firestoreId },
        });
      }
    } catch (error) {
      alert(`Message could not be sent: ${error.message}`);
    }
  }

  async function editChatMessage(messageId, text) {
    if (!chatBooking?.firestoreId || !currentUser) return;
    try {
      await updateDoc(doc(db, "bookings", chatBooking.firestoreId, "messages", messageId), {
        text,
        edited: true,
        editedAt: serverTimestamp(),
      });
    } catch (error) {
      alert(`Message could not be edited: ${error.message}`);
    }
  }

  async function deleteChatMessage(messageId) {
    if (!chatBooking?.firestoreId || !currentUser) return;
    try {
      await deleteDoc(doc(db, "bookings", chatBooking.firestoreId, "messages", messageId));
    } catch (error) {
      alert(`Message could not be deleted: ${error.message}`);
    }
  }

  async function toggleAdminUserActive(targetUser) {
    const nextActive = !targetUser.active;
    try {
      await updateDoc(doc(db, "users", targetUser.uid), { active: nextActive });
      setAdminUsers((current) => current.map((user) => user.uid === targetUser.uid ? { ...user, active: nextActive } : user));
      if (adminSelectedUser?.uid === targetUser.uid) {
        setAdminSelectedUser((current) => ({ ...current, active: nextActive }));
        setAdminUserHistory((current) => current ? { ...current, user: { ...current.user, active: nextActive } } : current);
      }
    } catch (error) {
      alert(`Could not update account status: ${error.message}`);
    }
  }

  async function openAdminUserHistory(targetUser) {
    setAdminSelectedUser(targetUser);
    setAdminHistoryLoading(true);
    setAdminUserHistory(null);
    try {
      const [ridesSnapshot, driverBookingsSnapshot, passengerBookingsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "rides"), where("driverId", "==", targetUser.uid))),
        getDocs(query(collection(db, "bookings"), where("driverId", "==", targetUser.uid))),
        getDocs(query(collection(db, "bookings"), where("passengerId", "==", targetUser.uid))),
      ]);
      const bookingMap = new Map();
      [...driverBookingsSnapshot.docs, ...passengerBookingsSnapshot.docs].forEach((bookingDoc) => bookingMap.set(bookingDoc.id, { id: bookingDoc.id, ...bookingDoc.data() }));
      const historyBookings = [...bookingMap.values()].sort((left, right) => String(right.bookedAt || "").localeCompare(String(left.bookedAt || "")));
      const completedAsDriver = historyBookings.filter((booking) => booking.driverId === targetUser.uid && booking.status === "Confirmed");
      const estimatedEarnings = completedAsDriver.reduce((sum, booking) => sum + Number(booking.subtotal || 0), 0);
      setAdminUserHistory({
        user: targetUser,
        rides: ridesSnapshot.docs.map((rideDoc) => ({ id: rideDoc.id, ...rideDoc.data() })),
        bookings: historyBookings,
        estimatedEarnings,
        rating: targetUser.averageRating ?? targetUser.rating ?? null,
      });
    } catch (error) {
      setAdminError(`Could not load user history: ${error.message}`);
    } finally {
      setAdminHistoryLoading(false);
    }
  }

  async function syncOfflineBookingForChat() {
    if (!chatBooking || chatBooking.firestoreId || !currentUser) return;
    if (chatBooking.passengerId !== currentUser.uid) {
      alert("The passenger must sync this booking from their account before the driver can chat.");
      return;
    }
    try {
      const existing = await getDoc(doc(db, "bookings", chatBooking.id));
      let firestoreId = chatBooking.id;
      if (!existing.exists()) {
        const bookingData = { ...chatBooking };
        delete bookingData.firestoreId;
        await setDoc(doc(db, "bookings", firestoreId), {
          ...bookingData,
          status: "Pending",
          createdAt: serverTimestamp(),
        });
      }
      const syncedBooking = { ...chatBooking, firestoreId, status: existing.exists() ? existing.data().status : "Pending" };
      setActiveChatBooking(syncedBooking);
      setBookings((current) => [syncedBooking, ...current.filter((booking) => booking.id !== syncedBooking.id)]);
      setNotificationMessage("Booking synced. The driver needs to approve it before chat is available.");
    } catch (error) {
      alert(`This booking could not sync: ${error.message}. Check your connection and Firebase rules, then try again.`);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setBookings(getLocalBookings());
      setRole("passenger");
      setAuthPendingAction(null);
      setAuthMode("login");
      setShowMenu(false);
      alert(lang === "en" ? "Logged out successfully." : "Mwasohotse muri konti neza.");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  function getWhatsAppLink(phone, ride) {
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      lang === "en"
        ? `Hello! I saw your Tugendane empty seat trip from ${ride.from} to ${ride.to} on ${ride.departureDate} at ${ride.departureTime}. Are seats still available?`
        : `Muraho! Nabonye urugendo rwawe kuri Tugendane Rides ruva ${ride.from} rugana ${ride.to} kuwa ${ride.departureDate} saa ${ride.departureTime}. Haba hakirimo intebe?`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  }

  function getShareTripMessage(ride) {
    const text =
      lang === "en"
        ? `I have a planned shared ride with Tugendane Rides: ${ride.from} to ${ride.to}, departing ${ride.departureDate} at ${ride.departureTime}. Driver: ${ride.driverName}; vehicle: ${ride.vehicle}; plate: ${ride.plate || "not listed"}. This message does not share my live location.`
        : `Mfite urugendo rwa Tugendane Rides: ${ride.from} ujya ${ride.to}, duhaguruka ${ride.departureDate} saa ${ride.departureTime}. Umushoferi: ${ride.driverName}; imodoka: ${ride.vehicle}; pulake: ${ride.plate || "ntiyashyizweho"}. Ubu butumwa ntibwerekana aho ndi ako kanya.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }

  async function handleAuthSubmit(type) {
    setAuthLoading(true);
    setAuthError("");
    try {
      let loggedUser = null;
      let profile = null;

      if (type === "signup") {
        if (authForm.email.trim().toLowerCase() === ADMIN_EMAIL) {
          throw new Error("This is a reserved administrator account. Sign in with the administrator account created in Firebase Console.");
        }
        if (!authForm.fullName.trim() || !authForm.email.trim() || !authForm.password.trim()) {
          throw new Error(lang === "en" ? "Please fill in all required fields (Full Name, Email, Password)." : "Uzuza imyirondoro yose isabwa.");
        }
        if (authForm.isDriver && (!authForm.vehicle.trim() || !authForm.plate.trim() || !authForm.drivingLicense.trim())) {
          throw new Error("Driver accounts need a vehicle, number plate, and driving licence.");
        }
        const userCred = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        loggedUser = userCred.user;
        profile = {
          uid: loggedUser.uid,
          fullName: authForm.fullName.trim(),
          phone: authForm.phone.trim(),
          email: authForm.email.trim(),
          nationalId: authForm.nationalId.trim(),
          nationalIdVerified: false,
          nationalIdStatus: authForm.nationalId.trim().length === 16 ? "pending_review" : "unverified",
          role: authForm.isDriver ? "driver" : "passenger",
          active: true,
          isDriver: Boolean(authForm.isDriver),
          vehicle: authForm.vehicle?.trim() || "",
          plate: authForm.plate?.trim() || "",
          drivingLicense: authForm.drivingLicense?.trim() || "",
          createdAt: serverTimestamp(),
        };
        try {
          await setDoc(doc(db, "users", loggedUser.uid), profile);
        } catch (profileError) {
          console.warn("Account created, but profile details could not be saved:", profileError);
        }
        setUserProfile(profile);
        setRole(authForm.isDriver ? "driver" : "passenger");
        setAuthForm((form) => ({ ...form, loginAs: authForm.isDriver ? "driver" : "passenger" }));
        setCurrentTab("home");
      } else {
        const userCred = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        loggedUser = userCred.user;
        try {
          const userDoc = await getDoc(doc(db, "users", loggedUser.uid));
          if (userDoc.exists()) {
            profile = userDoc.data();
            setUserProfile(profile);
            const accountRole = loggedUser.email?.toLowerCase() === ADMIN_EMAIL ? "admin" : profile.role === "driver" && profile.isDriver !== false ? "driver" : "passenger";
            setRole(accountRole);
            setCurrentTab("home");
          }
        } catch (profileError) {
          console.warn("Could not load account profile after sign in:", profileError);
        }
        if (!profile) {
          profile = {
            uid: loggedUser.uid,
            fullName: loggedUser.displayName || loggedUser.email?.split("@")[0] || "Traveler",
            phone: "",
            email: loggedUser.email,
            role: "passenger",
            active: true,
            nationalIdVerified: false,
          };
          setUserProfile(profile);
        }
        const requestedRole = authForm.loginAs === "driver" ? "driver" : "passenger";
        if (loggedUser.email?.toLowerCase() !== ADMIN_EMAIL && requestedRole === "driver"
          && !(profile.isDriver === true && profile.vehicle?.trim() && profile.plate?.trim() && profile.drivingLicense?.trim())) {
          await signOut(auth);
          throw new Error("This account is not registered as a driver yet. Create a driver account first, then choose Driver when you log in.");
        }
        if (loggedUser.email?.toLowerCase() !== ADMIN_EMAIL) {
          profile = { ...profile, role: requestedRole };
          await setDoc(doc(db, "users", loggedUser.uid), { role: requestedRole }, { merge: true });
          setUserProfile(profile);
        }
        const accountRole = loggedUser.email?.toLowerCase() === ADMIN_EMAIL ? "admin" : requestedRole;
        setRole(accountRole);
        setCurrentTab("home");
      }

      setCurrentUser(loggedUser);
      try {
        const userBookings = await getUserBookings(loggedUser.uid);
        setBookings(userBookings);
      } catch (bookingError) {
        console.warn("Could not load bookings after sign in:", bookingError);
        setBookings([]);
      }

      setAuthMode("app");
      setAuthModalReason("");

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
      if (err.code === "auth/configuration-not-found") {
        msg = lang === "en"
          ? "Email and password sign-in is not enabled for this app yet. The Firebase project owner must enable Email/Password in Firebase Console under Authentication → Sign-in method. This is a one-time setup."
          : "Kwinjira ukoresheje imeli n'ijambobanga ntibirafungurwa. Nyir'umushinga agomba gufungura Email/Password muri Firebase Console > Authentication > Sign-in method.";
      } else if (err.code === "auth/email-already-in-use") {
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

  // Step 0: Language selection (very first thing ever)
  if (!langSelected) {
    return (
      <LanguageSelect
        onSelect={(code) => {
          setLang(code);
          setLangSelected(true);
        }}
      />
    );
  }

  // Step 1: 4-Page Story Onboarding & Animated Splash
  if (!introFinished) {
    return <AppIntro onFinish={() => setIntroFinished(true)} />;
  }

  // Fallback initial auth check
  if (!authInitialized) {
    return <BrandIntro introStage={introStage} />;
  }

  const visibleAuthMode = currentUser ? authMode : authMode === "signup" ? "signup" : "login";

  // Login / Signup Screen
  if (visibleAuthMode === "signup" || visibleAuthMode === "login") {
    return (
      <AuthScreen
        visibleAuthMode={visibleAuthMode}
        setAuthMode={setAuthMode}
        authModalReason={authModalReason}
        setAuthModalReason={setAuthModalReason}
        authError={authError}
        authForm={authForm}
        setAuthForm={setAuthForm}
        handleAuthSubmit={handleAuthSubmit}
        authLoading={authLoading}
        lang={lang}
        t={t}
      />
    );
  }

  // Admin Console View
  if (currentUser?.email?.toLowerCase() === ADMIN_EMAIL) {
    return (
      <AdminDashboard
        adminUsers={adminUsers}
        adminUsersLoading={adminUsersLoading}
        adminError={adminError}
        adminSelectedUser={adminSelectedUser}
        setAdminSelectedUser={setAdminSelectedUser}
        adminUserHistory={adminUserHistory}
        setAdminUserHistory={setAdminUserHistory}
        adminHistoryLoading={adminHistoryLoading}
        toggleAdminUserActive={toggleAdminUserActive}
        openAdminUserHistory={openAdminUserHistory}
        handleLogout={handleLogout}
      />
    );
  }

  // Main App Interface (Passenger & Driver Modes)
  return (
    <div className="app-layout">
      {showStoryWalkthrough && (
        <AppIntro onFinish={() => setShowStoryWalkthrough(false)} />
      )}

      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        bookingsCount={bookings.length}
        lang={lang}
        setLang={setLang}
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        userProfile={userProfile}
        currentUser={currentUser}
        role={role}
        handleAccountModeChange={handleAccountModeChange}
        setShowPrivacyModal={setShowPrivacyModal}
        setShowSosModal={setShowSosModal}
        setShowStoryWalkthrough={setShowStoryWalkthrough}
        handleLogout={handleLogout}
        t={t}
      />

      <main className="app-main">
        {notificationMessage && (
          <div className="app-notification" role="status" aria-live="polite">
            <span>🔔 {notificationMessage}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotificationMessage("")}>
              ×
            </button>
          </div>
        )}

        <ComplianceBanner t={t} />

        {currentTab === "home" && (
          <section className="dashboard-hero">
            <div className="hero-text">
              <div style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.9, marginBottom: "4px" }}>
                Tugendane Group Mobility
              </div>
              <h1>
                {role === "passenger"
                  ? `Hi, ${userProfile?.fullName?.trim().split(/\s+/).filter(Boolean).at(-1) || "Traveler"}. Where do you want to go?`
                  : `${t.driverDashTitle} 🚗`}
              </h1>
              <p>
                {role === "passenger" ? "Go everywhere with Tujyane." : t.driverDashSubtitle}
              </p>
            </div>
            <div className="hero-badges">
              <div className="hero-pill">✅ ID & License Verified</div>
              <div className="hero-pill">⚡ Direct Booking</div>
              <div className="hero-pill">💳 MTN MoMo / eKash</div>
            </div>
          </section>
        )}

        {/* VIEW: PASSENGER SEARCH & MARKETPLACE */}
        {role === "passenger" && currentTab === "home" && (
          <PassengerHome
            fromCity={fromCity}
            setFromCity={setFromCity}
            toCity={toCity}
            setToCity={setToCity}
            searchDate={searchDate}
            setSearchDate={setSearchDate}
            searchSeats={searchSeats}
            setSearchSeats={setSearchSeats}
            activePreference={activePreference}
            setActivePreference={setActivePreference}
            rides={rides}
            filteredRides={filteredRides}
            loadingRides={loadingRides}
            setSelectedRideForBooking={setSelectedRideForBooking}
            setBookingSeatsCount={setBookingSeatsCount}
            getWhatsAppLink={getWhatsAppLink}
            handleSelectRouteShortcut={handleSelectRouteShortcut}
            lang={lang}
            t={t}
          />
        )}

        {/* VIEW: MY TRIPS */}
        {currentTab === "trips" && (
          <TripsView
            bookings={bookings.filter((booking) => role === "driver" ? booking.driverId === currentUser?.uid : booking.passengerId === currentUser?.uid)}
            role={role}
            setCurrentTab={setCurrentTab}
            getShareTripMessage={getShareTripMessage}
            openTripChat={openTripChat}
            lang={lang}
            t={t}
          />
        )}

        {/* VIEW: DRIVER DASHBOARD */}
        {role === "driver" && currentTab === "home" && (
          <DriverDashboard
            rides={rides}
            bookings={bookings.filter((booking) => booking.driverId === currentUser?.uid)}
            userProfile={userProfile}
            driverPostForm={driverPostForm}
            setDriverPostForm={setDriverPostForm}
            updatePostRoute={updatePostRoute}
            pinCurrentPickup={pinCurrentPickup}
            handlePublishRide={handlePublishRide}
            handleBookingStatusUpdate={handleBookingStatusUpdate}
            openTripChat={openTripChat}
            lang={lang}
            t={t}
          />
        )}

        {/* VIEW: PROFILE */}
        {currentTab === "profile" && (
          <ProfileView
            currentUser={currentUser}
            userProfile={userProfile}
            role={role}
            setAuthModalReason={setAuthModalReason}
            setAuthMode={setAuthMode}
            setShowPrivacyModal={setShowPrivacyModal}
            handleLogout={handleLogout}
            lang={lang}
            t={t}
          />
        )}
      </main>

      {/* MODALS */}
      <BookingModal
        selectedRideForBooking={selectedRideForBooking}
        setSelectedRideForBooking={setSelectedRideForBooking}
        bookingSuccessMsg={bookingSuccessMsg}
        bookingSeatsCount={bookingSeatsCount}
        setBookingSeatsCount={setBookingSeatsCount}
        bookingPickupSpot={bookingPickupSpot}
        setBookingPickupSpot={setBookingPickupSpot}
        bookingPaymentMethod={bookingPaymentMethod}
        setBookingPaymentMethod={setBookingPaymentMethod}
        bookingNotes={bookingNotes}
        setBookingNotes={setBookingNotes}
        handleConfirmBooking={handleConfirmBooking}
        t={t}
      />

      <DriverSetupModal
        isOpen={showDriverSetupModal}
        onClose={() => setShowDriverSetupModal(false)}
        driverUpgradeForm={driverUpgradeForm}
        setDriverUpgradeForm={setDriverUpgradeForm}
        driverRulesAccepted={driverRulesAccepted}
        setDriverRulesAccepted={setDriverRulesAccepted}
        handleDriverUpgrade={handleDriverUpgrade}
        lang={lang}
      />

      <TripChatModal
        chatBooking={chatBooking}
        onClose={() => {
          setActiveChatBooking(null);
          setChatMessages([]);
        }}
        currentUser={currentUser}
        syncOfflineBookingForChat={syncOfflineBookingForChat}
        chatMessages={chatMessages}
        chatDraft={chatDraft}
        setChatDraft={setChatDraft}
        sendChatMessage={sendChatMessage}
        onEditMessage={editChatMessage}
        onDeleteMessage={deleteChatMessage}
      />

      <SosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        t={t}
      />

      <PrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        lang={lang}
      />
    </div>
  );
}
