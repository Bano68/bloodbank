import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot
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
  const visitorLoader = document.getElementById("visitorLoader");
  const donorForm = document.getElementById("donorForm");
  const donorTableBody = document.querySelector("#donorTable tbody");
  const donorTable = document.getElementById("donorTable");
  const tableLoader = document.getElementById("tableLoader");

  let serialCounter = 1;

  // =============================
  // Visitor Counter
  // =============================
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

    onSnapshot(visitorsDocRef, (snap) => {
      const data = snap.data();

      // Hide loader, show count
      visitorLoader.classList.add("hidden");
      visitorCount.classList.remove("hidden");

      visitorCount.textContent =
        `Desktop visitors: ${data.desktop} | Mobile visitors: ${data.mobile}`;
    });
  } catch (err) {
    console.error(err);
  }

  // =============================
  // Add Donor
  // =============================
  donorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const bloodGroup = document.getElementById("bloodGroup").value;
    const city = document.getElementById("city").value.trim();
    const phone = document.getElementById("phone").value.trim();

    if (!firstName || !lastName || !bloodGroup || !city || !phone) {
      alert("Please fill all fields.");
      return;
    }

    const phonePattern = /^\+92\d{10}$/;
    if (!phonePattern.test(phone)) {
      alert("Phone number must be like +923001234567");
      return;
    }

    try {
      const q = query(collection(db, "donors"), where("phone", "==", phone));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("Phone number already registered.");
        return;
      }

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
      alert("Donor Added Successfully");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // =============================
  // Read Donors (Realtime)
  // =============================
  onSnapshot(
    collection(db, "donors"),
    (snapshot) => {
      donorTableBody.innerHTML = "";

      snapshot.forEach((document) => {
        const donor = document.data();

        if (donor.serialId >= serialCounter) {
          serialCounter = donor.serialId + 1;
        }

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${donor.serialId}</td>
          <td>${donor.firstName}</td>
          <td>${donor.lastName}</td>
          <td>${donor.bloodGroup}</td>
          <td>${donor.city}</td>
          <td>${donor.phone}</td>
        `;
        donorTableBody.appendChild(row);
      });

      // Hide loader, show table
      tableLoader.classList.add("hidden");
      donorTable.classList.remove("hidden");
    },
    (error) => {
      console.error("Firestore Read Error:", error);
      alert(error.message);
    }
  );
});
