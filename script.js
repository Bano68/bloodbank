import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const donorForm = document.getElementById("donorForm");
  const donorTableBody = document.querySelector("#donorTable tbody");
  const verifySection = document.getElementById("verifySection");
  const visitorCount = document.getElementById("visitorCount");

  let serialCounter = 1;
  let verifiedPhone = null;

  // Visitor counter
  let count = localStorage.getItem("visitorCount") || 0;
  count++;
  localStorage.setItem("visitorCount", count);
  visitorCount.textContent = count;

  // Setup reCAPTCHA
  window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "normal" });

  // Handle donor form submission
  donorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const bloodGroup = document.getElementById("bloodGroup").value;
    const city = document.getElementById("city").value;
    const phone = document.getElementById("phone").value;

    if (!verifiedPhone || verifiedPhone !== phone) {
      // Send SMS verification
      try {
        const confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        verifySection.style.display = "block";
        alert("Verification code sent to " + phone);
      } catch (err) {
        console.error("SMS not sent:", err);
        alert("Error: " + err.message);
      }
      return;
    }

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
      verifiedPhone = null; // reset for next entry
    } catch (err) {
      console.error("Error adding donor:", err);
    }
  });

  // Verify code
  document.getElementById("verifyBtn").addEventListener("click", async () => {
    const code = document.getElementById("verifyCode").value;
    try {
      const result = await window.confirmationResult.confirm(code);
      verifiedPhone = result.user.phoneNumber;
      alert("Phone verified! Now submit the form again to add donor.");
      verifySection.style.display = "none";
    } catch (err) {
      console.error("Verification failed:", err);
      alert("Verification failed: " + err.message);
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
