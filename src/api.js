const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "") + "/api";

export async function fetchLatest(limit = 40) {
  const res = await fetch(`${API_URL}/data/latest?limit=${limit}&onlyValid=true`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Error API");
  return json.data;
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/data/stats`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Error API");
  return json.stats;
}
