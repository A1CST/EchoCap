let recorder, chunks = [];

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

document.getElementById("start").onclick = async () => {
  const tab = await getActiveTab();

  // Inject content.js manually
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  // Now it's safe to send the message
  chrome.tabs.sendMessage(tab.id, { action: "clickPlay" });

  chrome.tabCapture.capture({ audio: true, video: false }, stream => {
    if (!stream) return;
    recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({
        url,
        filename: `tab_audio_${Date.now()}.webm`
      });
      stream.getTracks().forEach(t => t.stop());
      chrome.tabs.sendMessage(tab.id, { action: "stopWatch" });
    };
    recorder.start();
    chrome.tabs.sendMessage(tab.id, { action: "watchSong" });
  });
};


chrome.runtime.onMessage.addListener(msg => {
  if (msg.action === "songChanged" && recorder && recorder.state === "recording") {
    recorder.stop();
  }
});

document.getElementById("stop").onclick = () => {
  if (recorder && recorder.state !== "inactive") recorder.stop();
};
chrome.runtime.onMessage.addListener(msg => {
  if (msg.action === "songChanged" && recorder && recorder.state === "recording") {
    recorder.stop();
  }
});