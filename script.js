/**
 * Kanban Task Management Logic
 * --------------------------------------------------
 * Handles state management, UI rendering, drag-and-drop,
 * and standard CRUD operations for tasks.
 */

// --- Constants & State ---
const STORAGE_KEY = 'kanban_tasks';

const DEFAULT_TASKS = [
    {
        id: 'task-1',
        title: 'Design homepage UI',
        description: 'Create wireframes and high-fidelity mockups for the new landing page.',
        priority: 'high',
        status: 'todo',
        date: new Date().toISOString().split('T')[0]
    },
    {
        id: 'task-2',
        title: 'Integrate API endpoints',
        description: 'Connect front-end services with the new backend REST API.',
        priority: 'medium',
        status: 'in-progress',
        date: ''
    },
    {
        id: 'task-3',
        title: 'Fix navigation bug',
        description: 'Resolve issue where mobile menu does not close on click.',
        priority: 'high',
        status: 'todo',
        date: '2023-11-15'
    }
];

let tasks = [];
let draggedTask = null;
let taskToDelete = null;

// --- DOM Element Cache ---
// Caching these elements prevents repeated slow queries to the DOM
const ui = {
    columns: {
        'todo': document.getElementById('list-todo'),
        'in-progress': document.getElementById('list-in-progress'),
        'done': document.getElementById('list-done')
    },
    counts: {
        'todo': document.getElementById('count-todo'),
        'in-progress': document.getElementById('count-in-progress'),
        'done': document.getElementById('count-done')
    },
    modals: {
        task: document.getElementById('taskModal'),
        delete: document.getElementById('deleteModal')
    },
    form: {
        formElement: document.getElementById('taskForm'),
        title: document.getElementById('modalTitle'),
        id: document.getElementById('taskId'),
        taskTitle: document.getElementById('taskTitle'),
        desc: document.getElementById('taskDesc'),
        priority: document.getElementById('taskPriority'),
        date: document.getElementById('taskDueDate')
    },
    buttons: {
        addTask: document.getElementById('addTaskBtn'),
        closeTaskModal: document.getElementById('closeModalBtn'),
        cancelTask: document.getElementById('cancelBtn'),
        closeDeleteModal: document.getElementById('closeDeleteModalBtn'),
        cancelDelete: document.getElementById('cancelDeleteBtn'),
        confirmDelete: document.getElementById('confirmDeleteBtn'),
        themeToggle: document.getElementById('themeToggle')
    },
    inputs: {
        search: document.getElementById('searchInput')
    }
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    loadTasks();
    initTheme();
    setupEventListeners();
    renderBoard();
}

/**
 * Attaches all static event listeners to the DOM.
 */
function setupEventListeners() {
    // Task Modal interactions
    ui.buttons.addTask.addEventListener('click', openAddModal);
    ui.buttons.closeTaskModal.addEventListener('click', closeTaskModal);
    ui.buttons.cancelTask.addEventListener('click', closeTaskModal);
    ui.form.formElement.addEventListener('submit', handleFormSubmit);

    // Delete Modal interactions
    ui.buttons.closeDeleteModal.addEventListener('click', closeDeleteModal);
    ui.buttons.cancelDelete.addEventListener('click', closeDeleteModal);
    ui.buttons.confirmDelete.addEventListener('click', confirmDelete);

    // Header controls
    ui.inputs.search.addEventListener('input', (e) => renderBoard(e.target.value));
    ui.buttons.themeToggle.addEventListener('click', toggleTheme);

    // Click outside to close modals
    window.addEventListener('click', (e) => {
        if (e.target === ui.modals.task) closeTaskModal();
        if (e.target === ui.modals.delete) closeDeleteModal();
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyboardShortcuts);

    // Setup Drag-and-Drop Dropzones
    setupDropzones();
}

// --- Local Storage Management ---

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse tasks from localStorage', e);
            tasks = [...DEFAULT_TASKS];
        }
    } else {
        tasks = [...DEFAULT_TASKS];
        saveTasks();
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// --- CRUD Operations ---

function createTask(taskData) {
    const newTask = {
        id: 'task-' + Date.now().toString(),
        ...taskData,
        status: 'todo' // All new tasks begin in 'todo'
    };
    tasks.push(newTask);
    saveTasks();
    renderBoard();
}

function updateTask(id, updates) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        saveTasks();
        renderBoard();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderBoard();
}

