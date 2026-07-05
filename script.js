import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyATgDqmkhKgU1nl2uPS0MGhAst4gpoI7L4",
  authDomain: "bloodbank-a7578.firebaseapp.com",
  projectId: "bloodbank-a7578",
  storageBucket: "bloodbank-a7578.firebasestorage.app",
  messagingSenderId: "981580443539",
  appId: "1:981580443539:web:9b9269bb8dd462be998266",
  measurementId: "G-35DQFBQ3FJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Detect device type
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|tablet/.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

document.addEventListener("DOMContentLoaded", async () => {
  const visitorCount = document.getElementById("visitorCount");

  const deviceType = getDeviceType();
  const visitorsDocRef = doc(collection(db, "visitors"), "counts");

  try {
    // Ensure document exists
    const docSnap = await getDoc(visitorsDocRef);
    if (!docSnap.exists()) {
      await setDoc(visitorsDocRef, { desktop: 0, mobile: 0 });
    }

    // Increment the correct counter
    if (deviceType === "mobile") {
      await updateDoc(visitorsDocRef, { mobile: increment(1) });
    } else {
      await updateDoc(visitorsDocRef, { desktop: increment(1) });
    }

    // Fetch updated counts
    const updatedSnap = await getDoc(visitorsDocRef);
    const data = updatedSnap.data();
    visitorCount.textContent = `Desktop visitors: ${data.desktop} | Mobile visitors: ${data.mobile}`;

  } catch (err) {
    console.error("Error updating visitor count:", err);
    visitorCount.textContent = "Error loading visitor count";
  }
});
