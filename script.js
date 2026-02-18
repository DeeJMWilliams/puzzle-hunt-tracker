// Section color mapping
const sectionColors = {
    'playlist-setup': '#8e44ad',
    'superbowl-ad': '#3498db',
    'bank-video': '#e74c3c',
    'gifts': '#2ecc71',
    'yt-tiktok': '#f39c12',
    'hunt-site': '#1abc9c',
    'lone-shark': '#9b59b6',
    'crossword': '#34495e',
    'by-car': '#e67e22',
    'by-horse': '#16a085',
    'by-plane': '#c0392b'
};

let map;
let markers = [];
let puzzlesData = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    initMap();
    renderPuzzles();
    setupFilters();
});

// Load puzzle data
async function loadData() {
    const response = await fetch('data.json');
    const data = await response.json();
    puzzlesData = data.stages;
}

// Initialize Leaflet map
function initMap() {
    map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    updateMapMarkers();
}

// Create custom marker icon
function createMarkerIcon(color, confidence) {
    const size = confidence === 100 ? 14 : confidence >= 50 ? 12 : 10;
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker" style="background-color: ${color}; width: ${size}px; height: ${size}px;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
}

// Get confidence category
function getConfidenceCategory(confidence) {
    if (confidence === 100) return 'high';
    if (confidence >= 90) return 'high';
    if (confidence >= 50) return 'medium';
    if (confidence >= 1) return 'low';
    return 'none';
}

// Update map markers based on filters
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Get filter states
    const showHigh = document.getElementById('filter-high').checked;
    const showMedium = document.getElementById('filter-medium').checked;
    const showLow = document.getElementById('filter-low').checked;
    
    const activeSections = new Set();
    document.querySelectorAll('.section-filter:checked').forEach(checkbox => {
        activeSections.add(checkbox.value);
    });
    
    // Add markers for filtered puzzles
    puzzlesData.forEach(stage => {
        stage.sections.forEach(section => {
            if (activeSections.size > 0 && !activeSections.has(section.id)) {
                return;
            }
            
            section.puzzles.forEach(puzzle => {
                if (!puzzle.location || !puzzle.answer) return;
                
                const confCategory = getConfidenceCategory(puzzle.confidence);
                
                // Apply confidence filter
                if (confCategory === 'high' && !showHigh) return;
                if (confCategory === 'medium' && !showMedium) return;
                if (confCategory === 'low' && !showLow) return;
                
                const color = sectionColors[section.id] || '#666';
                const icon = createMarkerIcon(color, puzzle.confidence);
                
                const marker = L.marker([puzzle.location.lat, puzzle.location.lng], { icon })
                    .bindPopup(`
                        <strong>${puzzle.name}</strong><br>
                        <em>${puzzle.answer}</em><br>
                        Confidence: ${puzzle.confidence}%<br>
                        Section: ${section.name}
                    `)
                    .addTo(map);
                
                markers.push(marker);
            });
        });
    });
    
    // Fit bounds if there are markers
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Render puzzles list
function renderPuzzles() {
    const container = document.getElementById('puzzles-list');
    
    puzzlesData.forEach(stage => {
        const stageDiv = document.createElement('div');
        stageDiv.className = 'stage';
        
        const stageTitle = document.createElement('h2');
        stageTitle.className = 'stage-title';
        stageTitle.textContent = stage.name;
        stageDiv.appendChild(stageTitle);
        
        stage.sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'section';
            
            const solved = section.puzzles.filter(p => p.status === 'solved').length;
            const confident = section.puzzles.filter(p => p.confidence >= 90).length;
            const total = section.puzzles.length;
            
            sectionDiv.innerHTML = `
                <div class="section-header">
                    <h3 class="section-title">${section.name}</h3>
                    <div class="section-stats">${solved}/${total} solved, ${confident}/${total} confident</div>
                </div>
            `;
            
            section.puzzles.forEach(puzzle => {
                const puzzleDiv = createPuzzleElement(puzzle, section.id);
                sectionDiv.appendChild(puzzleDiv);
            });
            
            stageDiv.appendChild(sectionDiv);
        });
        
        container.appendChild(stageDiv);
    });
}

