// Firebase imports
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

// DOM elements
const donorForm = document.getElementById("donorForm");
const donorTableBody = document.querySelector("#donorTable tbody");

let serialCounter = 1;

// Render donor row
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
  donorTableBody.appendChild(row);
}

// Load existing donors from Firestore
async function loadDonors() {
  try {
    const q = query(collection(db, "donors"), orderBy("serialId", "asc"));
    const querySnapshot = await getDocs(q);

    donorTableBody.innerHTML = ""; // clear table before rendering
    querySnapshot.forEach((doc) => {
      const donor = doc.data();
      renderDonorRow(donor);
      if (donor.serialId >= serialCounter) serialCounter = donor.serialId + 1;
    });
  } catch (err) {
    console.error("Error loading donors:", err);
    alert("Error loading donors: " + err.message);
  }
}

// Call loadDonors on page load
loadDonors();

// Handle form submission
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
    await addDoc(collection(db, "donors"), {
      serialId: serialCounter,
      firstName,
      lastName,
      bloodGroup,
      city,
      phone
    });

    // Refresh donor list after adding
    loadDonors();
    serialCounter++;
    donorForm.reset();
  } catch (err) {
    console.error("Error adding donor:", err);
    alert("Error: " + err.message);
  }
});
