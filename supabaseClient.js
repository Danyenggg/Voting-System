/**
 * supabaseClient.js
 * Creates the single Supabase client used by every page.
 *
 * SECURITY: only the PUBLISHABLE key belongs here. It is designed to be public;
 * what a user can do is limited by Row Level Security and the database functions.
 * NEVER put the service-role / secret key in any frontend file.
 *
 * Requires the Supabase library to be loaded first:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 */
const SUPABASE_URL = "https://pipaisszzcpopzemotca.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rPVMi67uZ8JAn0ZHATeFzQ_JxzDsuNA";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/**
 * Turns a database error into a friendly message.
 * Our SQL functions raise errors that start with a CODE (e.g. "ALREADY_VOTED: ...").
 */
const ERROR_MESSAGES = {
  NOT_AUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to do that.",
  ALREADY_VOTED: "You have already voted in this poll.",
  POLL_NOT_FOUND: "This poll does not exist or you are not in its classroom.",
  POLL_NOT_STARTED: "Voting for this poll has not opened yet.",
  POLL_CLOSED: "Voting for this poll has ended.",
  POLL_ALREADY_CLOSED: "This poll is closed and can no longer be changed.",
  POLL_HAS_VOTES: "This poll already has votes, so that change is not allowed.",
  POLL_NOT_EDITABLE: "Options can only be changed while the poll is a draft without votes.",
  POLL_NEEDS_OPTIONS: "A poll needs at least 2 options before it can be activated.",
  INVALID_OPTION: "That answer is not part of this poll.",
  INVALID_OPTIONS: "Please provide 2 to 10 different, non-empty options.",
  INVALID_SCHEDULE: "The end time must be in the future and after the start time.",
  INVALID_CLASSROOM_CODE: "No active classroom matches that code.",
  INVALID_TEACHER_INVITE_CODE: "The teacher invite code is incorrect.",
  TEACHER_SIGNUP_DISABLED: "Teacher registration is not enabled yet.",
  REASON_REQUIRED: "Please give a reason of at least 10 characters.",
  ANONYMOUS_POLL: "Individual votes in anonymous polls cannot be identified or corrected.",
};

function friendlyError(error) {
  if (!error) return "";
  const raw = error.message || String(error);
  if (/failed to fetch|networkerror|network request failed/i.test(raw)) {
    return "Connection problem. Please check your internet and try again.";
  }
  const code = raw.split(":")[0].trim();
  if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (/row-level security|permission denied/i.test(raw)) {
    return "You do not have permission to do that.";
  }
  return "Something went wrong. Please try again.";
}
