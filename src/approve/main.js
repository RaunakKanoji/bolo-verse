// /approve/ entry. Placeholder until M7.
import { isConfigured } from "../shared/supabaseClient.js";

document.getElementById("status").textContent =
  "Page loaded · Supabase " + (isConfigured ? "configured" : "NOT configured") +
  " · query: " + (location.search || "(none)");
