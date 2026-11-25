/**
 * login.js - logic for login.html
 */
(() => {
  const form = document.getElementById("login-form");
  const alertBox = document.getElementById("alert");
  const submitBtn = document.getElementById("submit");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // Message when a guard sent the person back here
  const params = new URLSearchParams(window.location.search);
  if (params.get("error") === "noprofile") {
    Auth.showAlert(alertBox, "error", "Your account has no profile. Please register again or contact your teacher.");
  }

  // Already signed in? Skip the form and go to the right dashboard.
  (async () => {
    try {
      const user = await Auth.getVerifiedUser();
      if (!user) return;
      const profile = await Auth.getProfile(user.id);
      if (profile) Auth.redirectHome(profile.role);
    } catch (err) {
      console.error("Session check failed:", err);
    }
  })();

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? "Signing in..." : "Sign in";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    Auth.hideAlert(alertBox);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      Auth.showAlert(alertBox, "error", "Enter your email and password.");
      return;
    }

    setBusy(true);
    try {
      const user = await Auth.signIn(email, password);
      const profile = await Auth.getProfile(user.id);
      if (!profile) {
        await supabaseClient.auth.signOut();
        Auth.showAlert(alertBox, "error", "Your account has no profile. Please register again.");
        setBusy(false);
        return;
      }
      Auth.redirectHome(profile.role);
    } catch (err) {
      Auth.showAlert(alertBox, "error", err.friendly || "Something went wrong. Please try again.");
      setBusy(false);
    }
  });
})();
