/**
 * register.js - logic for register.html
 *
 * The browser only REQUESTS a role. The database trigger decides the real role:
 * "teacher" is granted only if the invite code matches the hashed code stored
 * on the server. Anything else becomes "student".
 */
(() => {
  const form = document.getElementById("register-form");
  const alertBox = document.getElementById("alert");
  const submitBtn = document.getElementById("submit");
  const inviteField = document.getElementById("invite-field");
  const inviteInput = document.getElementById("invite");

  const selectedRole = () => form.querySelector('input[name="role"]:checked').value;

  // Show the invite-code field only for teachers
  function syncRole() {
    const isTeacher = selectedRole() === "teacher";
    inviteField.hidden = !isTeacher;
    inviteInput.required = isTeacher;
    if (!isTeacher) inviteInput.value = "";
  }
  form.querySelectorAll('input[name="role"]').forEach((r) => r.addEventListener("change", syncRole));
  syncRole();

  function setBusy(busy) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? "Creating account..." : "Create account";
  }

  /** Returns an error message, or "" when the form is valid. */
  function validate(values) {
    if (values.fullName.length < 2) return "Enter your full name (at least 2 characters).";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) return "Enter a valid email address.";
    if (values.password.length < 8) return "Password must be at least 8 characters.";
    if (values.password !== values.confirm) return "The two passwords do not match.";
    if (values.role === "teacher" && !values.inviteCode) return "Enter the teacher invite code.";
    return "";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    Auth.hideAlert(alertBox);

    const values = {
      role: selectedRole(),
      fullName: form.elements.full_name.value.trim(),
      email: form.elements.email.value.trim(),
      password: form.elements.password.value,
      confirm: form.elements.confirm.value,
      inviteCode: inviteInput.value.trim(),
    };

    const problem = validate(values);
    if (problem) {
      Auth.showAlert(alertBox, "error", problem);
      return;
    }

    setBusy(true);
    try {
      const { session, user } = await Auth.signUp(values);

      if (!session) {
        // Email confirmation is switched on in Supabase: no session until the link is clicked.
        Auth.showAlert(alertBox, "info", "Account created. Check your email to confirm it, then sign in.");
        form.reset();
        syncRole();
        setBusy(false);
        return;
      }

      const profile = await Auth.getProfile(user.id);
      if (profile) Auth.redirectHome(profile.role);
      else window.location.replace("login.html");
    } catch (err) {
      Auth.showAlert(alertBox, "error", err.friendly || "Something went wrong. Please try again.");
      setBusy(false);
    }
  });
})();
