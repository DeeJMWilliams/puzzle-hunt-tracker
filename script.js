// Section color mapping — Stage 1: green/teal family, Stage 2: blue-purple family
const sectionColors = {
    // Stage 1
    'playlist-setup': '#0a6b5a',
    'superbowl-ad':   '#1a9e8a',
    'bank-video':     '#25c89c',
    'gifts':          '#1aad5e',
    'yt-tiktok':      '#2ecc71',
    'hunt-site':      '#239b56',
    'lone-shark':     '#148f77',
    'crossword':      '#0e7a50',
    // Stage 2
    'by-car':   '#4a52d8',
    'by-horse': '#7d35b0',
    'by-plane': '#b039c4'
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

// Get ring color based on confidence
function getConfidenceRingColor(confidence) {
    if (confidence >= 90) return '#2ecc71';  // green
    if (confidence >= 50) return '#f1c40f';  // yellow
    return '#e74c3c';                         // red
}

// Create custom marker icon
function createMarkerIcon(color, confidence) {
    const size = 12;
    const ringColor = getConfidenceRingColor(confidence);
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker" style="background-color: ${color}; width: ${size}px; height: ${size}px; border-color: ${ringColor};"></div>`,
        iconSize: [size + 4, size + 4],
        iconAnchor: [(size + 4) / 2, (size + 4) / 2]
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
            if (!activeSections.has(section.id)) {
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

            const header = document.createElement('div');
            header.className = 'section-header';
            header.innerHTML = `
                <div class="section-header-left">
                    <span class="section-arrow">▾</span>
                    <h3 class="section-title">${section.name}</h3>
                </div>
                <div class="section-stats">${solved}/${total} solved, ${confident}/${total} confident</div>
            `;
            header.addEventListener('click', () => {
                sectionDiv.classList.toggle('collapsed');
            });
            sectionDiv.appendChild(header);

            const puzzlesDiv = document.createElement('div');
            puzzlesDiv.className = 'section-puzzles';

            section.puzzles.forEach((puzzle, idx) => {
                const namePrefix = section.id === 'bank-video' ? `SCREEN ${idx + 1} / ` : '';
                const puzzleDiv = createPuzzleElement(puzzle, section.id, namePrefix);
                puzzlesDiv.appendChild(puzzleDiv);
            });

            sectionDiv.appendChild(puzzlesDiv);
            stageDiv.appendChild(sectionDiv);
        });

        container.appendChild(stageDiv);
    });
}

// Create puzzle element
function createPuzzleElement(puzzle, sectionId, namePrefix = '') {
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
        const hintsId = `hints-${sectionId}-${puzzle.id}`;
        const hideHints = puzzle.confidence >= 90;
        hintsHtml = hideHints ? `
            <button class="toggle-explanation" onclick="toggleExplanation('${hintsId}')">
                Show hints
            </button>
            <div id="${hintsId}" class="explanation-content">
                <div class="puzzle-hints">
                    <ul>${puzzle.hints.map(hint => `<li>${hint}</li>`).join('')}</ul>
                </div>
            </div>
        ` : `
            <div class="puzzle-hints">
                <h4>Hints:</h4>
                <ul>${puzzle.hints.map(hint => `<li>${hint}</li>`).join('')}</ul>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="puzzle-header">
            <div class="puzzle-name">${namePrefix ? `<span class="screen-prefix">${namePrefix}</span>` : ''}${puzzle.name}</div>
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
    puzzlesData.forEach(stage => {
        const filterDiv = document.getElementById(`section-filters-${stage.id}`);
        const stageCheckboxId = `filter-${stage.id}`;

        stage.sections.forEach(section => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'section-filter';
            checkbox.value = section.id;
            checkbox.dataset.stage = stage.id;
            checkbox.checked = true;
            checkbox.addEventListener('change', () => {
                updateStageCheckbox(stageCheckboxId, stage.id);
                updateMapMarkers();
            });

            const colorBox = document.createElement('span');
            colorBox.className = 'filter-color-box';
            colorBox.style.backgroundColor = sectionColors[section.id] || '#666';

            label.appendChild(checkbox);
            label.appendChild(colorBox);
            label.appendChild(document.createTextNode(section.name));
            filterDiv.appendChild(label);
        });

        document.getElementById(stageCheckboxId).addEventListener('change', function() {
            toggleStage(stage.id, this.checked);
        });
    });

    // Confidence filter listeners
    ['filter-high', 'filter-medium', 'filter-low'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateMapMarkers);
    });
}

// Toggle all sections within a stage
function toggleStage(stageId, checked) {
    document.querySelectorAll(`.section-filter[data-stage="${stageId}"]`).forEach(cb => {
        cb.checked = checked;
    });
    updateMapMarkers();
}

// Sync stage checkbox state (checked / unchecked / indeterminate)
function updateStageCheckbox(checkboxId, stageId) {
    const stageCheckbox = document.getElementById(checkboxId);
    const sectionCheckboxes = document.querySelectorAll(`.section-filter[data-stage="${stageId}"]`);
    const checkedCount = Array.from(sectionCheckboxes).filter(cb => cb.checked).length;

    if (checkedCount === 0) {
        stageCheckbox.checked = false;
        stageCheckbox.indeterminate = false;
    } else if (checkedCount === sectionCheckboxes.length) {
        stageCheckbox.checked = true;
        stageCheckbox.indeterminate = false;
    } else {
        stageCheckbox.indeterminate = true;
    }
}

// Make toggleExplanation globally accessible
window.toggleExplanation = toggleExplanation;
