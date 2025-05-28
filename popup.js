document.getElementById('bookmarkAll').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = 'Bookmarking tabs...';

  try {
    // Get all windows
    const windows = await chrome.windows.getAll({ populate: true });
    let totalTabs = 0;
    let bookmarkedTabs = 0;

    // Create a folder for this batch of bookmarks
    const folder = await chrome.bookmarks.create({
      title: `All Tabs - ${new Date().toLocaleString()}`
    });

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

    statusDiv.textContent = `Successfully bookmarked ${bookmarkedTabs} tabs!`;
  } catch (error) {
    statusDiv.textContent = `Error: ${error.message}`;
  }
}); 