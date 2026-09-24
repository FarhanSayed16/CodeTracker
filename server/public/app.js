const API_URL = '/api';
const GRACE_MS = 2 * 60 * 1000;
const ISSUE_MAX_LEN = 500;
const SNAP_PAD = 16;
const SEARCH_DEBOUNCE_MS = 300;

// ==========================================
// DOM Elements
// ==========================================

// Join Screen
const joinScreen = document.getElementById('join-screen');

// Step 1: Code
const stepCode = document.getElementById('step-code');
const codeInputs = document.querySelectorAll('#code-inputs .code-box');
const codeForm = document.getElementById('code-form');
const codeBtn = document.getElementById('code-btn');
const codeError = document.getElementById('code-error');

// Step 2: Search
const stepSearch = document.getElementById('step-search');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchError = document.getElementById('search-error');
const backToCode = document.getElementById('back-to-code');

// Step 3: PIN
const stepPin = document.getElementById('step-pin');
const pinInputs = document.querySelectorAll('#pin-inputs .pin-box');
const pinForm = document.getElementById('pin-form');
const pinBtn = document.getElementById('pin-btn');
const pinError = document.getElementById('pin-error');
const pinSubtitle = document.getElementById('pin-subtitle');
const selectedStudentInfo = document.getElementById('selected-student-info');
const backToSearch = document.getElementById('back-to-search');

// Widget
const widgetCollapsed = document.getElementById('widget-collapsed');
const widgetExpanded = document.getElementById('widget-expanded');
const minimizeBtn = document.getElementById('minimize-btn');
const closeBtn = document.getElementById('close-btn');
const widgetDragHandle = document.getElementById('widget-drag-handle');
const sessionTitle = document.getElementById('session-title');
const sessionCodeDisplay = document.getElementById('session-code-display');
const taskListContainer = document.getElementById('task-list');
const notificationDot = document.getElementById('notification-dot');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.connection-status span');

// State
let studentToken = null;
let socket = null;
let currentTasks = [];
let openTaskDrawerId = null;
let sessionEnded = false;
let graceTimerId = null;
let currentSessionCode = '';
let selectedStudent = null;
let searchTimer = null;

const STORAGE_KEY = 'codetrack_student_session';

function saveStudentSession(payload) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_) { /* private mode */ }
}

function loadStudentSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function clearStudentSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) { /* ignore */ }
}