function getTask(id) {
    return tasks.find(t => t.id === id);
}

// --- UI Rendering ---

/**
 * Clears and re-renders the entire board based on the current state and filters.
 */
function renderBoard(filterText = '') {
    // 1. Clear Columns
    Object.values(ui.columns).forEach(col => col.innerHTML = '');

    // 2. Filter Tasks
    const lowerFilter = filterText.toLowerCase();
    const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(lowerFilter) || 
        task.description.toLowerCase().includes(lowerFilter)
    );

    // 3. Render Task Elements
    const columnCounts = { 'todo': 0, 'in-progress': 0, 'done': 0 };

    filteredTasks.forEach(task => {
        if (ui.columns[task.status]) {
            const taskEl = createTaskCardElement(task);
            ui.columns[task.status].appendChild(taskEl);
            columnCounts[task.status]++;
        }
    });

    // 4. Update Empty State Placeholders
    updateEmptyStates();

    // 5. Update Column Counters
    ui.counts['todo'].textContent = columnCounts['todo'];
    ui.counts['in-progress'].textContent = columnCounts['in-progress'];
    ui.counts['done'].textContent = columnCounts['done'];
}

/**
 * Creates and returns a DOM element for a single task card.
 */
function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.classList.add('task-card');
    card.setAttribute('draggable', 'true');
    card.dataset.id = task.id;

    // Check if overdue
    let dateHtml = '';
    let isOverdue = false;
    
    if (task.date) {
        const dueDate = new Date(task.date);
        
        // Strip time for accurate day-level comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        
        isOverdue = task.status !== 'done' && dueDate < today;
        
        const formattedDate = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const overdueClass = isOverdue ? ' text-overdue' : '';
        const overdueLabel = isOverdue ? ' (Overdue)' : '';
        
        dateHtml = `<div class="task-date${overdueClass}">📅 ${formattedDate}${overdueLabel}</div>`;
    }

    if (isOverdue) card.classList.add('task-overdue');

    // Build inner HTML (escaping user input to prevent XSS)
    card.innerHTML = `
        <div class="task-header">
            <h3 class="task-title">${escapeHTML(task.title)}</h3>
            <div class="task-actions">
                <button class="btn-action edit" aria-label="Edit task" onclick="openEditModal('${task.id}')">✏️</button>
                <button class="btn-action delete" aria-label="Delete task" onclick="openDeleteModal('${task.id}')">🗑️</button>
            </div>
        </div>
        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
        <div class="task-footer">
            <span class="task-priority priority-${task.priority}">${task.priority}</span>
            ${dateHtml}
        </div>
    `;

    // Attach Drag Events
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);

    return card;
}

/**
 * Ensures columns without tasks display an "Empty" message.
 */
function updateEmptyStates() {
    ['todo', 'in-progress', 'done'].forEach(status => {
        const column = ui.columns[status];
        if (!column) return;

        const taskCount = column.querySelectorAll('.task-card').length;
        const emptyMsg = column.querySelector('.empty-message');

        if (taskCount === 0) {
            if (!emptyMsg) {
                const msg = document.createElement('div');
                msg.className = 'empty-message';
                msg.textContent = 'No tasks here';
                column.appendChild(msg);
            }
        } else if (emptyMsg) {
            emptyMsg.remove();
        }
    });
}

// --- Drag-and-Drop Implementation ---

function handleDragStart(e) {
    draggedTask = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
    
    // Slight delay to allow the browser to capture the drag image before altering styling
    setTimeout(() => this.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedTask = null;
    
    // Clean up drag-over visual states from all columns
    document.querySelectorAll('.column-body.drag-over').forEach(col => {
        col.classList.remove('drag-over');
    });
}

/**
 * Initializes dropzone event listeners on the column bodies.
 */
function setupDropzones() {
    const dropzones = document.querySelectorAll('.column-body');

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessary to allow dropping
            zone.classList.add('drag-over');

            if (!draggedTask) return;

            const afterElement = getDragAfterElement(zone, e.clientY);
            if (afterElement == null) {
                zone.appendChild(draggedTask);
            } else {
                zone.insertBefore(draggedTask, afterElement);
            }
        });

        zone.addEventListener('dragleave', (e) => {
            // Only remove drag-over state if we've actually left the dropzone container
            if (e.relatedTarget && !zone.contains(e.relatedTarget)) {
                zone.classList.remove('drag-over');
            }
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            if (!draggedTask) return;
            
            const newStatus = zone.parentElement.dataset.status;
            syncStateWithDomOrder(newStatus);
        });
    });
}

