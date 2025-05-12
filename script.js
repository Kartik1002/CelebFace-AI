// Firebase Imports
// import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
// import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// import { getDatabase, ref, get, child, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
// import { RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// import { setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
// import { signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// ✅ Use only v11.6.0 for all Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
    getDatabase,
    ref,
    get,
    child,
    set
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

import { GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCbwfW02HhL94w2bfB-I6V4FOmDWfhRSMs",
    authDomain: "celebface-ai.firebaseapp.com",
    databaseURL: "https://celebface-ai-default-rtdb.firebaseio.com",
    projectId: "celebface-ai",
    storageBucket: "celebface-ai.appspot.com",
    messagingSenderId: "8339876086",
    appId: "1:8339876086:web:7c012046126e878316e4d7"
};






let currentUser = null;
// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
setPersistence(auth, browserLocalPersistence);


const overlay = document.getElementById("overlay");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");


// Utility functions
function clearSignupErrors() {
    document.getElementById('sign-up-username-Error').textContent = '';
    document.getElementById('sign-up-email-Error').textContent = '';
    document.getElementById('sign-up-password-Error').textContent = '';
    document.getElementById('sign-up-username').classList.remove('invalid', 'valid');
    document.getElementById('sign-up-email').classList.remove('invalid', 'valid');
    document.getElementById('sign-up-password').classList.remove('invalid', 'valid');
}

function clearLoginErrors() {
    document.getElementById('sign-in-email-Error').textContent = '';
    document.getElementById('sign-in-password-Error').textContent = '';
    document.getElementById('sign-in-email').classList.remove('invalid', 'valid');
    document.getElementById('sign-in-password').classList.remove('invalid', 'valid');
}

function applyValidationStyle(input, isValid, errorElement, errorMessage = "") {
    input.classList.toggle('valid', isValid);
    input.classList.toggle('invalid', !isValid);
    errorElement.textContent = isValid ? "" : errorMessage;
}

function validateInput(input, regex, errorElement, errorMessage) {
    if (!input || !input.value) {
        applyValidationStyle(input, false, errorElement, "This field is required.");
        return false;
    }

    const value = input.value.trim();
    const isValid = regex.test(value);
    applyValidationStyle(input, isValid, errorElement, errorMessage);
    return isValid;
}

function isValidEmailDomain(email) {
    const [, domain = ""] = email.split("@");
    const validDomains = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "protonmail.com"];
    return validDomains.includes(domain.toLowerCase());
}

function showMessage(msg, success = true) {
    const box = document.createElement('div');
    box.className = `msg-box ${success ? 'success' : 'error-msg'}`;
    box.innerText = msg;
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2000);
}

// Signup validation
window.validateSignup = function validateSignup(event) {
    event.preventDefault();
    clearSignupErrors();

    const usernameInput = document.getElementById('sign-up-username')

    const usernameError = document.getElementById('sign-up-username-Error');
    const usernameRegex = /^[a-zA-Z0-9]{5,15}$/;

    const emailInput = document.getElementById('sign-up-email')
    const emailError = document.getElementById('sign-up-email-Error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const passwordInput = document.getElementById('sign-up-password')
    const passwordError = document.getElementById('sign-up-password-Error');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const isUsernameValid = validateInput(usernameInput, usernameRegex, usernameError, "Username must be 5-15 characters and alphanumeric.");
    let isEmailValid = validateInput(emailInput, emailRegex, emailError, "Please enter a valid email address.");
    const isPasswordValid = validateInput(passwordInput, passwordRegex, passwordError, "Password must include uppercase, lowercase, number, and special character.");

    // i have removed the email domain check from here 
    if (!isUsernameValid || !isEmailValid || !isPasswordValid) return false;

    const username = document.getElementById('sign-up-username').value.trim();
    const password = document.getElementById('sign-up-password').value.trim();
    const email = document.getElementById('sign-up-email').value.trim();
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return set(ref(db, "users/" + username), {
                uid: user.uid,
                email: email,
                password: password,
            });
        })
        .then(() => {
            console.log("User data written to DB");
            showMessage("Signup successful!");
            closeModal();
        })
        .catch((error) => {
            if (error.code === "auth/email-already-in-use") {
                showMessage("Email already registered. Try logging in.", false);
            } else {
                showMessage("Signup failed: " + error.message, false);
            }
        });

    return false;
};

