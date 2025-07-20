let currentLimit = 10;
let currentOffset = 0;
let totalTasks = 0;
let currentType = 'all';

document.addEventListener("DOMContentLoaded", function () {
        getTask(); 
});

async function loginUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pass').value;
    const message = document.getElementById('task-message');

    const loginDetails = {email, password};

    try{
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginDetails)
        });

        if (!response.ok) {
            throw new Error("Login failed: " + response.status);
        }
        
        const data = await response.json();
        const token = data.access_token;
        localStorage.setItem("token", token);

        message.textContent = "[ Login Successful ]";

        getTask();

    }catch (error) {
        console.error(error);
        message.textContent = " [Login failed] ";
    }
}

function addTask(duplicate_status) {
    const token = localStorage.getItem("token");
    const name = document.getElementById("task").value.trim();
    const messageBox = document.getElementById("task-message");
    const taskData = {name, duplicate_status};

    if (!name) {
        messageBox.textContent = "[ Task is required ]";
        return;
    }

    fetch(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
        },
        body: JSON.stringify(taskData)
    })

    .then(response => {
        return response.json();
    })

    .then((data)=>{
        const isSmallScreen = window.matchMedia("(max-width: 800px)").matches;
        messageBox.textContent = `[ ${data.message} ]`;
        if (data.status == true)

            if (isSmallScreen) {
                messageBox.innerHTML = `
                    [ Duplicate ] :
                    [ Add task? ]
                    <button class="duplicatechoicebutton" onclick="duplicateChoice(true)"><span>YES</span></button>
                    <button class="duplicatechoicebutton" onclick="duplicateChoice(false)"><span>NO</span></button>
                `  
            } else {
                messageBox.innerHTML = `
                    [ ${data.message} ] :
                    [ Add task? ]
                    <button class="duplicatechoicebutton" onclick="duplicateChoice(true)"><span>YES</span></button>
                    <button class="duplicatechoicebutton" onclick="duplicateChoice(false)"><span>NO</span></button>
                `
            }  
        getTask();
    })
}

async function getTask(type = "all", offset = 0, limit = 10) {
    const token = localStorage.getItem("token");
    const messageBox = document.getElementById("task-message");

    try {
        const response = await fetch(`${API_BASE_URL}/tasks?task_type=${type}&limit=${limit}&offset=${offset}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        
       
        if (!response.ok) {
            throw new Error("Failed to fetch tasks") 
        };
        const data = await response.json();
        updatePaginationInfo(data);
        renderTasks(data.tasks); 
       
    }catch(error) {
        console.error("Error fetching tasks:", error);
        messageBox.textContent = "[ Login is required ]";
    };
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
    select.className = "list";
    const priorities = ["High", "Medium", "Low", "None"];

    priorities.forEach(priority => {
        const option = document.createElement("option");
        option.value = priority;
        option.textContent = priority;
        select.appendChild(option);
    });
    select.value = task.priority;

    const selectTitle = document.createElement("select");
    selectTitle.className = "list";
    const titles = ["Home", "Work", "Project", "Exercise", "Study", "Others"];

    titles.forEach( title => {
        const titleOption = document.createElement("option");
        titleOption.value = title;
        titleOption.textContent = title;
        selectTitle.appendChild(titleOption);
    });
    selectTitle.value = task.title;
   
    select.addEventListener('change', () => updateTaskPriority(task.id, select.value));
    selectTitle.addEventListener('change', () => updateTaskTitle(task.id, selectTitle.value));
    checkbox.addEventListener('change', () => updateTaskCompletion(task.id, checkbox.checked, checkbox, input));
    input.addEventListener('blur', () => handleTaskUpdateDelete(task, input, li));

    taskCompleted(checkbox, input);

    li.appendChild(checkbox);
    li.appendChild(input);
    li.appendChild(select);
    li.appendChild(selectTitle)

    return li;
}

function updateTaskPriority(taskId, newPriority) {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ priority: newPriority })
    }).catch(error => {
        console.error("Error updating the priority:", error);
    });
}

function updateTaskTitle(taskId, newTitle) {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ title: newTitle})
    }).catch(error => {
        console.error("Error updating the title:", error);
    });
}

function updateTaskCompletion(taskId, completed, checkbox, input) {
    taskCompleted(checkbox, input);
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: "PUT",
        headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json" 
        },
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
    const messageBox = document.getElementById("task-message");
    const token = localStorage.getItem("token");
    if (input.value === "") {
    // Delete task
        fetch(`${API_BASE_URL}/tasks/${task.id}`, {
            method: "DELETE" ,
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                li.remove();
                messageBox.textContent = "[ Delete Successful ]";
            } else {
                console.error("Failed to delete task");
            }
        })
        .catch(error => {
            console.error("Error deleting task:", error);
            messageBox.textContent = "[ Failed to delete task ]";
        });

    // Update task
    } else if (input.value !== task.name) {
        fetch(`${API_BASE_URL}/tasks/${task.id}`, {
            method: "PUT",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: input.value })

        .then( resonse => {

        })
        }).catch(error => {
            console.error("Error updating task name:", error);
            messageBox.textContent = "[ Failed to update task ]";
        });

    }
}

function prevPage() {
    if (currentOffset == 0) return
    currentOffset -= currentLimit;
    return getTask(currentType, currentOffset, currentLimit)
}

function nextPage(){
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