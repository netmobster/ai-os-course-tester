/* ===== SCROLL-DRIVEN TABS ===== */
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = [];
let panelIdx = 0;
while (document.getElementById('panel-' + panelIdx)) {
  panels.push(document.getElementById('panel-' + panelIdx));
  panelIdx++;
}
const TAB_COUNT = panels.length;
const progressBar = document.getElementById('progressBar');
let isScrolling = false;

if (TAB_COUNT > 0 && progressBar) {
  /* Active tab via IntersectionObserver */
  const observer = new IntersectionObserver((entries) => {
    if (isScrolling) return;
    let best = null;
    let bestRatio = 0;
    entries.forEach((entry) => {
      if (entry.intersectionRatio > bestRatio) {
        bestRatio = entry.intersectionRatio;
        best = entry.target;
      }
    });
    if (best) {
      const idx = panels.indexOf(best);
      if (idx !== -1) setActiveTab(idx);
    }
  }, { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] });

  panels.forEach((p) => observer.observe(p));
}

function setActiveTab(index) {
  tabBtns.forEach((btn, i) => btn.classList.toggle('active', i === index));
}

/* Click scrolls to panel */
tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const idx = parseInt(btn.dataset.tab, 10);
    if (!panels[idx]) return;
    isScrolling = true;
    setActiveTab(idx);
    const headerHeight = 48 + 8;
    const top = panels[idx].getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top: top, behavior: 'smooth' });
    setTimeout(() => { isScrolling = false; }, 800);
  });
});

/* Scroll progress bar */
function updateProgress() {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = Math.min(pct, 100) + '%';
}

/* Update active tab on scroll */
function updateActiveOnScroll() {
  if (isScrolling || TAB_COUNT === 0) return;
  const headerHeight = 48 + 16;
  let activeIdx = 0;
  for (let i = panels.length - 1; i >= 0; i--) {
    if (panels[i].getBoundingClientRect().top <= headerHeight + 50) {
      activeIdx = i;
      break;
    }
  }
  setActiveTab(activeIdx);
}

window.addEventListener('scroll', () => {
  updateProgress();
  updateActiveOnScroll();
}, { passive: true });

updateProgress();

/* ===== CHECKLIST ===== */
const checklistItems = document.querySelectorAll('.checklist-item');
const markCompleteBtn = document.getElementById('markCompleteBtn');
const checkStates = Array.from(checklistItems).map(() => false);

function updateChecklist() {
  if (markCompleteBtn) {
    markCompleteBtn.classList.toggle('visible', checkStates.length > 0 && checkStates.every(Boolean));
  }
}

checklistItems.forEach((item) => {
  item.addEventListener('click', () => {
    const idx = parseInt(item.dataset.check, 10);
    checkStates[idx] = !checkStates[idx];
    item.classList.toggle('checked', checkStates[idx]);
    updateChecklist();
  });
});

/* ===== MODAL ===== */
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');

function openModal() { if (modalBackdrop) modalBackdrop.classList.add('open'); }
function closeModal() { if (modalBackdrop) modalBackdrop.classList.remove('open'); }

if (markCompleteBtn) markCompleteBtn.addEventListener('click', openModal);
const openModalBtn = document.getElementById('openModalBtn');
if (openModalBtn) openModalBtn.addEventListener('click', openModal);
if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });

/* ===== COPY BUTTONS ===== */
function wireCopyButton(btnId, blockId) {
  const btn = document.getElementById(btnId);
  const block = document.getElementById(blockId);
  if (btn && block) {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy to clipboard \u2192'; }, 2000);
      });
    });
  }
}

/* Unit 1 copy block */
wireCopyButton('copyBtn', 'copyBlock');

/* Unit 2 copy blocks */
wireCopyButton('copyExcavation', 'excavationPrompt');
wireCopyButton('copyModal', 'modalCopyBlock');

/* Unit 6 second copy block */
wireCopyButton('copyBtn2', 'copyBlock2');

/* ===== FONT SIZE CONTROL (postMessage from index) ===== */
let currentFontSize = 1.05;
const PROSE_SELECTORS = [
  '.prose', '.prose-muted', '.content-area p',
  '.num-item-desc', '.worked-card-annotation',
  '.callout', '.insight-quote',
  '.exercise-block p', '.exercise-block ol'
];

function applyFontSize() {
  PROSE_SELECTORS.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.style.fontSize = currentFontSize + 'rem';
    });
  });
}

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'fontSize') {
    currentFontSize = Math.max(0.5, currentFontSize + (e.data.delta * 0.1));
    applyFontSize();
  }
});

/* ===== UNIT READY SIGNAL ===== */
window.addEventListener('load', () => {
  if (window.UNIT_DATA && window.UNIT_DATA.unit) {
    parent.postMessage({ type: 'unitReady', unit: window.UNIT_DATA.unit }, '*');
  }
});

/* ===== CONTINUE BUTTON (navigate to next unit) ===== */
const continueBtn = document.getElementById('continueBtn');
if (continueBtn) {
  if (window.UNIT_DATA && window.UNIT_DATA.nextUnit) {
    continueBtn.addEventListener('click', () => {
      parent.postMessage({ type: 'navigate', target: window.UNIT_DATA.nextUnit }, '*');
    });
  } else {
    continueBtn.classList.add('disabled');
  }
}