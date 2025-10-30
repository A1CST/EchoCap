let observer = null;
let lastTitle = "";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Click play button
  if (msg.action === "clickPlay") {
    const btn = document.querySelector('button[title="Play/Pause"] svg.lucide-play');
    if (btn) btn.closest("button").click();
    sendResponse({ clicked: !!btn });
  }

  // Start watching song title
  if (msg.action === "watchSong") {
    const target = document.querySelector("h1.truncate-1-line");
    if (!target) return sendResponse({ watching: false });

    lastTitle = target.textContent.trim();
    observer = new MutationObserver(() => {
      const current = target.textContent.trim();
      if (current !== lastTitle && current.length > 0) {
        lastTitle = current;
        chrome.runtime.sendMessage({ action: "songChanged" });
      }
    });
    observer.observe(target, { childList: true, characterData: true, subtree: true });
    sendResponse({ watching: true });
  }

  // Stop watching
  if (msg.action === "stopWatch" && observer) observer.disconnect();
});
