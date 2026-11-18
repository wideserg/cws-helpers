# Chrome Web Store Helpers

A collection of developer tools and scripts for Chrome Web Store and Chrome extension development.

## How to run

Any script here runs in the page context via Chrome DevTools:

**Console**
1. Open the target CWS page
2. DevTools → Console (F12)
3. Paste the script → Enter

**Snippets** (recommended)
1. DevTools → Sources → Snippets → New snippet
2. Paste the script, save (Ctrl+S)
3. Right-click snippet → Run (or Ctrl+Enter)

Docs: [DevTools Snippets](https://developer.chrome.com/docs/devtools/javascript/snippets/)

---

## Image Replacer

`scripts/cws-assets-preview.js`

DevTools script for Chrome Web Store listing pages — preview listing changes before publishing.

### Demo

[cws-listing-img-swap-demo (1).webm](https://github.com/user-attachments/assets/bece6bf8-8037-4772-85fe-3c312bc9437a)

### Features

- **Image Swap**: Replace listing images to preview how they'll look on the store page
- **Image Download**: Download images with smart naming (`{appName}_{appId}.{ext}`)
- **Text Editing**: Make listing text editable to preview how it will look like

### Usage

Run on a Chrome Web Store listing page (Console or Snippet). Floating panel appears top-left with discovered images.

---

## Installs without Romania

`scripts/cws-installs-without-romania.js`

Overlay for **Chrome Web Store Developer Dashboard → Analytics → Installs & uninstalls**.

Subtracts Romania installs from the daily series (fraud / junk traffic filter) and redraws the Installs chart on top of the native one.

### Features

- **Blue line** — installs without Romania
- **Red line** — original totals
- **Overlay ON/OFF** — toggle custom chart vs native
- Hover tooltip + `console.table` day breakdown
- Updates the big total number while overlay is on

### Usage

1. Open DevConsole installs page:
   `chrome.google.com/webstore/devconsole/.../analytics/installs`
2. Run `scripts/cws-installs-without-romania.js` via Console or Snippet
3. Use **Overlay ON/OFF** next to the Installs heading

Change the excluded country by editing `const COUNTRY = 'Romania'` at the top of the script.
