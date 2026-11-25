/**
 * auth.js - everything about signing up, signing in and protecting pages.
 *
 * IMPORTANT (for your defense): the checks in this file only decide which page a
 * person SEES. They are not the security. The real security is in the database:
 *  - the role is stored in the `profiles` table and set by a server-side trigger,
 *  - Row Level Security decides which rows each user may read or change,
 *  - the teacher invite code is verified inside the database during sign-up.
 * Even if someone edits this JavaScript in their browser, the database still refuses.
 *
 * Requires: supabase-js (CDN) and supabaseClient.js to be loaded first.
 */
const Auth = (() => {
  // Where each role lands after login (relative to the site root)
  const ROLE_HOME = {
    teacher: "admin/dashboard.html",
    student: "student/dashboard.html",
  };

  // Pages inside folders set <body data-base="../"> so links still resolve.
  const base = () => document.body.dataset.base || "";
  const go = (path) => window.location.replace(base() + path);

  /** Translate sign-in / sign-up errors into messages a student can act on. */
  function authError(error, context = {}) {
    const raw = (error && (error.message || String(error))) || "";
    const code = error && error.code;

    if (/failed to fetch|networkerror|network request failed|load failed/i.test(raw)) {
      return "Connection problem. Check your internet and try again.";
    }
    if (/invalid login credentials/i.test(raw)) return "Email or password is incorrect.";
    if (/email not confirmed/i.test(raw)) return "Please confirm your email first, then sign in.";
    if (/already registered|already been registered/i.test(raw) || code === "user_already_exists") {
      return "An account with this email already exists. Try signing in instead.";
    }
    if (code === "weak_password" || /password should be/i.test(raw)) {
      return "That password is too weak. Use at least 8 characters.";
    }
    if (/rate limit|too many requests/i.test(raw) || code === "over_request_rate_limit") {
      return "Too many attempts. Please wait a minute and try again.";
    }
    if (/invalid email|unable to validate email/i.test(raw)) return "Please enter a valid email address.";
    // The database trigger rejected the sign-up (e.g. wrong teacher invite code).
    if (/database error saving new user/i.test(raw)) {
      return context.role === "teacher"
        ? "Could not create the teacher account. Check that the invite code is correct."
        : "Could not create your account. Please try again.";
    }
    return "Something went wrong. Please try again.";
  }

  /** Returns the signed-in user, verified with the server (not just local storage). */
  async function getVerifiedUser() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data || !data.user) return null;
    return data.user;
  }

  /** Reads the user's own profile row (RLS only lets them read their own). */
  async function getProfile(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Create an account. The server decides the role; we only *request* one. */
  async function signUp({ fullName, email, password, role, inviteCode }) {
    const metadata = { full_name: fullName, requested_role: role };
    if (role === "teacher") metadata.teacher_invite_code = inviteCode;

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw Object.assign(error, { friendly: authError(error, { role }) });

    // Supabase hides "already registered" by returning a user with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw { friendly: authError({ code: "user_already_exists" }) };
    }
    // data.session is null when the project requires email confirmation.
    return { session: data.session, user: data.user };
  }

  async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw Object.assign(error, { friendly: authError(error) });
    return data.user;
  }

  async function signOut() {
    await supabaseClient.auth.signOut();
    go("login.html");
  }

  /** Send a person to the home page for their role. */
  function redirectHome(role) {
    go(ROLE_HOME[role] || "login.html");
  }

  /**
   * Guard for protected pages. Call once on page load.
   * - not signed in           -> login page
   * - signed in, wrong role   -> their own dashboard
   * - allowed                 -> returns the profile and reveals the page
   */
  async function protectPage(requiredRole) {
    try {
      const user = await getVerifiedUser();
      if (!user) return go("login.html");

      const profile = await getProfile(user.id);
      if (!profile) {
        await supabaseClient.auth.signOut();
        return go("login.html?error=noprofile");
      }
      if (profile.role !== requiredRole) return redirectHome(profile.role);

      document.body.classList.remove("is-loading");
      return profile;
    } catch (err) {
      console.error("protectPage failed:", err);
      document.body.classList.remove("is-loading");
      const main = document.querySelector("main");
      if (main) {
        main.innerHTML =
          '<div class="page"><div class="alert alert-error" role="alert">' +
          "Could not load your account. Check your connection and refresh the page.</div></div>";
      }
      return null;
    }
  }

  /** Small helper to show / hide an alert box. */
  function showAlert(el, type, message) {
    el.className = "alert alert-" + type;
    el.textContent = message;
    el.hidden = false;
  }
  function hideAlert(el) {
    el.hidden = true;
    el.textContent = "";
  }

  return { signUp, signIn, signOut, protectPage, redirectHome, getVerifiedUser, getProfile, showAlert, hideAlert };
})();
