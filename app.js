let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let editingTaskId = null;
let draggedElement = null;
let currentFilter = 'all';
let currentCategory = null;
let searchQuery = '';

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function addTask(task) {
    tasks.push({
        id: generateId(),
        ...task,
        completed: false,
        createdAt: new Date().toISOString()
    });
    saveTasks();
    renderTasks();
    updateStats();
}

function updateTask(id, updates) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updates };
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        editingTaskId = id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskDueDate').value = task.dueDate || '';
        document.getElementById('submitBtn').textContent = 'Update Task';
        document.getElementById('taskTitle').focus();
    }
}

function isOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function filterTasks() {
    let filtered = tasks;

    if (currentFilter === 'active') filtered = filtered.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = filtered.filter(t => t.completed);

    if (currentCategory) filtered = filtered.filter(t => t.category === currentCategory);

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(t => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
    }

    return filtered;
}

function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const filtered = filterTasks();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h2>No tasks found</h2>
                <p>Add a new task to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}" draggable="true" data-id="${task.id}">
            <div class="task-header">
                <div class="task-title">${task.title}</div>
                <div class="task-actions">
                    <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} onclick="event.stopPropagation(); toggleComplete('${task.id}')">
                    <button class="icon-btn" onclick="event.stopPropagation(); editTask('${task.id}')" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="event.stopPropagation(); deleteTask('${task.id}')" title="Delete">🗑️</button>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                <span class="category-badge category-${task.category}">${task.category}</span>
                ${task.dueDate ? `<span class="due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}">📅 ${formatDate(task.dueDate)}</span>` : ''}
            </div>
        </div>
    `).join('');

    setupDragAndDrop();
}

function setupDragAndDrop() {
    const taskCards = document.querySelectorAll('.task-card');
    
    taskCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();

    if (draggedElement !== this) {
        const draggedId = draggedElement.dataset.id;
        const targetId = this.dataset.id;
        
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);
        
        const [removed] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, removed);
        
        saveTasks();
        renderTasks();
    }

    return false;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('overdueTasks').textContent = overdue;
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelector('.theme-toggle').textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('darkMode', isDark);
}

/* Event Listeners */
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const task = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        category: document.getElementById('taskCategory').value,
        dueDate: document.getElementById('taskDueDate').value
    };

    if (editingTaskId) {
        updateTask(editingTaskId, task);
        editingTaskId = null;
        document.getElementById('submitBtn').textContent = 'Add Task';
    } else {
        addTask(task);
    }

    e.target.reset();
});

document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

document.querySelectorAll('[data-category]').forEach(btn => {
    btn.addEventListener('click', () => {
        const wasActive = btn.classList.contains('active');
        document.querySelectorAll('[data-category]').forEach(b => b.classList.remove('active'));
        
        if (wasActive) currentCategory = null;
        else {
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
        }
        renderTasks();
    });
});

document.getElementById('searchBox').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTasks();
});

/* Initialize */
if (localStorage.getItem('darkMode') === 'true') toggleTheme();
renderTasks();
updateStats();
