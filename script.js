// DOM Elements
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("prioritySelect");
const dueDate = document.getElementById("dueDate");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const filterButtons = document.querySelectorAll(".filter-btn");
const taskCounter = document.querySelector(".task-counter");

// Current filter
let currentFilter = "all";

// Load tasks from local storage
document.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    updateTaskCounter();

    // Set minimum date to today
    dueDate.min = new Date().toISOString().split('T')[0];
});

// Add a new task
addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
});

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    const priority = prioritySelect.value;
    const due = dueDate.value;

    const task = {
        text: taskText,
        priority,
        due,
        completed: false,
        id: Date.now()
    };

    addTaskToDOM(task);
    saveTask(task);

    taskInput.value = "";
    dueDate.value = "";
    taskInput.focus();

    updateTaskCounter();
}

// Function to add task to DOM
function addTaskToDOM(task) {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");
    li.dataset.id = task.id;
    li.dataset.priority = task.priority;
    li.dataset.completed = task.completed;

    // Format due date
    let dueDateText = "";
    if (task.due) {
        const dueDate = new Date(task.due);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        dueDateText = ` • Fällig: ${dueDate.toLocaleDateString('de-DE')}`;

        if (dueDate < today && !task.completed) {
            dueDateText = ` • Überfällig: ${dueDate.toLocaleDateString('de-DE')}`;
        }
    }

    li.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
        <span class="task-priority priority-${task.priority}">${getPriorityText(task.priority)}</span>
        <span class="task-due ${isOverdue(task.due, task.completed) ? 'overdue' : ''}">${dueDateText}</span>
        <div class="task-actions">
            <button class="delete-btn" title="Aufgabe löschen"><i class="fas fa-trash"></i></button>
        </div>
    `;

    taskList.appendChild(li);

    // Add event listeners
    const checkbox = li.querySelector(".task-checkbox");
    checkbox.addEventListener("change", () => toggleTaskCompletion(task.id, checkbox.checked));

    const deleteBtn = li.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => confirmDeleteTask(task.id));

    // Dragging functionality
    li.addEventListener("dragstart", () => {
        li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        saveOrder();
    });
}

// Get priority text in German
function getPriorityText(priority) {
    const priorities = {
        low: "Niedrig",
        medium: "Mittel",
        high: "Hoch"
    };
    return priorities[priority] || priority;
}

// Check if task is overdue
function isOverdue(dueDate, completed) {
    if (!dueDate || completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
}

// Toggle task completion
function toggleTaskCompletion(id, completed) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const taskIndex = tasks.findIndex(task => task.id === id);

    if (taskIndex !== -1) {
        tasks[taskIndex].completed = completed;
        localStorage.setItem("tasks", JSON.stringify(tasks));

        // Update DOM
        const taskItem = document.querySelector(`li[data-id="${id}"]`);
        if (taskItem) {
            taskItem.dataset.completed = completed;
            taskItem.querySelector(".task-text").classList.toggle("completed", completed);

            // Update due date styling if needed
            const dueElement = taskItem.querySelector(".task-due");
            if (dueElement) {
                dueElement.classList.toggle("overdue", isOverdue(tasks[taskIndex].due, completed));
            }
        }

        updateTaskCounter();
    }
}

// Confirm task deletion
function confirmDeleteTask(id) {
    if (confirm("Möchten Sie diese Aufgabe wirklich löschen?")) {
        deleteTask(id);
    }
}

// Delete task
function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    const taskItem = document.querySelector(`li[data-id="${id}"]`);
    if (taskItem) {
        taskItem.classList.add("fade-out");
        setTimeout(() => {
            taskItem.remove();
            updateTaskCounter();
            checkEmptyState();
        }, 300);
    }
}

// Save task to Local Storage
function saveTask(task) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(task);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from Local Storage
function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    // Clear the task list
    taskList.innerHTML = "";

    if (tasks.length === 0) {
        showEmptyState();
        return;
    }

    // Sort tasks: completed at bottom, then by priority (high first), then by due date (earlier first)
    tasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.priority !== b.priority) {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        if (a.due && b.due) return new Date(a.due) - new Date(b.due);
        if (a.due) return -1;
        if (b.due) return 1;
        return 0;
    });

    tasks.forEach(task => addTaskToDOM(task));
    applyFilter(currentFilter);
    checkEmptyState();
}

// Save order of tasks in Local Storage
function saveOrder() {
    const taskItems = [...taskList.querySelectorAll("li")];
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const newTasks = taskItems.map(item => {
        const id = parseInt(item.dataset.id);
        return tasks.find(task => task.id === id);
    }).filter(task => task !== undefined);

    localStorage.setItem("tasks", JSON.stringify(newTasks));
}

// Filter tasks
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        currentFilter = button.dataset.filter;
        applyFilter(currentFilter);
    });
});

function applyFilter(filter) {
    const tasks = document.querySelectorAll("li");

    tasks.forEach(task => {
        const isCompleted = task.dataset.completed === "true";

        switch(filter) {
            case "active":
                task.style.display = isCompleted ? "none" : "flex";
                break;
            case "completed":
                task.style.display = isCompleted ? "flex" : "none";
                break;
            default:
                task.style.display = "flex";
                break;
        }
    });

    checkEmptyState();
    updateTaskCounter();
}

// Update task counter
function updateTaskCounter() {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    taskCounter.textContent = `${completedTasks}/${totalTasks} Aufgaben`;
}

// Show empty state
function showEmptyState() {
    taskList.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>Keine Aufgaben</h3>
            <p>Fügen Sie eine neue Aufgabe hinzu, um zu beginnen.</p>
        </div>
    `;
}

// Check if task list is empty after filtering
function checkEmptyState() {
    const visibleTasks = [...taskList.querySelectorAll("li")].filter(task =>
        window.getComputedStyle(task).display !== "none"
    );

    if (visibleTasks.length === 0 && taskList.children.length > 0) {
        showEmptyState();
    }
}

// Drag and drop functionality
taskList.addEventListener("dragover", e => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;

    const afterElement = getDragAfterElement(taskList, e.clientY);
    if (afterElement == null) {
        taskList.appendChild(dragging);
    } else {
        taskList.insertBefore(dragging, afterElement);
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}