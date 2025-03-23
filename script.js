// Get elements
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");

// Load tasks from local storage
document.addEventListener("DOMContentLoaded", loadTasks);

// Add a new task
addTaskBtn.addEventListener("click", () => {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    addTaskToDOM(taskText);
    saveTask(taskText);

    taskInput.value = ""; // Clear input field
});

// Function to add task to DOM
function addTaskToDOM(taskText) {
    const li = document.createElement("li");
    li.setAttribute("draggable", "true");  // Make task draggable
    li.innerHTML = `${taskText} <button class="delete-btn">X</button>`;
    taskList.appendChild(li);

    // Delete task event
    li.querySelector(".delete-btn").addEventListener("click", () => {
        li.remove();
        removeTask(taskText);
    });

    // Dragging functionality
    li.addEventListener("dragstart", (e) => {
        li.classList.add("dragging");
    });

    li.addEventListener("dragend", (e) => {
        li.classList.remove("dragging");
        // Save the new order
        saveOrder();
    });

    // Allow tasks to be dropped by preventing default behavior
    taskList.addEventListener("dragover", (e) => {
        e.preventDefault();  // Keep this to allow dropping

        const dragging = document.querySelector(".dragging");
        const afterElement = getDragAfterElement(taskList, e.clientY);

        if (afterElement == null) {
            taskList.appendChild(dragging);
        } else {
            taskList.insertBefore(dragging, afterElement);
        }
    });
}

// Helper function to determine where the dragged element should be inserted
function getDragAfterElement(taskList, y) {
    const draggableElements = [...taskList.querySelectorAll("li:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, {}).element;
}

// Save task to Local Storage
function saveTask(taskText) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(taskText);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Load tasks from Local Storage
function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(task => addTaskToDOM(task));
}

// Remove task from Local Storage
function removeTask(taskText) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.filter(task => task !== taskText);
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Save order of tasks in Local Storage
function saveOrder() {
    const taskItems = [...taskList.querySelectorAll("li")];
    const tasks = taskItems.map(item => item.textContent.trim().slice(0, -2)); // Remove the "X" button text
    localStorage.setItem("tasks", JSON.stringify(tasks));
}