/* Real-time Cloud Sync Bridge for Container Tracker
   Syncs data across all browser tabs and devices instantly
*/
(function () {
  'use strict';

  const SYNC_KEYS = ['cat_edits', 'cat_adds', 'cat_deletes'];
  const CLOUD_CHECK_INTERVAL = 3000; // Check every 3 seconds
  const LOCAL_SAVE_DELAY = 500; // Wait 500ms before saving to cloud
  
  let isSyncingFromCloud = false;
  let saveCloudTimer = null;
  let lastCloudTimestamp = null;
  let isInitialized = false;

  // Override localStorage.setItem to catch tracker changes
  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    
    if (this !== localStorage || !SYNC_KEYS.includes(key) || isSyncingFromCloud) return;
    
    // Debounce cloud save
    clearTimeout(saveCloudTimer);
    saveCloudTimer = setTimeout(() => {
      saveToCloud();
    }, LOCAL_SAVE_DELAY);
    
    // Notify other tabs instantly
    notifyOtherTabs(key, value);
  };

  // Listen for storage changes from other tabs (same browser)
  window.addEventListener('storage', (e) => {
    if (SYNC_KEYS.includes(e.key) && e.newValue) {
      notifyTrackerUpdate();
    }
  });

  function readLocalData() {
    return {
      userEdits: JSON.parse(localStorage.getItem('cat_edits') || '{}'),
      userAdds: JSON.parse(localStorage.getItem('cat_adds') || '[]'),
      userDeletes: JSON.parse(localStorage.getItem('cat_deletes') || '{}')
    };
  }

  function notifyOtherTabs(key, value) {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('tracker-sync');
        channel.postMessage({
          type: 'local-update',
          key: key,
          value: value,
          timestamp: Date.now()
        });
        channel.close();
      } catch (e) {
        console.warn('BroadcastChannel not available');
      }
    }
  }

  function notifyTrackerUpdate() {
    window.dispatchEvent(new CustomEvent('tracker-cloud-updated'));
    if (typeof render === 'function') {
      render();
    }
  }

  async function saveToCloud() {
    if (isSyncingFromCloud || typeof window.saveTrackerCloudData !== 'function') return;

    try {
      const data = readLocalData();
      await window.saveTrackerCloudData(data);
      showSyncStatus('✓ Synced to cloud', false);
      console.log('[Tracker Sync] Data saved to cloud');
    } catch (error) {
      showSyncStatus('✗ Sync failed', true);
      console.error('[Tracker Sync Error]', error.message);
    }
  }

  async function loadFromCloud() {
    if (typeof window.loadTrackerCloudData !== 'function') return;

    try {
      const cloud = await window.loadTrackerCloudData();
      const cloudTimestamp = new Date(cloud.updated_at).getTime();
      
      // Only apply if cloud is newer
      if (!lastCloudTimestamp || cloudTimestamp > lastCloudTimestamp) {
        lastCloudTimestamp = cloudTimestamp;
        applyCloudData(cloud);
        return true;
      }
    } catch (error) {
      console.warn('[Tracker Cloud Load Error]', error.message);
    }
    return false;
  }

  function applyCloudData(cloud) {
    if (!cloud || !cloud.updated_at) return;

    isSyncingFromCloud = true;
    try {
      originalSetItem.call(
        localStorage,
        'cat_edits',
        JSON.stringify(cloud.user_edits || {})
      );
      originalSetItem.call(
        localStorage,
        'cat_adds',
        JSON.stringify(cloud.user_adds || [])
      );
      originalSetItem.call(
        localStorage,
        'cat_deletes',
        JSON.stringify(cloud.user_deletes || {})
      );
      
      notifyTrackerUpdate();
      showSyncStatus('✓ Updated from cloud', false);
      console.log('[Tracker Sync] Applied cloud data');
    } finally {
      isSyncingFromCloud = false;
    }
  }

  function showSyncStatus(message, isError) {
    const statusEl = document.getElementById('sync-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = isError ? 'sync-error' : 'sync-success';
    statusEl.style.display = 'block';

    if (!isError) {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 2500);
    }
  }

  // Listen for BroadcastChannel messages (other tabs)
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel('tracker-sync');
      channel.addEventListener('message', (e) => {
        if (e.data.type === 'local-update' && SYNC_KEYS.includes(e.data.key)) {
          notifyTrackerUpdate();
        }
      });
    } catch (e) {
      console.warn('BroadcastChannel setup failed');
    }
  }

  // Poll cloud every 3 seconds
  async function startCloudPolling() {
    if (!isInitialized) {
      isInitialized = true;
      await loadFromCloud();
      await saveToCloud();
    }

    setInterval(async () => {
      const updated = await loadFromCloud();
      if (updated) {
        console.log('[Tracker Sync] Received cloud update');
      }
    }, CLOUD_CHECK_INTERVAL);
  }

  // Start sync on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCloudPolling);
  } else {
    startCloudPolling();
  }

  // Expose API for manual sync
  window.trackerSync = {
    saveNow: saveToCloud,
    loadNow: loadFromCloud,
    getStatus: () => ({
      isInitialized,
      lastCloudTimestamp,
      localData: readLocalData()
    })
  };

  console.log('[Tracker Sync] Initialized - Real-time sync enabled');
})();
