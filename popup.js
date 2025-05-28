// Function to format date
function formatDate(date) {
  return new Date(date).toLocaleString();
}

// Function to update history display
async function updateHistory() {
  try {
    const historyList = document.getElementById('historyList');
    const history = await chrome.storage.local.get('bookmarkHistory');
    const historyItems = history.bookmarkHistory || [];

    if (historyItems.length === 0) {
      historyList.innerHTML = '<div class="history-item">No recent bookmarks</div>';
      return;
    }

    historyList.innerHTML = historyItems
      .map(item => `
        <div class="history-item">
          ${item.tabs} tabs - ${item.folderName}<br>
          <small>${formatDate(item.timestamp)}</small>
        </div>
      `)
      .join('');
  } catch (error) {
    console.error('Error updating history:', error);
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="history-item">Unable to load history</div>';
  }
}

// Function to add to history
async function addToHistory(tabs, folderName) {
  try {
    const history = await chrome.storage.local.get('bookmarkHistory');
    const historyItems = history.bookmarkHistory || [];
    
    // Add new item to the beginning of the array
    historyItems.unshift({
      tabs,
      folderName,
      timestamp: new Date().toISOString()
    });

    // Keep only the last 5 items
    const trimmedHistory = historyItems.slice(0, 5);

    await chrome.storage.local.set({ bookmarkHistory: trimmedHistory });
    await updateHistory();
  } catch (error) {
    console.error('Error adding to history:', error);
    // Don't show error to user as this is a non-critical feature
  }
}

// Clear history
document.getElementById('clearHistory').addEventListener('click', async () => {
  try {
    await chrome.storage.local.set({ bookmarkHistory: [] });
    await updateHistory();
  } catch (error) {
    console.error('Error clearing history:', error);
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="history-item">Unable to clear history</div>';
  }
});

// Initialize history display when popup opens
document.addEventListener('DOMContentLoaded', updateHistory);

document.getElementById('bookmarkAll').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Bookmarking tabs...';
  statusDiv.className = '';

  try {
    // Get all windows
    const windows = await chrome.windows.getAll({ populate: true });
    let totalTabs = 0;
    let bookmarkedTabs = 0;

    // Create a folder for this batch of bookmarks
    const folder = await chrome.bookmarks.create({
      title: `All Tabs - ${new Date().toLocaleString()}`
    });

    // Get the folder's parent to show its location
    const parentFolder = await chrome.bookmarks.getSubTree(folder.parentId);
    const folderPath = parentFolder[0].title;

    // Process each window
    for (const window of windows) {
      if (window.tabs) {
        totalTabs += window.tabs.length;
        
        // Bookmark each tab
        for (const tab of window.tabs) {
          if (tab.url && !tab.url.startsWith('chrome://')) {
            await chrome.bookmarks.create({
              parentId: folder.id,
              title: tab.title,
              url: tab.url
            });
            bookmarkedTabs++;
          }
        }
      }
    }

    // Add to history
    await addToHistory(bookmarkedTabs, folder.title);

    statusDiv.innerHTML = `
      <span class="success">Successfully bookmarked ${bookmarkedTabs} tabs!</span><br>
      Folder name: "${folder.title}"<br>
      Location: ${folderPath} > ${folder.title}
    `;
  } catch (error) {
    console.error('Error bookmarking tabs:', error);
    statusDiv.innerHTML = `<span class="error">Error: ${error.message}</span>`;
  }
}); 