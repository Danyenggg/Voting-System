/**
 * index.js - the entry point. Sends each visitor to the right place:
 * signed out -> login, teacher -> admin dashboard, student -> student dashboard.
 */
(async () => {
  try {
    const user = await Auth.getVerifiedUser();
    if (!user) return window.location.replace("login.html");
    const profile = await Auth.getProfile(user.id);
    if (!profile) return window.location.replace("login.html");
    Auth.redirectHome(profile.role);
  } catch (err) {
    console.error(err);
    window.location.replace("login.html");
  }
})();
