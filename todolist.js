let currentLimit = 10;
let currentOffset = 0;
let totalTasks = 0;
let currentType = 'all';

document.addEventListener("DOMContentLoaded",function (){
    getTask();
});

function addTask(duplicate_status) {
    const name = document.getElementById("task").value.trim();
    const messageBox = document.getElementById("task-message");
    const taskData = {name, duplicate_status};

    if (!name) {
        messageBox.textContent = "[ Task is required ]";
        return;
    }

    fetch("http://localhost:8000/tasks/", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(taskData)
    })

    .then(response => {
        return response.json();
    })

    .then((data)=>{
        messageBox.textContent = `[ ${data.message} ]`;
        if (data.status == true)
            messageBox.innerHTML = `
            [ ${data.message} ] :
            [ Add task? ]
            <button class="duplicatechoicebutton" onclick="duplicateChoice(true)"><span>YES</span></button>
            <button class="duplicatechoicebutton" onclick="duplicateChoice(false)"><span>NO</span></button>
        `  
        getTask()
    }) 
}

function getTask(type = "all", offset = 0, limit = 10) {
    fetch(`http://localhost:8000/tasks?task_type=${type}&limit=${limit}&offset=${offset}`)
    .then(response => {
        if (!response.ok) throw new Error("Failed to fetch tasks");
        return response.json();
    })

    .then(data => {
        updatePaginationInfo(data);
        renderTasks(data.tasks);
    })
    .catch(error => {
        console.error("Error fetching tasks:", error);
    });

}

function updatePaginationInfo(data) {
    totalTasks = data.total;
    currentLimit = data.limit;
    currentOffset = data.offset;
    currentType = data.task_type;
}

function renderTasks(tasks) {
    const taskList = document.getElementById("task-list");
    taskList.innerHTML = "";
    tasks.forEach(task => {
    const li = createTaskElement(task);
    taskList.appendChild(li);
    });
}

function createTaskElement(task) {
    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;

    const input = document.createElement("input");
    input.className = "task-input";
    input.value = task.name;
    input.autocomplete = "off";
    input.maxLength = 64;
    input.size = task.name.length;

    const select = document.createElement("select");
    select.className = "priority-list";
    const priorities = ["High", "Medium", "Low", "None"];

    priorities.forEach(priority => {
        const option = document.createElement("option");
        option.value = priority;
        option.textContent = priority;
        select.appendChild(option);
    });
    select.value = task.priority;

    select.addEventListener('change', () => updateTaskPriority(task.id, select.value));
    checkbox.addEventListener('change', () => updateTaskCompletion(task.id, checkbox.checked, checkbox, input));
    input.addEventListener('blur', () => handleTaskUpdateDelete(task, input, li));

    taskCompleted(checkbox, input);

    li.appendChild(checkbox);
    li.appendChild(input);
    li.appendChild(select);

    return li;
}

function updateTaskPriority(taskId, newPriority) {
    fetch(`http://localhost:8000/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority })
    }).catch(error => {
        console.error("Error updating the priority:", error);
    });
}

function updateTaskCompletion(taskId, completed, checkbox, input) {
    taskCompleted(checkbox, input);

    fetch(`http://localhost:8000/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed })
    }).catch(error => {
        console.error("Error updating completed status:", error);
    });
}

function taskCompleted(checkbox, input) {
    if (checkbox.checked) {
        input.style.textDecoration = "line-through";
        input.style.opacity = "0.6";
    } else {
        input.style.textDecoration = "none";
        input.style.opacity = "1";
    }
}

function handleTaskUpdateDelete(task, input, li) {

    if (input.value === "") {
    // Delete task
    fetch(`http://localhost:8000/tasks/${task.id}`, { method: "DELETE" })
        .then(response => {
            if (response.ok) {
                li.remove();
            } else {
                console.error("Failed to delete task");
            }
        })
        .catch(error => {
            console.error("Error deleting task:", error);
        });

    // Update task
    } else if (input.value !== task.name) {
        fetch(`http://localhost:8000/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: input.value })
        }).catch(error => {
            console.error("Error updating task name:", error);
        });
    }
}

function prevPage() {
    if (currentOffset == 0) return
    currentOffset -= currentLimit;
    return getTask(currentType, currentOffset, currentLimit)
}

function nextPage(){
    console.log("limit", currentLimit)
    console.log("offset", currentOffset)
    console.log("sum", currentLimit + currentOffset)
    
    if((currentOffset + currentLimit) >= totalTasks) return;
    currentOffset += currentLimit;
    return getTask(currentType, currentOffset, currentLimit)
}

function duplicateChoice(option) {

    if (option == true) {
        addTask(false);
    }
    else {
        document.getElementById("task-message").textContent = ""; 
    }
    
    document.getElementById("task").value = '';
}