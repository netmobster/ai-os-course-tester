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

function updateProgress() {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = Math.min(pct, 100) + '%';
}

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

/* ===== MODAL — bubble to parent so it escapes the iframe ===== */
// Collect modal content once so parent can render it
function getModalHTML() {
  const modal = document.getElementById('modal');
  return modal ? modal.innerHTML : '';
}

function openModal() {
  // Try to bubble to parent first
  if (window.parent && window.parent !== window) {
    const modal = document.getElementById('modal');
    window.parent.postMessage({
      type: 'openModal',
      html: modal ? modal.innerHTML : '',
      unit: window.UNIT_DATA ? window.UNIT_DATA.unit : null
    }, '*');
  } else {
    // Fallback: render inline (standalone page)
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.classList.add('open');
  }
}

function closeModal() {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: 'closeModal' }, '*');
  } else {
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  }
}

const modalClose = document.getElementById('modalClose');
if (markCompleteBtn) markCompleteBtn.addEventListener('click', openModal);
const openModalBtn = document.getElementById('openModalBtn');
if (openModalBtn) openModalBtn.addEventListener('click', openModal);
if (modalClose) modalClose.addEventListener('click', closeModal);

// Also handle the local backdrop click for standalone mode
const modalBackdrop = document.getElementById('modalBackdrop');
if (modalBackdrop) modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});

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

wireCopyButton('copyBtn', 'copyBlock');
wireCopyButton('copyExcavation', 'excavationPrompt');
wireCopyButton('copyModal', 'modalCopyBlock');
wireCopyButton('copyBtn2', 'copyBlock2');

/* ===== FONT SIZE CONTROL ===== */
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
  // Parent telling us to close local modal (standalone fallback)
  if (e.data && e.data.type === 'closeModalLocal') {
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  }
});

/* ===== UNIT READY SIGNAL ===== */
window.addEventListener('load', () => {
  if (window.UNIT_DATA && window.UNIT_DATA.unit) {
    parent.postMessage({ type: 'unitReady', unit: window.UNIT_DATA.unit }, '*');
  }
});

/* ===== CONTINUE BUTTON ===== */
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