// Create puzzle element
function createPuzzleElement(puzzle, sectionId) {
    const div = document.createElement('div');
    div.className = `puzzle ${puzzle.status}`;
    
    const confBadge = getConfidenceBadge(puzzle.confidence);
    const statusBadge = puzzle.status === 'solved' ? 'Solved' : 'Unsolved';
    
    const answer = puzzle.answer 
        ? `<div class="puzzle-answer">${puzzle.answer}</div>`
        : `<div class="puzzle-answer pending">Answer pending</div>`;
    
    const explanationId = `exp-${sectionId}-${puzzle.id}`;
    
    let explanationHtml = '';
    if (puzzle.explanation) {
        if (puzzle.status === 'solved') {
            explanationHtml = `
                <button class="toggle-explanation" onclick="toggleExplanation('${explanationId}')">
                    Show explanation
                </button>
                <div id="${explanationId}" class="explanation-content">
                    <div class="puzzle-explanation">${puzzle.explanation}</div>
                </div>
            `;
        } else {
            explanationHtml = `<div class="puzzle-explanation">${puzzle.explanation}</div>`;
        }
    }
    
    let hintsHtml = '';
    if (puzzle.hints && puzzle.hints.length > 0) {
        hintsHtml = `
            <div class="puzzle-hints">
                <h4>Hints:</h4>
                <ul>
                    ${puzzle.hints.map(hint => `<li>${hint}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    div.innerHTML = `
        <div class="puzzle-header">
            <div class="puzzle-name">${puzzle.name}</div>
            <div class="puzzle-badges">
                <span class="badge badge-status ${puzzle.status}">${statusBadge}</span>
                <span class="badge badge-confidence ${confBadge.class}">${confBadge.text}</span>
            </div>
        </div>
        ${answer}
        ${explanationHtml}
        ${hintsHtml}
    `;
    
    return div;
}

// Get confidence badge info
function getConfidenceBadge(confidence) {
    if (confidence === 100) {
        return { text: '100%', class: 'conf-100' };
    } else if (confidence >= 90) {
        return { text: `${confidence}% (High)`, class: 'conf-high' };
    } else if (confidence >= 50) {
        return { text: `${confidence}% (Medium)`, class: 'conf-medium' };
    } else if (confidence >= 1) {
        return { text: `${confidence}% (Low)`, class: 'conf-low' };
    } else {
        return { text: 'Unknown', class: '' };
    }
}

// Toggle explanation visibility
function toggleExplanation(id) {
    const element = document.getElementById(id);
    const button = element.previousElementSibling;
    
    element.classList.toggle('visible');
    button.textContent = element.classList.contains('visible') 
        ? 'Hide explanation' 
        : 'Show explanation';
}

// Setup filter controls
function setupFilters() {
    // Create section filter checkboxes
    const sectionFiltersDiv = document.getElementById('section-filters');
    const sections = new Map();
    
    puzzlesData.forEach(stage => {
        stage.sections.forEach(section => {
            sections.set(section.id, section.name);
        });
    });
    
    sections.forEach((name, id) => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'section-filter';
        checkbox.value = id;
        checkbox.checked = true;
        checkbox.addEventListener('change', updateMapMarkers);
        
        const colorBox = document.createElement('span');
        colorBox.style.display = 'inline-block';
        colorBox.style.width = '12px';
        colorBox.style.height = '12px';
        colorBox.style.backgroundColor = sectionColors[id] || '#666';
        colorBox.style.marginRight = '6px';
        colorBox.style.borderRadius = '2px';
        
        label.appendChild(checkbox);
        label.appendChild(colorBox);
        label.appendChild(document.createTextNode(name));
        sectionFiltersDiv.appendChild(label);
    });
    
    // Add event listeners for confidence filters
    document.getElementById('filter-high').addEventListener('change', updateMapMarkers);
    document.getElementById('filter-medium').addEventListener('change', updateMapMarkers);
    document.getElementById('filter-low').addEventListener('change', updateMapMarkers);
}

// Make toggleExplanation globally accessible
window.toggleExplanation = toggleExplanation;
