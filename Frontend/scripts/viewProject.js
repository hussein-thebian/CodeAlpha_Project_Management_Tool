document.addEventListener("DOMContentLoaded", () => {
    const backButton = document.getElementById("backButton");
    const projectForm = document.getElementById("projectForm");
    const projectNameInput = document.getElementById("projectName");
    const projectDescriptionInput = document.getElementById("projectDescription");
    const membersList = document.getElementById("membersList");
    const ownerName = document.getElementById("ownerName");
    const memberCount = document.getElementById("memberCount");
    const searchInput = document.getElementById("searchInput"); // Search input for the dropdown
    const jwtToken = localStorage.getItem("pmToken");

    if (!jwtToken) {
        window.location.href = "../pages/login.html"; // Redirect to login if no token
        return;
    }

    if (isTokenExpired(jwtToken)) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("pmToken"); // Remove the expired token
        window.location.href = "../pages/login.html"; // Redirect to login
        return;
    }

    // Decode JWT to get user ID
    const decodedToken = jwtDecode(jwtToken);
    const userId = decodedToken.id;

    const projectId = localStorage.getItem("viewProjectId");
    console.log("Project Id",projectId);
    if (!projectId) {
        console.log("You are here Project Id");
        window.location.href = "../pages/profile.html"; // Redirect to profile if no project ID is found
        return;
    }

    // Go back to the previous page when the back button is clicked
    backButton.addEventListener("click", () => {
        window.history.back();
    });

    // Fetch project details
    fetch(`http://localhost:3000/api/projects/${projectId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data) {
            projectNameInput.value = DOMPurify.sanitize(data.name);
            projectDescriptionInput.value = DOMPurify.sanitize(data.description);

            // Fetch owner's name
            fetch(`http://localhost:3000/api/users/${data.created_by}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${jwtToken}`,
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(userData => {
                if (userData) {
                    ownerName.textContent = DOMPurify.sanitize(userData.username || "Unknown");
                } else {
                    ownerName.textContent = "Unknown";
                }
            })
            .catch(error => {
                console.error("Error fetching owner details:", error);
                ownerName.textContent = "Unknown";
            });

            // Fetch members of the project
            fetch(`http://localhost:3000/api/projects/${projectId}/members`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${jwtToken}`,
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(members => {
                if (Array.isArray(members)) {
                  membersList.innerHTML = ""; // Clear existing members
                  memberCount.textContent = members.length;
                  members.forEach((member) => {
                    // Fetch member details
                    fetch(`http://localhost:3000/api/users/${member.user_id}`, {
                      method: "GET",
                      headers: {
                        Authorization: `Bearer ${jwtToken}`,
                        "Content-Type": "application/json",
                      },
                    })
                      .then((response) => response.json())
                      .then((userData) => {
                        if (userData) {
                          const memberItem = document.createElement("div");
                          memberItem.classList.add("member-item");
                          memberItem.innerHTML = `
                                    <span>${DOMPurify.sanitize(
                                      userData.username || "Unknown"
                                    )}</span> | 
                                    <span>${DOMPurify.sanitize(
                                      member.role
                                    )}</span>

                                `;
                          membersList.appendChild(memberItem);
                        } else {
                          console.error("Failed to load user details.");
                        }
                      })
                      .catch((error) => {
                        console.error("Error fetching user details:", error);
                      });
                  });
                } else {
                    alert("Failed to load members.");
                }
            })
            .catch(error => {
                console.error("Error fetching project members:", error);
            });

             // Fetch tasks of the project
             fetch(`http://localhost:3000/api/tasks/project/${projectId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            })
            .then(response => response.json())
            .then(tasksData => {
                const tasksTableBody = document.querySelector("#tasksTable tbody");
                const taskCounter = document.getElementById("taskCounter");
                const taskRange = document.getElementById("taskRange");

                // Filter tasks to exclude those with status 'done'
                const filteredTasks = tasksData.filter(task => task.status.toLowerCase() !== 'done');

                if (filteredTasks.length > 0) {
                    tasksTableBody.innerHTML = ""; // Clear previous content

                    filteredTasks.forEach(async (task) => {
                        // Fetch the user name by user ID
                        const userResponse = await fetch(
                            `http://localhost:3000/api/users/${task.assigned_to}`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${jwtToken}`,
                                },
                            }
                        );
                        const userData = await userResponse.json();

                        // Add the task to the table
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>${DOMPurify.sanitize(task.title)}</td>
                            <td>${DOMPurify.sanitize(userData.username)}</td>
                            <td>${DOMPurify.sanitize(task.description)}</td>
                            <td>${DOMPurify.sanitize(task.status)}</td>
                            <td>${new Date(task.due_date).toLocaleDateString()}</td>
                            <td><button class="pen-icon-btn"><i class="fas fa-pen"></i></button></td>
                        `;
                        // Add click event listener to pen icon button
                    row.querySelector(".pen-icon-btn").addEventListener("click", () => {
                    // Save taskId to localStorage
                    localStorage.setItem("viewTaskId", task.id);
                    // Redirect to viewTask.html
                    window.location.href = "viewTask.html";
                });
                        tasksTableBody.appendChild(row);
                    });

                    // Update task counter
                    taskRange.value = filteredTasks.length;
                    taskCounter.textContent = `Tasks: ${filteredTasks.length}`;
                } 

                // Search feature
                const searchTasksInput = document.getElementById("searchTasks");

                searchTasksInput.addEventListener("input", () => {
                    const searchQuery = searchTasksInput.value.toLowerCase();
                    const rows = tasksTableBody.querySelectorAll("tr");

                    rows.forEach(row => {
                        const userCell = row.cells[1];
                        const userName = userCell.textContent.toLowerCase();

                        if (userName.includes(searchQuery)) {
                            row.style.display = "";
                        } else {
                            row.style.display = "none";
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Error fetching tasks:", error);
            });

            // Fetch done tasks of the project
            fetch(`http://localhost:3000/api/tasks/project/${projectId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            })
            .then(response => response.json())
            .then(tasksData => {
                const done_tasksTableBody = document.querySelector("#done-tasksTable tbody");
                const done_taskCounter = document.getElementById("done-taskCounter");
                const done_taskRange = document.getElementById("done-taskRange");

                // Filter tasks to exclude those with status 'done'
                const filteredTasks = tasksData.filter(task => task.status.toLowerCase() === 'done');

                if (filteredTasks.length > 0) {
                    done_tasksTableBody.innerHTML = ""; // Clear previous content

                    filteredTasks.forEach(async (task) => {
                        // Fetch the user name by user ID
                        const userResponse = await fetch(
                            `http://localhost:3000/api/users/${task.assigned_to}`,
                            {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${jwtToken}`,
                                },
                            }
                        );
                        const userData = await userResponse.json();

                        // Add the task to the table
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>${DOMPurify.sanitize(task.title)}</td>
                            <td>${DOMPurify.sanitize(userData.username)}</td>
                            <td>${DOMPurify.sanitize(task.description)}</td>
                            <td>${DOMPurify.sanitize(task.status)}</td>
                            <td>${new Date(task.due_date).toLocaleDateString()}</td>
                        `;
                        
                        done_tasksTableBody.appendChild(row);
                    });

                    // Update task counter
                    done_taskRange.value = filteredTasks.length;
                    done_taskCounter.textContent = `Tasks: ${filteredTasks.length}`;
                } 

                // Search feature
                const done_searchTasksInput = document.getElementById("done-searchTasks");

                done_searchTasksInput.addEventListener("input", () => {
                    const searchQuery = done_searchTasksInput.value.toLowerCase();
                    const rows = done_tasksTableBody.querySelectorAll("tr");

                    rows.forEach(row => {
                        const titleCell = row.cells[0];
                        const titleName = titleCell.textContent.toLowerCase();

                        if (titleName.includes(searchQuery)) {
                            row.style.display = "";
                        } else {
                            row.style.display = "none";
                        }
                    });
                });
            })
            .catch(error => {
                console.error("Error fetching done tasks:", error);
            });
        } else {
            alert("Failed to load project details.");
        }
    })
    .catch(error => {
        console.error("Error fetching project details:", error);
    });
});
