# Chrome Web Store Helpers

A collection of developer tools and scripts for Chrome Web Store and Chrome extension development.

## Image Replacer DevTools Script

A DevTools script for Chrome Web Store pages that helps developers preview and test listing changes before publishing.

### Demo

<video src="imgs/cws-listing-img-swap-demo.mp4" controls width="100%"></video>

### Core Features

- **Image Swap**: Replace listing images to preview how they'll look on the store page
- **Image Download**: Download images with smart naming (`{appName}_{appId}.{ext}`)
- **Text Editing**: Make listing text editable to preview how it will look like

### Usage

1. Open Chrome DevTools (F12) on a Chrome Web Store page
2. Navigate to the Console tab
3. Copy and paste the contents of `scripts/cws-assets-preview.js`
4. Press Enter to execute
5. The floating panel will appear in the top-left corner with all discovered images

**💡 Tip**: Save this script as a DevTools Snippet for quick access:
1. Open DevTools → Sources tab → Snippets
2. Click "+ New snippet"
3. Paste the script code and save (Ctrl+S / Cmd+S)
4. Right-click the snippet → Run to execute anytime

Learn more about [DevTools Snippets](https://developer.chrome.com/docs/devtools/javascript/snippets/)
