/* Shared cloud storage configuration for Container Arrival Tracker.
 * This file is intentionally kept separate so the public anon key is not mixed
 * into the application data. The anon/publishable key is safe for browser use;
 * never put a service_role key here.
 */
window.TRACKER_SUPABASE_CONFIG = {
  url: 'https://eakoxpjsrwvectigclgr.supabase.co',
  key: 'sb_publishable_kvSX9t1dQomBTsB5Y4Qsvw_SeEBc9J9'
};

window.loadTrackerCloudData = async function () {
  const config = window.TRACKER_SUPABASE_CONFIG;
  const response = await fetch(`${config.url}/rest/v1/tracker_data?id=eq.1&select=id,user_edits,user_adds,user_deletes,updated_at`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`
    },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error(`Cloud load failed (${response.status})`);
  const rows = await response.json();
  return rows[0] || { user_edits: {}, user_adds: [], user_deletes: {} };
};

window.saveTrackerCloudData = async function (data) {
  const config = window.TRACKER_SUPABASE_CONFIG;
  const response = await fetch(`${config.url}/rest/v1/tracker_data?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify({
      id: 1,
      user_edits: data.userEdits || {},
      user_adds: data.userAdds || [],
      user_deletes: data.userDeletes || {},
      updated_at: new Date().toISOString()
    })
  });
  if (!response.ok) throw new Error(`Cloud save failed (${response.status})`);
};
