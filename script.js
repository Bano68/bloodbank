import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const donorForm = document.getElementById("donorForm");
  const donorTableBody = document.querySelector("#donorTable tbody");
  const visitorCount = document.getElementById("visitorCount");

  let serialCounter = 1;

  // Visitor counter (separate for desktop and mobile)
  const deviceType = getDeviceType();
  const key = deviceType === "mobile" ? "visitorCountMobile" : "visitorCountDesktop";

  let count = parseInt(localStorage.getItem(key)) || 0;
  count++;
  localStorage.setItem(key, count);

  // Show both counters
  const desktopCount = localStorage.getItem("visitorCountDesktop") || 0;
  const mobileCount = localStorage.getItem("visitorCountMobile") || 0;
  visitorCount.textContent = `Desktop visitors: ${desktopCount} | Mobile visitors: ${mobileCount}`;

  // Function to render donor row (insert at top)
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
    donorTableBody.insertBefore(row, donorTableBody.firstChild); // ✅ newest first
  }

  // Handle donor form submission
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

    try {
      // Check if phone already exists
      const existingSnapshot = await getDocs(collection(db, "donors"));
      let duplicate = false;
      existingSnapshot.forEach((doc) => {
        if (doc.data().phone === phone) {
          duplicate = true;
        }
      });

      if (duplicate) {
        alert("This phone number is already registered.");
        return;
      }

      // Save donor to Firestore
      await addDoc(collection(db, "donors"), {
        serialId: serialCounter,
        firstName,
        lastName,
        bloodGroup,
        city,
        phone
      });

      renderDonorRow({ serialId: serialCounter, firstName, lastName, bloodGroup, city, phone });

      serialCounter++;
      donorForm.reset();
    } catch (err) {
      console.error("Error adding donor:", err);
      alert("Error: " + err.message);
    }
  });

  // Load existing donors oldest-first
(async () => {
  try {
    const q = query(collection(db, "donors"), orderBy("serialId", "asc")); // ✅ ascending order
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const donor = doc.data();
      renderDonorRow(donor);
      if (donor.serialId >= serialCounter) serialCounter = donor.serialId + 1;
    });
  } catch (err) {
    console.error("Error loading donors:", err);
    alert("Error loading donors: " + err.message);
  }
})();

});
