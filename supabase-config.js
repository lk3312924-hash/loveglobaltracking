/* Shared cloud storage for Container Arrival Tracker.
 * Use only a Supabase publishable/anon key in browser code.
 * Rotate any key that has been posted publicly.
 */
window.TRACKER_SUPABASE_CONFIG = {
  url: 'https://eakoxpjsrwvectigclgr.supabase.co',
  key: 'sb_publishable_kvSX9t1dQomBTsB5Y4Qsvw_SeEBc9J9'
};

(function () {
  const TABLE = 'tracker_data';
  const config = window.TRACKER_SUPABASE_CONFIG;
  const headers = () => ({
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    'Content-Type': 'application/json'
  });
  const endpoint = `${config.url}/rest/v1/${TABLE}`;

  window.loadTrackerCloudData = async function () {
    const response = await fetch(`${endpoint}?id=eq.1&select=id,user_edits,user_adds,user_deletes,updated_at`, {
      method: 'GET',
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Cloud load failed (${response.status})`);
    const rows = await response.json();
    return rows[0] || { id: 1, user_edits: {}, user_adds: [], user_deletes: {} };
  };

  window.saveTrackerCloudData = async function (data) {
    const response = await fetch(`${endpoint}?on_conflict=id`, {
      method: 'POST',
      headers: {
        ...headers(),
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
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Cloud save failed (${response.status}) ${detail}`);
    }
  };

  window.subscribeTrackerCloudChanges = function (onChange, intervalMs = 5000) {
    let stopped = false;
    let lastUpdated = '';
    async function poll() {
      if (stopped) return;
      try {
        const cloud = await window.loadTrackerCloudData();
        const updated = cloud.updated_at || '';
        if (updated && updated !== lastUpdated) {
          lastUpdated = updated;
          onChange(cloud);
        }
      } catch (error) {
        console.warn('Tracker cloud sync unavailable:', error);
      }
      if (!stopped) setTimeout(poll, intervalMs);
    }
    poll();
    return () => { stopped = true; };
  };
})();