/**
 * Determines which task card we are currently hovering over.
 * Returns the element we should insert *before*.
 */
function getDragAfterElement(container, yPosition) {
    // Select all cards except the one currently being dragged
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = yPosition - (box.top + box.height / 2);
        
        // We want the element immediately below our cursor
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Reads the actual DOM order after a drop event and saves it to state.
 */
function syncStateWithDomOrder(triggeringStatus) {
    const oldTasksReference = [...tasks];
    const updatedTasksArray = [];
    
    ['todo', 'in-progress', 'done'].forEach(status => {
        const column = ui.columns[status];
        if (!column) return;

        const cardIds = [...column.querySelectorAll('.task-card')].map(card => card.dataset.id);
        
        cardIds.forEach(id => {
            const task = oldTasksReference.find(t => t.id === id);
            if (task) {
                // Apply the new column status to the task
                updatedTasksArray.push({ ...task, status: status });
            }
        });
    });
    
    // Safeguard: only apply changes if we didn't lose any task records
    if (updatedTasksArray.length === tasks.length) {
        tasks = updatedTasksArray;
        saveTasks();
        
        // Update auxiliary UI components without triggering a full re-render
        updateEmptyStates();
        updateCustomCounters();
    }
}

function updateCustomCounters() {
    ui.counts['todo'].textContent = ui.columns['todo'].querySelectorAll('.task-card').length;
    ui.counts['in-progress'].textContent = ui.columns['in-progress'].querySelectorAll('.task-card').length;
    ui.counts['done'].textContent = ui.columns['done'].querySelectorAll('.task-card').length;
}

// --- Modals & Forms ---

function openAddModal() {
    ui.form.title.textContent = 'New Task';
    ui.form.formElement.reset();
    ui.form.id.value = '';
    
    ui.modals.task.classList.add('active');
    ui.modals.task.setAttribute('aria-hidden', 'false');
    ui.form.taskTitle.focus();
}

function openEditModal(id) {
    const task = getTask(id);
    if (!task) return;

    ui.form.title.textContent = 'Edit Task';
    ui.form.id.value = task.id;
    ui.form.taskTitle.value = task.title;
    ui.form.desc.value = task.description;
    ui.form.priority.value = task.priority;
    ui.form.date.value = task.date;
    
    ui.modals.task.classList.add('active');
    ui.modals.task.setAttribute('aria-hidden', 'false');
    ui.form.taskTitle.focus();
}

function closeTaskModal() {
    ui.modals.task.classList.remove('active');
    ui.modals.task.setAttribute('aria-hidden', 'true');
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const id = ui.form.id.value;
    const taskData = {
        title: ui.form.taskTitle.value.trim(),
        description: ui.form.desc.value.trim(),
        priority: ui.form.priority.value,
        date: ui.form.date.value
    };

    if (id) {
        updateTask(id, taskData);
    } else {
        createTask(taskData);
    }

    closeTaskModal();
}

function openDeleteModal(id) {
    taskToDelete = id;
    ui.modals.delete.classList.add('active');
    ui.modals.delete.setAttribute('aria-hidden', 'false');
}

function closeDeleteModal() {
    taskToDelete = null;
    ui.modals.delete.classList.remove('active');
    ui.modals.delete.setAttribute('aria-hidden', 'true');
}

function confirmDelete() {
    if (taskToDelete) {
        deleteTask(taskToDelete);
        closeDeleteModal();
    }
}

function handleKeyboardShortcuts(e) {
    // Ignore input if user is actively typing in a text field
    const activeTag = document.activeElement.tagName;
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
    }

    // Press 'N' to open Add Task modal
    if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        if (!ui.modals.task.classList.contains('active')) {
            openAddModal();
        }
    }
}

// --- Theming ---

function initTheme() {
    const savedTheme = localStorage.getItem('kanban_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        ui.buttons.themeToggle.textContent = '☀️';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('kanban_theme', isDark ? 'dark' : 'light');
    ui.buttons.themeToggle.textContent = isDark ? '☀️' : '🌙';
}

// --- Utilities ---

/**
 * Escapes potentially dangerous characters to prevent XSS attacks.
 */
function escapeHTML(str) {
    if (!str) return '';
    const span = document.createElement('span');
    span.textContent = str;
    return span.innerHTML;
}
