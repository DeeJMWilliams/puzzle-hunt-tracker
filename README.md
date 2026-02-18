# Puzzle Hunt Progress Tracker

A clean, interactive tracker for puzzle hunt progress with an integrated location map.

## Features

- **Puzzle List**: Organized by stage and section with solve status, answers, confidence levels, and explanations
- **Interactive Map**: Leaflet-powered map showing all solved puzzle locations
- **Filtering**: Filter map markers by confidence level and section
- **Collapsible Explanations**: Solved puzzles show explanations via toggle for cleaner view
- **Image Support**: Structure ready for adding puzzle images (see below)

## Setup for GitHub Pages

1. **Create a new repository** on GitHub (e.g., `puzzle-hunt-tracker`)

2. **Clone and add files**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/puzzle-hunt-tracker.git
   cd puzzle-hunt-tracker
   # Copy all files (index.html, styles.css, script.js, data.json, README.md)
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: main, folder: / (root)
   - Save

4. **Access your site** at: `https://YOUR-USERNAME.github.io/puzzle-hunt-tracker/`

## Updating Puzzle Data

All puzzle information is stored in `data.json`. To update:

1. Edit `data.json` with your changes
2. Commit and push:
   ```bash
   git add data.json
   git commit -m "Update puzzle data"
   git push origin main
   ```

The site will automatically update within a few minutes.

### Data Structure

Each puzzle has the following fields:

```json
{
  "id": "unique-id",
  "name": "Puzzle Name",
  "status": "solved" or "unsolved",
  "answer": "ANSWER TEXT" or null,
  "confidence": 0-100,
  "explanation": "How it was solved",
  "location": {"lat": 0.0, "lng": 0.0} or null,
  "hints": ["hint 1", "hint 2"]
}
```

**Confidence levels:**
- 100%: Completely certain
- 90-99%: High confidence
- 50-89%: Medium confidence
- 1-49%: Low confidence
- 0: No answer yet

## Adding Images to Puzzles

To add images:

1. **Create an `images` folder** in your repository
2. **Add puzzle images** with descriptive filenames (e.g., `vault-door.jpg`)
3. **Update data.json** to include image references:
   ```json
   {
     "id": "sb-vault-door",
     "name": "Vault Door",
     "image": "images/vault-door.jpg",
     ...
   }
   ```
4. **Update script.js** to display images in puzzle elements (add after answer):
   ```javascript
   const imageHtml = puzzle.image 
     ? `<img src="${puzzle.image}" alt="${puzzle.name}" style="max-width: 100%; margin-top: 10px; border-radius: 4px;">`
     : '';
   ```

## Customization

### Colors

Section colors are defined in `script.js` at the top:
```javascript
const sectionColors = {
    'playlist-setup': '#8e44ad',
    'superbowl-ad': '#3498db',
    // etc.
};
```

### Map Settings

Default map view can be adjusted in `script.js`:
```javascript
map = L.map('map').setView([20, 0], 2); // [lat, lng], zoom
```

## File Structure

```
puzzle-hunt-tracker/
├── index.html          # Main HTML structure
├── styles.css          # Styles
├── script.js           # Map and puzzle display logic
├── data.json           # Puzzle data
└── README.md           # This file
```

## Browser Compatibility

Works in all modern browsers. Requires JavaScript enabled.
