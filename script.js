import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Loader helpers
function showLoader(loaderId, contentId) {
  document.getElementById(loaderId).style.display = "block";
  document.getElementById(contentId).classList.add("hidden");
}
function hideLoader(loaderId, contentId) {
  document.getElementById(loaderId).style.display = "none";
  document.getElementById(contentId).classList.remove("hidden");
}

// Detect device type
function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|tablet/.test(ua)) return "mobile";
  return "desktop";
}

document.addEventListener("DOMContentLoaded", () => {
  const donorForm = document.getElementById("donorForm");
  const donorTableBody = document.querySelector("#donorTable tbody");
  const visitorCount = document.getElementById("visitorCount");
  const membersCount = document.getElementById("membersCount");

  let serialCounter = 1;

  // ✅ Visitors counter with loader
  showLoader("visitorLoader", "visitorCount");
  setTimeout(() => {
    const deviceType = getDeviceType();
    const key = deviceType === "mobile" ? "visitorCountMobile" : "visitorCountDesktop";
    let count = parseInt(localStorage.getItem(key)) || 0;
    count++;
    localStorage.setItem(key, count);

    const desktopCount = localStorage.getItem("visitorCountDesktop") || 0;
    const mobileCount = localStorage.getItem("visitorCountMobile") || 0;
    visitorCount.textContent = `Desktop visitors: ${desktopCount} | Mobile visitors: ${mobileCount}`;

    hideLoader("visitorLoader", "visitorCount");
  }, 800); // simulate loading

  // ✅ Render donor row
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

  // ✅ Handle donor form submission
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
      // Check duplicates
      const existingSnapshot = await getDocs(collection(db, "donors"));
      let duplicate = false;
      existingSnapshot.forEach((doc) => {
        if (doc.data().phone === phone) duplicate = true;
      });
      if (duplicate) {
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

  // ✅ Donor table loader + real-time updates
  showLoader("tableLoader", "donorTable");
  const q = query(collection(db, "donors"), orderBy("serialId", "asc"));
  onSnapshot(q, (querySnapshot) => {
    donorTableBody.innerHTML = ""; // clear table before re-render
    querySnapshot.forEach((doc) => {
      const donor = doc.data();
      renderDonorRow(donor);
      if (donor.serialId >= serialCounter) serialCounter = donor.serialId + 1;
    });
    hideLoader("tableLoader", "donorTable");
  });

  // ✅ Real-time members count
  onSnapshot(collection(db, "donors"), (snapshot) => {
    membersCount.textContent = `Total Members: ${snapshot.size}`;
  });
});