// Login validation
window.validateLogin = function validateLogin(event) {
    event.preventDefault();
    clearLoginErrors();

    const emailInput = document.getElementById('sign-in-email');
    const emailError = document.getElementById('sign-in-email-Error');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const passwordInput = document.getElementById('sign-in-password');
    const passwordError = document.getElementById('sign-in-password-Error');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    let isEmailValid = validateInput(emailInput, emailRegex, emailError, "Please enter a valid email address.");
    const isPasswordValid = validateInput(passwordInput, passwordRegex, passwordError, "Password must include uppercase, lowercase, number, and special character.");

    if (isEmailValid && !isValidEmailDomain(emailInput.value)) {
        applyValidationStyle(emailInput, false, emailError, "Enter a valid email (e.g. user@gmail.com).");
        isEmailValid = false;
    }

    if (!isEmailValid || !isPasswordValid) return false;
    const password = document.getElementById('sign-in-password').value.trim();
    const email = document.getElementById('sign-in-email').value.trim();
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            showMessage("Login successful!");
            console.log("User logged in:", user.email);
            currentUser = user.email; // Store logged-in user
            updateAuthButton(true);
            closeModal();
        })
        .catch((error) => {
            console.error("Login error:", error);
            const errorMessage = error.code === 'auth/wrong-password'
                ? "Incorrect password. Please try again."
                : error.code === 'auth/user-not-found'
                    ? "Email not found. Please sign up first."
                    : "Login failed: " + error.message;

            showMessage(errorMessage, false);
        });

    return false;
};



// UI Modal functions
window.openModal = function (type) {
    overlay.style.display = "flex";
    if (type === "login") {
        loginForm.style.display = "block";
        signupForm.style.display = "none";
    } else {
        loginForm.style.display = "none";
        signupForm.style.display = "block";
    }
};

window.closeModal = function () {
    const modal = document.getElementById("modal");
    modal.classList.add("closing");
    setTimeout(() => {
        overlay.style.display = "none";
        modal.classList.remove("closing");
        clearSignupErrors();
        clearLoginErrors();
        resetInputs();
        closeMobileSignup();
        closeForgotPasswordModal();
    }, 300);
};

function resetInputs() {
    document.querySelectorAll("input").forEach(input => {
        input.classList.remove("valid", "invalid");
        input.value = "";
    });
}

window.switchToSignup = function () {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
    clearSignupErrors();
};

window.switchToLogin = function () {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
    clearLoginErrors();
}
let typed = new Typed(".auto-type", {
    strings: ["Bollywood Celebrity", "Hollywood Celebrity", "Cricket Celebrity"],
    typeSpeed: 150,
    backSpeed: 150,
    loop: true
});
let targetPercent = 80;
let current = 0;
let percentElement = document.getElementById("match-percent");

const counter = setInterval(() => {
    if (current >= targetPercent) {
        clearInterval(counter);
    } else {
        current++;
        percentElement.textContent = current + "% Similar";
    }
}, 20);


window.openMobileSignup = function () {
    document.getElementById("overlay").style.display = "block"; // background blur
    document.getElementById("mobile-signup-modal").style.display = "block";
}
document.querySelectorAll(".otp-digit").forEach((input, index, inputs) => {
    input.addEventListener("input", (e) => {
        if (e.inputType === "insertText" && input.value) {
            if (index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        }
        updateOtpCode();
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

function updateOtpCode() {
    const digits = Array.from(document.querySelectorAll(".otp-digit")).map(input => input.value).join("");
    document.getElementById("otp-code").value = digits;
}

window.sendOTP = function (event) {
    event.preventDefault();

    const countryCode = document.getElementById("countryCode").value;
    let phoneNumber = document.getElementById("mobile-number").value.trim();

    phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, ""); // Clean number
    const fullPhoneNumber = countryCode + phoneNumber;

    // E.164 format check
    if (!/^(\+\d{1,3})\d{10}$/.test(fullPhoneNumber)) {
        showMessage("Please enter a valid phone number in the correct format.", false);
        return;
    }

    fetch("http://localhost:3000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhoneNumber })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessage("OTP sent to your phone.", true);
                document.getElementById("mobile-signup-form").style.display = "none";
                document.getElementById("verify-otp-form").style.display = "block";
            } else {
                showMessage("Failed to send OTP: " + data.message, false);
            }
        })
        .catch(error => {
            console.error("Error sending OTP:", error);
            showMessage("Error sending OTP. Please try again.", false);
        });
};
window.verifyOTP = function (event) {
    event.preventDefault();

    const countryCode = document.getElementById("countryCode").value;
    const phoneNumber = document.getElementById("mobile-number").value.trim().replace(/[\s\-\(\)]/g, "");
    const fullPhoneNumber = countryCode + phoneNumber;

    const otpCode = document.getElementById("otp-code").value.trim();

    fetch("http://localhost:3000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhoneNumber, code: otpCode })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showMessage("Mobile number verified and signup successful!");
                closeMobileSignup();
                closeModal();
                updateAuthButton(true);
            } else {
                showMessage("OTP verification failed: " + data.message, false);
            }
        })
        .catch(error => {
            console.error("Error verifying OTP:", error);
            showMessage("Network error while verifying OTP", false);
        });
};


