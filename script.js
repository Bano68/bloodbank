import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, collection, doc, getDoc, setDoc, updateDoc, increment,
  addDoc, getDocs, query, orderBy, where, onSnapshot
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
  const donorForm = document.getElementById("donorForm");
  const donorTableBody = document.querySelector("#donorTable tbody");

  let serialCounter = 1;

  // -------------------
  // Global Visitor Counter
  // -------------------
  const deviceType = getDeviceType();
  const visitorsDocRef = doc(collection(db, "visitors"), "counts");

  try {
    const docSnap = await getDoc(visitorsDocRef);
    if (!docSnap.exists()) {
      await setDoc(visitorsDocRef, { desktop: 0, mobile: 0 });
    }

    if (deviceType === "mobile") {
      await updateDoc(visitorsDocRef, { mobile: increment(1) });
    } else {
      await updateDoc(visitorsDocRef, { desktop: increment(1) });
    }

    // Real-time listener for visitor counts
    onSnapshot(visitorsDocRef, (snap) => {
      const data = snap.data();
      visitorCount.textContent = `Desktop visitors: ${data.desktop} | Mobile visitors: ${data.mobile}`;
    });
  } catch (err) {
    console.error("Error updating visitor count:", err);
    visitorCount.textContent = "Error loading visitor count";
  }

  // -------------------
  // Donor Table Logic
  // -------------------
  function renderDonorRow(donor) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${donor.serialId}</td>
      <td>${donor.firstName}</td>
      <td>${donor.lastName}</td>
      <td>${donor.bloodGroup}</td>
      <td>${donor.city}</td>
      <td>${donor.phone}</td>
    `;
    donorTableBody.insertBefore(row, donorTableBody.firstChild);
  }

  donorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const bloodGroup = document.getElementById("bloodGroup").value.trim();
    const city = document.getElementById("city").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!firstName || !lastName || !bloodGroup || !city || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    const phonePattern = /^\+92\d{10}$/;
    if (!phonePattern.test(phone)) {
      alert("Phone number must be in format +923001234567");
      return;
    }

    try {
      // Check duplicate phone
      const q = query(collection(db, "donors"), where("phone", "==", phone));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        alert("This phone number is already registered.");
        return;
      }

      // Save donor
      await addDoc(collection(db, "donors"), {
        serialId: serialCounter,
        firstName,
        lastName,
        bloodGroup,
        city,
        phone
      });

      serialCounter++;
      donorForm.reset();
    } catch (err) {
      console.error("Error adding donor:", err);
      alert("Error: " + err.message);
    }
  });

  // Real-time donor list
  const donorQuery = query(collection(db, "donors"), orderBy("serialId", "asc"));
  onSnapshot(donorQuery, (snapshot) => {
    donorTableBody.innerHTML = "";
    snapshot.forEach((doc) => {
      const donor = doc.data();
      renderDonorRow(donor);
      if (donor.serialId >= serialCounter) serialCounter = donor.serialId + 1;
    });
  });
});
