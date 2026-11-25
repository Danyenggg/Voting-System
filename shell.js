/**
 * shell.js - common behaviour for protected pages.
 * Usage: <script src="../js/shell.js" data-role="teacher"></script>
 *
 * 1. Verifies the visitor is signed in AND has the required role (else redirects).
 * 2. Fills in the user's name / role / email from the `profiles` table.
 * 3. Wires up the Sign out button.
 */
(async () => {
  const requiredRole = document.currentScript.dataset.role;
  const profile = await Auth.protectPage(requiredRole);
  if (!profile) return;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText("user-name", profile.full_name);
  setText("user-role", profile.role === "teacher" ? "Teacher" : "Student");
  setText("account-name", profile.full_name);
  setText("account-email", profile.email || "-");
  setText("account-role", profile.role);

  const signOutBtn = document.getElementById("signout");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      signOutBtn.disabled = true;
      await Auth.signOut();
    });
  }

  // Exposed for the dashboard modules that come next
  window.currentProfile = profile;
})();