window.closeMobileSignup = function () {
    document.getElementById("mobile-signup-modal").style.display = "none";
    document.getElementById("mobile-signup-form").reset();
    document.getElementById("verify-otp-form").reset();
    document.getElementById("mobile-signup-form").style.display = "block";
    document.getElementById("verify-otp-form").style.display = "none";
}
window.switchToMobileSignup = function () {
    document.getElementById("signupForm").style.display = "none"; // hide email form
    document.getElementById("mobile-signup-modal").style.display = "block"; // show mobile form
    resetInputs();
}

window.switchToEmailSignup = function () {
    document.getElementById("mobile-signup-modal").style.display = "none"; // hide mobile form
    document.getElementById("signupForm").style.display = "block"; // show email form
    closeMobileSignup();
}

document.getElementById('forgot-password-link').addEventListener('click', function (e) {
    e.preventDefault();
});
window.openForgotPasswordModal = function () {
    document.getElementById("forgotPasswordModal").style.display = "block";
    document.getElementById("loginForm").style.display = "none";
}

// Close the Forgot Password modal
window.closeForgotPasswordModal = function () {
    document.getElementById("forgotPasswordModal").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
}
document.getElementById('forgot-password-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const emailInput = document.getElementById('forgot-password-email');
    const resetMessage = document.getElementById('reset-message');
    const email = emailInput.value.trim();

    if (!email) {
        showMessage("Please enter a valid email address.", false);
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        resetMessage.style.color = 'red';
        resetMessage.textContent = 'Invalid email format.';
        return;
    }

    sendPasswordResetEmail(auth, email)
        .then(() => {
            showMessage("Password reset email sent! Please check your inbox.");
            setTimeout(() => closeForgotPasswordModal(), 3000);
        })
        .catch((error) => {
            console.error("Reset error:", error);
            showMessage("Error: " + error.message, false);
        });
});
let isLoggingOut = false;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log(currentUser);
        // Update login button to say "Logout"
        updateAuthButton(true);
        console.log("User is signed in:", user.phoneNumber || user.email);
    } else {
        currentUser = null;
        console.log("No user is signed in.");
        updateAuthButton(null);  // Set button to "Login"
    }
});
window.logoutUser = function () {
    isLoggingOut = true;
    auth.signOut()
        .then(() => {
            showMessage("Logged out successfully!");
            updateAuthButton(false); // Update button to show Login
            currentUser = null; // Clear current user
            setTimeout(() => isLoggingOut = false, 1000); // Prevent triggering login for 1s
        })
        .catch((error) => {
            isLoggingOut = false;
            console.error("Logout error:", error);
            showMessage("Error logging out: " + error.message, false);
        });
};

window.handleAuthAction = function () {
    if (isLoggingOut) return; // Prevent action during logout
    if (currentUser) {
        logoutUser(); // Call logoutUser if the user is logged in
    } else {
        openModal("login"); // Open login modal if not logged in
    }
};

window.updateAuthButton = function (isLoggedIn) {
    const authButton = document.getElementById("auth-button");
    if (isLoggedIn) {
        authButton.textContent = "Logout";
        authButton.onclick = logoutUser; // Directly call logoutUser on click
    } else {
        authButton.textContent = "Login";
        authButton.onclick = () => openModal("login"); // Open login modal
    }
};

// Try Now button logic
const tryNowBtn = document.getElementById("try-now-btn");

tryNowBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoggingOut) return; // Prevent action during logout
    if (currentUser) {
        window.location.href = "http://127.0.0.1:5000/"; // Redirect to face match tool
    } else {
        showMessage("Please log in or sign up to use the tool.", false);
        openModal("login"); // Open login modal if not logged in
    }
});
const provider = new GoogleAuthProvider();
let isSigningIn = false;
// Google Login
document.getElementById("google-login").addEventListener("click", async () => {
    if (isSigningIn) return; // block second call
    isSigningIn = true;
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Google Sign-in successful:", user);
        showMessage("Welcome " + user.displayName, true);
        updateAuthButton(true);
    } catch (error) {
        console.error("Google Sign-in error:", error.message);
        showMessage("Error: " + error.message, false);
    }
});