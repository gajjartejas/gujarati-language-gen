/**
 * app.js: Core coordinator for Gujarati Font Stroke Animator.
 * Manages category filters, Barakhadi consonant sub-bar, search, character selection,
 * and keyboard navigation.
 */

class App {
  constructor() {
    this.catalog = [];
    this.filteredCatalog = [];
    this.currentCategory = 'kakko'; // Default to kakko
    this.currentConsonantGroup = '1_k'; // Default barakhadi group
    this.currentChar = null;
    this.searchQuery = '';
  }

  async init() {
    // 1. Initialize Managers
    window.soundManager.initUI();
    window.stageManager.initUI();

    // 2. Load Catalog
    if (window.GUJARATI_CATALOG && window.GUJARATI_CATALOG.length > 0) {
      this.catalog = window.GUJARATI_CATALOG;
    } else {
      try {
        const res = await fetch('assets/catalog.json');
        this.catalog = await res.json();
      } catch (e) {
        console.error('Failed to load catalog.json:', e);
      }
    }

    // 3. Setup UI listeners
    this.setupCategoryTabs();
    this.setupSearchBar();
    this.setupKeyboardNavigation();

    // 4. Initial Render (supports ?cat= query param)
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam && ['kakko', 'barakhadi', 'numbers', 'all'].includes(catParam)) {
      this.setCategory(catParam);
    } else {
      this.applyFilters();
      if (this.filteredCatalog.length > 0) {
        this.selectCharacter(this.filteredCatalog[0], false);
      }
    }
  }

  setupCategoryTabs() {
    document.querySelectorAll('.cat-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-cat');
        this.setCategory(cat);
      });
    });
  }

  setCategory(category) {
    this.currentCategory = category;
    document.querySelectorAll('.cat-tab').forEach((tab) => {
      tab.classList.toggle('active', tab.getAttribute('data-cat') === category);
    });

    // Show/hide Barakhadi consonant sub-bar
    const barakhadiBar = document.getElementById('barakhadi-bar');
    if (barakhadiBar) {
      barakhadiBar.style.display = category === 'barakhadi' ? 'flex' : 'none';
      if (category === 'barakhadi' && barakhadiBar.children.length === 0) {
        this.renderBarakhadiConsonantBar();
      }
    }

    this.applyFilters();
    if (this.filteredCatalog.length > 0) {
      this.selectCharacter(this.filteredCatalog[0], true);
    }
  }

  renderBarakhadiConsonantBar() {
    const bar = document.getElementById('barakhadi-bar');
    if (!bar) return;
    bar.innerHTML = '';

    // Get unique base consonant groups
    const groups = [];
    const seen = new Set();
    this.catalog
      .filter((c) => c.category === 'barakhadi')
      .forEach((c) => {
        if (!seen.has(c.group)) {
          seen.add(c.group);
          groups.push({ group: c.group, base_char: c.base_char, en: c.group_en });
        }
      });

    groups.forEach((g) => {
      const chip = document.createElement('button');
      chip.className = 'consonant-chip' + (g.group === this.currentConsonantGroup ? ' active' : '');
      chip.innerText = g.base_char;
      chip.title = `${g.base_char} (${g.en})`;
      chip.onclick = () => {
        this.currentConsonantGroup = g.group;
        document.querySelectorAll('.consonant-chip').forEach((c) => {
          c.classList.toggle('active', c === chip);
        });
        this.applyFilters();
        if (this.filteredCatalog.length > 0) {
          this.selectCharacter(this.filteredCatalog[0], true);
        }
      };
      bar.appendChild(chip);
    });
  }

  setupSearchBar() {
    const input = document.getElementById('search-input');
    if (!input) return;

    input.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.applyFilters();
    });
  }

  applyFilters() {
    let list = this.catalog;

    // Filter by Category
    if (this.currentCategory !== 'all') {
      list = list.filter((c) => c.category === this.currentCategory);
    }

    // If Barakhadi category and no search, filter by current consonant group
    if (this.currentCategory === 'barakhadi' && !this.searchQuery) {
      list = list.filter((c) => c.group === this.currentConsonantGroup);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      list = list.filter((c) => {
        const charMatch = c.char && c.char.includes(this.searchQuery);
        const enMatch = c.en && c.en.toLowerCase().includes(this.searchQuery);
        const nameMatch = c.name_gu && c.name_gu.includes(this.searchQuery);
        const nameEnMatch = c.name_en && c.name_en.toLowerCase().includes(this.searchQuery);
        const numMatch = c.num !== undefined && String(c.num) === this.searchQuery;
        return charMatch || enMatch || nameMatch || nameEnMatch || numMatch;
      });
    }

    this.filteredCatalog = list;
    this.renderCharacterGrid();
  }

  renderCharacterGrid() {
    const grid = document.getElementById('char-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (this.filteredCatalog.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <span class="icon">🔍</span>
          <p>No characters match "${this.searchQuery}"</p>
        </div>
      `;
      return;
    }

    this.filteredCatalog.forEach((item) => {
      const btn = document.createElement('button');
      const isSelected = this.currentChar && this.currentChar.id === item.id;
      btn.className = 'char-btn' + (isSelected ? ' active' : '');

      let subText = item.en || '';
      if (item.category === 'numbers') {
        subText = `${item.num} (${item.name_en})`;
      }

      btn.innerHTML = `
        <span class="sound-indicator">🔊</span>
        <span class="char-glyph">${item.char}</span>
        <span class="char-sub">${subText}</span>
      `;

      btn.title = `${item.char} - ${subText}`;
      btn.onclick = () => this.selectCharacter(item, true);

      grid.appendChild(btn);
    });
  }

  selectCharacter(item, playSound = true) {
    this.currentChar = item;

    // Update active state in grid buttons
    document.querySelectorAll('.char-btn').forEach((btn) => {
      const glyph = btn.querySelector('.char-glyph');
      btn.classList.toggle('active', glyph && glyph.innerText === item.char);
    });

    // Update Banner
    this.updateHeaderBanner(item);

    // Load SVG into Stages
    window.stageManager.loadCharacter(item);

    // Play Kano Pronunciation Sound
    if (playSound && item.audio) {
      window.soundManager.playAudio(item.audio);
    }
  }

  updateHeaderBanner(item) {
    const glyphEl = document.getElementById('banner-glyph');
    const titleEl = document.getElementById('banner-title');
    const subtitleEl = document.getElementById('banner-subtitle');
    const tagCat = document.getElementById('banner-tag-cat');
    const tagStrokes = document.getElementById('banner-tag-strokes');

    if (glyphEl) glyphEl.innerText = item.char;

    if (titleEl) {
      let title = item.char;
      if (item.en) title += ` (${item.en})`;
      if (item.name_gu) title += ` - ${item.name_gu}`;
      titleEl.innerText = title;
    }

    if (subtitleEl) {
      if (item.category === 'numbers') {
        subtitleEl.innerText = `Gujarati Numeral: ${item.num} (${item.name_en})`;
      } else if (item.category === 'barakhadi') {
        subtitleEl.innerText = `Barakhadi: Base '${item.base_char}' with Vowel '${item.vowel_sign || "A"}'`;
      } else {
        subtitleEl.innerText = `Kakko ${item.type === 'vowel' ? 'Vowel (સ્વર)' : 'Consonant (વ્યંજન)'}`;
      }
    }

    if (tagCat) {
      tagCat.innerText = item.category.toUpperCase();
    }
    if (tagStrokes) {
      tagStrokes.innerText = `${item.stroke_count || 1} Stroke${(item.stroke_count || 1) > 1 ? 's' : ''}`;
    }
  }

  setupKeyboardNavigation() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault();
        this.stepCharacter(1);
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.stepCharacter(-1);
      } else if (e.code === 'Space') {
        e.preventDefault();
        window.stageManager.replay();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        window.soundManager.replayCurrent();
      }
    });
  }

  stepCharacter(delta) {
    if (!this.currentChar || this.filteredCatalog.length === 0) return;
    const idx = this.filteredCatalog.findIndex((c) => c.id === this.currentChar.id);
    if (idx === -1) return;

    let nextIdx = (idx + delta + this.filteredCatalog.length) % this.filteredCatalog.length;
    this.selectCharacter(this.filteredCatalog[nextIdx], true);

    // Scroll into view
    const buttons = document.querySelectorAll('.char-btn');
    if (buttons[nextIdx]) {
      buttons[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

window.app = new App();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