async function tryRestoreSession() {
  const saved = loadStudentSession();
  if (!saved?.token) return false;

  try {
    const res = await fetch(`${API_URL}/sessions/student/restore`, {
      headers: { Authorization: `Bearer ${saved.token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      clearStudentSession();
      return false;
    }

    studentToken = saved.token;
    currentSessionCode = data.data.session.sessionCode || saved.sessionCode;
    currentTasks = (data.data.tasks || []).map((t) => {
      const response = (data.data.responses || []).find((r) => r.taskId === t.id);
      return {
        ...t,
        localStatus: response?.status || 'NOT_STARTED',
        localIssueText: response?.issueText || '',
        localDoneTimestamp: null,
      };
    });

    joinScreen.classList.add('hidden');
    widgetCollapsed.classList.remove('hidden');
    applyOffsetToWidgets();
    initWidget(data.data.student.name, currentSessionCode);
    return true;
  } catch (_) {
    clearStudentSession();
    return false;
  }
}

// Attempt restore before showing join (covers mid-lab refresh)
tryRestoreSession();

// ==========================================
// QR ?code= PREFILL
// ==========================================

(function prefillCodeFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) return;
  code.split('').forEach((ch, i) => {
    if (codeInputs[i]) codeInputs[i].value = ch;
  });
})();

// ==========================================
// STEP 1: SESSION CODE
// ==========================================

codeInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
    if (e.target.value.length >= 1 && index < codeInputs.length - 1) {
      codeInputs[index + 1].focus();
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      codeInputs[index - 1].focus();
      codeInputs[index - 1].value = '';
    } else if (e.key === 'ArrowLeft' && index > 0) {
      codeInputs[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < codeInputs.length - 1) {
      codeInputs[index + 1].focus();
    }
  });
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedData = (e.clipboardData || window.clipboardData).getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (pastedData) {
      for (let i = 0; i < pastedData.length; i++) {
        if (codeInputs[i]) codeInputs[i].value = pastedData[i];
      }
      if (pastedData.length >= 6) {
        codeBtn.click();
      } else {
        codeInputs[pastedData.length].focus();
      }
    }
  });
});

codeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  currentSessionCode = Array.from(codeInputs).map(i => i.value).join('').toUpperCase();
  
  if (currentSessionCode.length !== 6) {
    codeError.textContent = 'Please enter a valid 6-character session code.';
    return;
  }

  codeError.textContent = '';
  codeBtn.disabled = true;
  codeBtn.textContent = 'Verifying...';

  // Verify session exists by doing a dummy search
  try {
    const res = await fetch(`${API_URL}/sessions/${currentSessionCode}/students?q=_`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid session code');
    
    // Valid session! Move to Step 2
    showStep('search');
    searchInput.focus();
  } catch (err) {
    codeError.textContent = err.message;
  } finally {
    codeBtn.disabled = false;
    codeBtn.textContent = 'Next →';
  }
});

// ==========================================
// STEP 2: SEARCH (Name/Roll Autocomplete)
// ==========================================

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const query = searchInput.value.trim();
  if (query.length < 2) {
    searchResults.innerHTML = '<div class="search-hint">Type at least 2 characters...</div>';
    return;
  }
  searchResults.innerHTML = '<div class="search-hint">Searching...</div>';
  searchTimer = setTimeout(() => performSearch(query), SEARCH_DEBOUNCE_MS);
});

async function performSearch(query) {
  try {
    searchError.textContent = '';
    const res = await fetch(`${API_URL}/sessions/${currentSessionCode}/students?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed');

    const students = data.data || [];
    if (students.length === 0) {
      searchResults.innerHTML = '<div class="search-hint">No students found. Try different search terms.</div>';
      return;
    }

    searchResults.innerHTML = '';
    students.forEach(student => {
      const item = document.createElement('div');
      item.className = 'search-result-item';

      const nameEl = document.createElement('div');
      nameEl.className = 'student-name';
      appendHighlightedText(nameEl, student.name, query);

      const rollEl = document.createElement('div');
      rollEl.className = 'student-roll';
      rollEl.textContent = student.rollNo;

      item.appendChild(nameEl);
      item.appendChild(rollEl);
      item.addEventListener('click', () => selectStudent(student));
      searchResults.appendChild(item);
    });
  } catch (err) {
    searchError.textContent = err.message;
  }
}

/** Safe highlight without innerHTML (prevents XSS from roster names). */
function appendHighlightedText(container, text, query) {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let start = 0;
  let idx = lower.indexOf(q, start);
  if (idx === -1) {
    container.textContent = text;
    return;
  }
  while (idx !== -1) {
    if (idx > start) {
      container.appendChild(document.createTextNode(text.slice(start, idx)));
    }
    const mark = document.createElement('mark');
    mark.textContent = text.slice(idx, idx + q.length);
    container.appendChild(mark);
    start = idx + q.length;
    idx = lower.indexOf(q, start);
  }
  if (start < text.length) {
    container.appendChild(document.createTextNode(text.slice(start)));
  }
}

function selectStudent(student) {
  selectedStudent = student;
  selectedStudentInfo.textContent = '';
  const nameEl = document.createElement('div');
  nameEl.className = 'selected-name';
  nameEl.textContent = student.name;
  const rollEl = document.createElement('div');
  rollEl.className = 'selected-roll';
  rollEl.textContent = `Roll: ${student.rollNo}`;
  selectedStudentInfo.appendChild(nameEl);
  selectedStudentInfo.appendChild(rollEl);

  if (student.hasPin) {
    pinSubtitle.textContent = 'Enter your 4-digit PIN to verify your identity.';
    pinBtn.textContent = 'Join Session →';
  } else {
    pinSubtitle.textContent = 'Create a 4-digit PIN. You will need this PIN for future sessions.';
    pinBtn.textContent = 'Set PIN & Join →';
  }

  showStep('pin');
  pinInputs[0].focus();
}

backToCode.addEventListener('click', () => {
  showStep('code');
});

// ==========================================
// STEP 3: PIN ENTRY / CREATION
// ==========================================

pinInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
    if (e.target.value.length >= 1 && index < pinInputs.length - 1) {
      pinInputs[index + 1].focus();
    }
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      pinInputs[index - 1].focus();
      pinInputs[index - 1].value = '';
    } else if (e.key === 'ArrowLeft' && index > 0) {
      pinInputs[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < pinInputs.length - 1) {
      pinInputs[index + 1].focus();
    }
  });
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const pastedData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (pastedData) {
      for (let i = 0; i < pastedData.length; i++) {
        if (pinInputs[i]) pinInputs[i].value = pastedData[i];
      }
      if (pastedData.length >= 4) {
        pinBtn.click();
      } else {
        pinInputs[pastedData.length].focus();
      }
    }
  });
});

pinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pin = Array.from(pinInputs).map(i => i.value).join('');

  if (pin.length !== 4) {
    pinError.textContent = 'Please enter a 4-digit PIN.';
    return;
  }

  pinError.textContent = '';
  pinBtn.disabled = true;
  pinBtn.textContent = 'Joining...';

  try {
    const res = await fetch(`${API_URL}/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionCode: currentSessionCode,
        studentId: selectedStudent.id,
        pin: pin
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join session');

    // Success!
    studentToken = data.data.token;
    currentTasks = data.data.tasks || [];
    currentSessionCode = data.data.session?.sessionCode || currentSessionCode;

    saveStudentSession({
      token: studentToken,
      sessionCode: currentSessionCode,
      studentName: data.data.student.name,
      sessionId: data.data.session?.id,
    });

    transitionToWidget();
    initWidget(data.data.student.name, currentSessionCode);

  } catch (err) {
    if (window.pinLockoutTimer) clearInterval(window.pinLockoutTimer);
    
    let msg = err.message;
    const match = msg.match(/Try again in (\d+) seconds/);
    
    if (match) {
      let seconds = parseInt(match[1], 10);
      pinError.textContent = msg;
      
      window.pinLockoutTimer = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(window.pinLockoutTimer);
          pinError.textContent = '';
        } else {
          pinError.textContent = msg.replace(/\d+ seconds/, `${seconds} seconds`);
        }
      }, 1000);
    } else {
      pinError.textContent = msg;
    }

    // Clear PIN inputs on error
    pinInputs.forEach(i => i.value = '');
    pinInputs[0].focus();
  } finally {
    pinBtn.disabled = false;
    if (selectedStudent && selectedStudent.hasPin) {
      pinBtn.textContent = 'Join Session →';
    } else {
      pinBtn.textContent = 'Set PIN & Join →';
    }
  }
});

backToSearch.addEventListener('click', () => {
  pinInputs.forEach(i => i.value = '');
  pinError.textContent = '';
  showStep('search');
  searchInput.focus();
});

// ==========================================
// STEP NAVIGATION
// ==========================================

function showStep(step) {
  stepCode.classList.add('hidden');
  stepSearch.classList.add('hidden');
  stepPin.classList.add('hidden');
  document.getElementById(`step-${step}`).classList.remove('hidden');
}

function transitionToWidget() {
  joinScreen.classList.add('shrinking');
  setTimeout(() => {
    joinScreen.classList.add('hidden');
    widgetCollapsed.classList.remove('hidden');
    applyOffsetToWidgets();
  }, 500);
}

// ==========================================
// WIDGET UI & DRAG LOGIC
// ==========================================

widgetCollapsed.addEventListener('click', () => {
  if (dragMoved) { dragMoved = false; return; }
  widgetCollapsed.classList.add('hidden');
  widgetExpanded.classList.remove('hidden');
  notificationDot.classList.add('hidden');
  applyOffsetToWidgets();
});

minimizeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  widgetExpanded.classList.add('hidden');
  widgetCollapsed.classList.remove('hidden');
  applyOffsetToWidgets();
});

closeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (confirm('Leave the session? You will need to rejoin.')) {
    clearStudentSession();
    if (socket) socket.disconnect();
    window.location.reload();
  }
});

// Dragging logic
let isDragging = false;
let dragMoved = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

function setupDraggable(element, handleElement = element) {
  handleElement.addEventListener("mousedown", dragStart);
  document.addEventListener("mouseup", dragEnd);
  document.addEventListener("mousemove", drag);
  handleElement.addEventListener("touchstart", dragStart, { passive: false });
  document.addEventListener("touchend", dragEnd);
  document.addEventListener("touchmove", drag, { passive: false });

  function dragStart(e) {
    if (e.target === minimizeBtn || e.target === closeBtn) return;
    if (e.target.closest && e.target.closest('.widget-controls')) return;
    initialX = e.type === "touchstart" ? e.touches[0].clientX - xOffset : e.clientX - xOffset;
    initialY = e.type === "touchstart" ? e.touches[0].clientY - yOffset : e.clientY - yOffset;
    isDragging = true;
    dragMoved = false;
  }

  function dragEnd() {
    if (!isDragging) return;
    initialX = currentX; initialY = currentY;
    isDragging = false;
    snapToBounds(element);
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.type === "touchmove" ? e.touches[0].clientX - initialX : e.clientX - initialX;
      currentY = e.type === "touchmove" ? e.touches[0].clientY - initialY : e.clientY - initialY;
      if (Math.abs(currentX - xOffset) > 2 || Math.abs(currentY - yOffset) > 2) dragMoved = true;
      xOffset = currentX; yOffset = currentY;
      setTranslate(currentX, currentY, element);
    }
  }
}

function setTranslate(xPos, yPos, el) { el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`; }
function applyOffsetToWidgets() {
  setTranslate(xOffset, yOffset, widgetCollapsed);
  setTranslate(xOffset, yOffset, widgetExpanded);
}

function snapToBounds(el) {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = rect.width, h = rect.height;
  const corners = [
    { x: SNAP_PAD, y: SNAP_PAD },
    { x: vw - w - SNAP_PAD, y: SNAP_PAD },
    { x: SNAP_PAD, y: vh - h - SNAP_PAD },
    { x: vw - w - SNAP_PAD, y: vh - h - SNAP_PAD },
  ];
  let nearest = corners[0], minDist = Infinity;
  for (const c of corners) {
    const d = Math.hypot(rect.left - c.x, rect.top - c.y);
    if (d < minDist) { minDist = d; nearest = c; }
  }
  xOffset += nearest.x - rect.left;
  yOffset += nearest.y - rect.top;
  currentX = xOffset; currentY = yOffset;
  applyOffsetToWidgets();
}

setupDraggable(widgetCollapsed);
setupDraggable(widgetExpanded, widgetDragHandle);

// ==========================================
// REAL-TIME & TASKS
// ==========================================

function initWidget(studentName, sessionCode) {
  sessionTitle.textContent = `Welcome, ${studentName.split(' ')[0]}`;
  sessionCodeDisplay.textContent = sessionCode;
  renderTasks();

  socket = io({
    auth: { token: studentToken },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5
  });

  socket.on('connect', () => {
    if (sessionEnded) return;
    statusDot.className = 'status-dot connected';
    statusText.textContent = 'Connected';
  });

  socket.on('disconnect', () => {
    if (sessionEnded) return;
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = 'Disconnected';
  });

  socket.on('connect_error', () => {
    if (sessionEnded) return;
    statusDot.className = 'status-dot connecting';
    statusText.textContent = 'Connecting...';
  });

  socket.on('new-task', (task) => {
    if (sessionEnded) return;
    const id = task.id || task.taskId;
    if (!id || currentTasks.some((t) => t.id === id)) return;
    currentTasks.push({
      id,
      title: task.title,
      description: task.description,
      taskNumber: task.taskNumber,
      localStatus: 'NOT_STARTED',
      localIssueText: '',
      localDoneTimestamp: null,
    });
    renderTasks();
    if (widgetExpanded.classList.contains('hidden')) {
      notificationDot.classList.remove('hidden');
    }
  });

  socket.on('task-removed', ({ taskId }) => {
    if (sessionEnded) return;
    currentTasks = currentTasks.filter(t => t.id !== taskId);
    if (openTaskDrawerId === taskId) openTaskDrawerId = null;
    renderTasks();
  });

  socket.on('session-ended', () => { handleSessionEnded(); });
  
  socket.on('status-resolved', (data) => {
    if (sessionEnded) return;
    // Check if this event applies to the current student
    // The server doesn't know the exact socket ID of the student, but the student knows their tasks
    const task = currentTasks.find(t => t.id === data.taskId);
    if (task && task.localStatus === 'ISSUE') {
      // Only process if it matches the current selected student ID
      if (selectedStudent && selectedStudent.id === data.studentId) {
        task.localStatus = data.status || 'IN_PROGRESS';
        task.localIssueText = '';
        renderTasks();
        showToast('Your issue was marked as resolved by the professor.', 'success');
      }
    }
  });
}

function handleSessionEnded() {
  sessionEnded = true;
  openTaskDrawerId = null;
  stopGraceTimer();
  clearStudentSession();
  if (socket) { socket.disconnect(); socket = null; }
  statusDot.className = 'status-dot disconnected';
  statusText.textContent = 'Session ended';
  widgetExpanded.classList.add('session-ended');
  widgetCollapsed.classList.add('session-ended');
  ensureSessionEndedBanner();
  renderTasks();
  widgetCollapsed.classList.add('hidden');
  widgetExpanded.classList.remove('hidden');
  applyOffsetToWidgets();
}

function ensureSessionEndedBanner() {
  let banner = document.getElementById('session-ended-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'session-ended-banner';
    banner.className = 'session-ended-banner';
    banner.textContent = 'Session has ended';
    const sessionInfo = widgetExpanded.querySelector('.widget-session-info');
    if (sessionInfo) sessionInfo.insertAdjacentElement('afterend', banner);
    else widgetExpanded.prepend(banner);
  }
  banner.classList.remove('hidden');
}

function formatGraceRemaining(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getGraceRemainingMs(task) {
  if (task.localStatus !== 'DONE' || !task.localDoneTimestamp) return 0;
  return Math.max(0, GRACE_MS - (Date.now() - task.localDoneTimestamp));
}

function isGraceLocked(task) {
  return task.localStatus === 'DONE' && task.localDoneTimestamp && (Date.now() - task.localDoneTimestamp > GRACE_MS);
}

function stopGraceTimer() { if (graceTimerId) { clearInterval(graceTimerId); graceTimerId = null; } }

function ensureGraceTimer() {
  const anyInGrace = currentTasks.some(t => getGraceRemainingMs(t) > 0);
  if (anyInGrace && !graceTimerId) {
    graceTimerId = setInterval(() => {
      if (sessionEnded) { stopGraceTimer(); return; }
      const stillInGrace = currentTasks.some(t => getGraceRemainingMs(t) > 0);
      renderTasks();
      if (!stillInGrace) stopGraceTimer();
    }, 1000);
  }
}

function renderTasks() {
  taskListContainer.innerHTML = '';
  if (currentTasks.length === 0) {
    taskListContainer.innerHTML = '<div style="padding: 16px; color: var(--text-muted); font-size: 13px; text-align: center;">Waiting for tasks from professor...</div>';
    return;
  }

  currentTasks.forEach((task) => {
    const currentStatus = task.localStatus || 'NOT_STARTED';
    const graceRemaining = getGraceRemainingMs(task);
    const locked = isGraceLocked(task);
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';

    let graceHtml = '';
    if (graceRemaining > 0) graceHtml = `<span class="grace-countdown">Changeable for ${formatGraceRemaining(graceRemaining)}</span>`;
    else if (locked) graceHtml = '<span class="lock-icon" title="Status locked after 2 minutes">🔒</span>';

    const issueLen = (task.localIssueText || '').length;

    taskItem.innerHTML = `
      <div class="task-row" data-task-id="${task.id}">
        <div class="task-status-icon icon-${currentStatus.toLowerCase()}"></div>
        <div class="task-info">
          <div class="task-title">${task.taskNumber}. ${task.title}</div>
          ${graceHtml}
        </div>
      </div>
      <div class="task-status-drawer ${openTaskDrawerId === task.id ? 'open' : ''}" id="drawer-${task.id}">
        <div class="status-options">
          <label class="status-radio radio-not_started">
            <input type="radio" name="status-${task.id}" value="NOT_STARTED" ${currentStatus === 'NOT_STARTED' ? 'checked' : ''} ${sessionEnded ? 'disabled' : ''}>
            <div class="radio-custom"></div><span>Not Started</span>
          </label>
          <label class="status-radio radio-in_progress">
            <input type="radio" name="status-${task.id}" value="IN_PROGRESS" ${currentStatus === 'IN_PROGRESS' ? 'checked' : ''} ${sessionEnded ? 'disabled' : ''}>
            <div class="radio-custom"></div><span>Working on it</span>
          </label>
          <label class="status-radio radio-done">
            <input type="radio" name="status-${task.id}" value="DONE" ${currentStatus === 'DONE' ? 'checked' : ''} ${sessionEnded ? 'disabled' : ''}>
            <div class="radio-custom"></div><span>Done</span>
          </label>
          <label class="status-radio radio-issue">
            <input type="radio" name="status-${task.id}" value="ISSUE" ${currentStatus === 'ISSUE' ? 'checked' : ''} ${sessionEnded ? 'disabled' : ''}>
            <div class="radio-custom"></div><span>Need Help</span>
          </label>
        </div>
        <div class="issue-input-area ${currentStatus === 'ISSUE' ? 'show' : ''}" id="issue-area-${task.id}">
          <textarea class="issue-textarea" id="issue-text-${task.id}" maxlength="${ISSUE_MAX_LEN}" placeholder="Describe your problem... (Optional)" ${sessionEnded ? 'disabled' : ''}>${task.localIssueText || ''}</textarea>
          <div class="char-counter" id="char-counter-${task.id}">${issueLen}/${ISSUE_MAX_LEN}</div>
          <button class="submit-issue-btn" data-submit-issue="${task.id}" ${sessionEnded ? 'disabled' : ''}>Submit Issue</button>
        </div>
      </div>
    `;

    const row = taskItem.querySelector('.task-row');
    row.addEventListener('click', () => { if (!sessionEnded) toggleTaskDrawer(task.id); });

    taskItem.querySelectorAll(`input[name="status-${task.id}"]`).forEach((radio) => {
      radio.addEventListener('change', () => { if (!sessionEnded) updateStatus(task.id, radio.value); });
    });

    const textarea = taskItem.querySelector(`#issue-text-${task.id}`);
    const counter = taskItem.querySelector(`#char-counter-${task.id}`);
    if (textarea && counter) {
      textarea.addEventListener('input', () => {
        if (textarea.value.length > ISSUE_MAX_LEN) textarea.value = textarea.value.slice(0, ISSUE_MAX_LEN);
        counter.textContent = `${textarea.value.length}/${ISSUE_MAX_LEN}`;
        const t = currentTasks.find(x => x.id === task.id);
        if (t) t.localIssueText = textarea.value;
      });
    }

    const submitBtn = taskItem.querySelector(`[data-submit-issue="${task.id}"]`);
    if (submitBtn) {
      submitBtn.addEventListener('click', () => { if (!sessionEnded) submitIssue(task.id); });
    }

    taskListContainer.appendChild(taskItem);
  });

  ensureGraceTimer();
}

function toggleTaskDrawer(taskId) {
  if (sessionEnded) return;
  const task = currentTasks.find(t => t.id === taskId);
  if (task && isGraceLocked(task)) {
    showToast('Status locked. It has been more than 2 minutes since you marked this task as done.', 'error');
    return;
  }
  openTaskDrawerId = openTaskDrawerId === taskId ? null : taskId;
  renderTasks();
}

async function updateStatus(taskId, status) {
  if (sessionEnded) return;
  const task = currentTasks.find(t => t.id === taskId);
  if (!task) return;
  const prevStatus = task.localStatus || 'NOT_STARTED';
  if (prevStatus === 'DONE' && status !== 'DONE') {
    if (isGraceLocked(task)) { showToast('Status locked.', 'error'); renderTasks(); return; }
    if (task.localDoneTimestamp && getGraceRemainingMs(task) > 0) {
      if (!confirm('Change status from Done?')) { renderTasks(); return; }
    }
  }
  task.localStatus = status;
  if (status === 'DONE') task.localDoneTimestamp = Date.now();
  else task.localDoneTimestamp = null;
  renderTasks();
  if (status !== 'ISSUE') await sendStatusUpdate(taskId, status);
}

async function submitIssue(taskId) {
  if (sessionEnded) return;
  const textElement = document.getElementById(`issue-text-${taskId}`);
  const text = textElement ? textElement.value.trim() : '';
  if (text.length > ISSUE_MAX_LEN) { showToast(`Issue text must be ${ISSUE_MAX_LEN} characters or fewer.`, 'error'); return; }
  const task = currentTasks.find(t => t.id === taskId);
  if (task) {
    task.localIssueText = text;
    await sendStatusUpdate(taskId, 'ISSUE', text);
    showToast('Issue submitted to professor.', 'success');
  }
}

async function sendStatusUpdate(taskId, status, issueText = '') {
  try {
    const res = await fetch(`${API_URL}/responses/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ taskId, status, issueText })
    });
    if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to update status'); }
  } catch (err) {
    console.error('Status update failed:', err);
    showToast('Failed to sync status: ' + err.message, 'error');
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  
  let icon = '';
  if (type === 'success') icon = '✓ ';
  else if (type === 'error') icon = '⚠ ';
  
  toast.textContent = icon + message;
  container.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}
