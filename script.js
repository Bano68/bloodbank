import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", () => {
  const donorForm = document.getElementById("donorForm");
  const donorTableBody = document.querySelector("#donorTable tbody");
  const visitorCount = document.getElementById("visitorCount");

  let serialCounter = 1;

  // Visitor counter
  let count = localStorage.getItem("visitorCount") || 0;
  count++;
  localStorage.setItem("visitorCount", count);
  visitorCount.textContent = count;

  // Handle donor form submission
  donorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const bloodGroup = document.getElementById("bloodGroup").value;
    const city = document.getElementById("city").value;
    const phone = document.getElementById("phone").value;

    // Save donor to Firestore
    try {
      await addDoc(collection(db, "donors"), {
        serialId: serialCounter,
        firstName,
        lastName,
        bloodGroup,
        city,
        phone
      });

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${serialCounter}</td>
        <td>${firstName}</td>
        <td>${lastName}</td>
        <td>${bloodGroup}</td>
        <td>${city}</td>
        <td>${phone}</td>
      `;
      donorTableBody.appendChild(row);

      serialCounter++;
      donorForm.reset();
    } catch (err) {
      console.error("Error adding donor:", err);
      alert("Error: " + err.message);
    }
  });

  // Load existing donors
  (async () => {
    const querySnapshot = await getDocs(collection(db, "donors"));
    querySnapshot.forEach((doc) => {
      const donor = doc.data();
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
      if (donor.serialId >= serialCounter) serialCounter = donor.serialId + 1;
    });
  })();
});
