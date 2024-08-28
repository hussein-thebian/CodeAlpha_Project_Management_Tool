document.addEventListener("DOMContentLoaded", () => {
    const backButton = document.getElementById("backButton");
    const projectForm = document.getElementById("projectForm");
    const projectNameInput = document.getElementById("projectName");
    const projectDescriptionInput = document.getElementById("projectDescription");
    const membersList = document.getElementById("membersList");
    const ownerName = document.getElementById("ownerName");
    const userSelect = $('#userSelect');
    const taskUser= $('#taskUser'); // Use jQuery for Select2
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

    const projectId = localStorage.getItem("myProject");

    if (!projectId) {
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
                                    ${
                                      member.user_id !== userId
                                        ? `<button class="delete-member-button" data-member-id="${member.user_id}">
                                        <i class="fas fa-trash"></i>
                                    </button>`
                                        : ""
                                    }
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

                  // Delegate event handling for delete member buttons to the members list container
                  membersList.addEventListener("click", (e) => {
                    const deleteButton = e.target.closest(
                      ".delete-member-button"
                    );
                    if (deleteButton) {
                      const memberId =
                        deleteButton.getAttribute("data-member-id");
                      const memberName = deleteButton
                        .closest(".member-item")
                        .querySelector("span").textContent;

                      // Show a confirmation dialog before deleting
                      const confirmation = confirm(
                        `Are you sure you want to delete ${memberName}?`
                      );
                      if (confirmation) {
                        deleteMember(memberId);
                      }
                    }
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
                            <td><button class="pen-icon-btn" data-task-id="${task.id}"><i class="fas fa-pen"></i></button></button>
                            <button class="trash-icon-btn" data-task-id="${task.id}"><i class="fas fa-trash"></i></button>  
                            </td>
                        `;
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
          // Delete task functionality
          tasksTableBody.addEventListener("click", (event) => {
            if (event.target.closest(".trash-icon-btn")) {
                const trashButton = event.target.closest(".trash-icon-btn");
                const taskId = trashButton.getAttribute("data-task-id");
    
                // Show confirmation prompt
                if (confirm("Are you sure you want to delete this task?")) {
                    // Delete the task
                    fetch(`http://localhost:3000/api/tasks/${taskId}`, {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                        },
                    })
                    .then(response => {
                        if (response.ok) {
                            // Remove the task row from the table
                            trashButton.closest("tr").remove();
                            // Update task counter
                            taskRange.value = tasksTableBody.querySelectorAll("tr").length;
                            taskCounter.textContent = `Tasks: ${tasksTableBody.querySelectorAll("tr").length}`;
                        } else {
                            console.error("Error deleting task:", response.statusText);
                        }
                    })
                    .catch(error => {
                        console.error("Error deleting task:", error);
                    });
                }
            }
    
            // Edit task functionality
            if (event.target.closest(".pen-icon-btn")) {
                const penButton = event.target.closest(".pen-icon-btn");
                const taskId = penButton.getAttribute("data-task-id");
    
                // Save task_id to localStorage
                localStorage.setItem("editTaskId", taskId);
    
                // Redirect to editTask.html
                window.location.href = "editTask.html";
            }
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

    const addMemberForm = document.getElementById("addMemberForm");
    const roleInput = document.getElementById("role");

    // Fetch users for the dropdown and initialize Select2
    fetch(`http://localhost:3000/api/projects/non-members/${projectId}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Network response was not ok " + response.statusText);
        }
        return response.json();
    })
    .then(users => {
        if (Array.isArray(users)) {
            const userOptions = users.map(user => ({
                id: user.id,
                profile_picture: user.profile_picture,
                text: user.username
            }));

            $(userSelect).select2({
                data: userOptions,
                escapeMarkup: function (markup) { return markup; },
                templateResult: formatState,
                templateSelection: formatState,
                matcher: function(params, data) {
                    if ($.trim(params.term) === '') {
                        return data;
                    }

                    if (data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) {
                        return data;
                    }

                    return null;
                }
            });

            function formatState(state) {
                if (!state.id) {
                    return state.text;
                }
                return $(
                    `<span><img src="http://localhost:3000/uploads/profiles/${state.profile_picture}" class="profile-pic" /> ${state.text}</span>`
                );
            }
        } else {
            console.error("Failed to load users.");
        }
    })
    .catch(error => {
        console.error("Error fetching users:", error);
    });


    const taskForm = document.getElementById("taskForm");
    const taskTitleInput = document.getElementById("taskTitle");
    const taskDescriptionInput = document.getElementById("taskDescription");
    const dueDateInput = document.getElementById("dueDate");

    // Fetch project members and populate taskUser dropdown
fetch(`http://localhost:3000/api/projects/${projectId}/members`, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${jwtToken}`,
        "Content-Type": "application/json"
    }
})
.then(response => {
    if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
    }
    return response.json();
})
.then(members => {
    if (Array.isArray(members)) {
        // Array to hold promises for fetching user details
        const userDetailPromises = members.map(member =>
            fetch(`http://localhost:3000/api/users/${member.user_id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${jwtToken}`,
                    "Content-Type": "application/json"
                }
            }).then(response => response.json())
        );

        // Wait for all user details to be fetched
        Promise.all(userDetailPromises)
            .then(users => {
                const userOptions = users.map(user => ({
                    id: user.id,
                    profile_picture: user.profile_picture,
                    text: user.username
                }));

                // Initialize Select2 with fetched user details
                $(taskUser).select2({
                    data: userOptions,
                    escapeMarkup: function (markup) { return markup; },
                    templateResult: formatState,
                    templateSelection: formatState,
                    matcher: function (params, data) {
                        if ($.trim(params.term) === '') {
                            return data;
                        }

                        if (data.text.toLowerCase().indexOf(params.term.toLowerCase()) > -1) {
                            return data;
                        }

                        return null;
                    }
                });

                function formatState(state) {
                    if (!state.id) {
                        return state.text;
                    }
                    return $(
                        `<span><img src="http://localhost:3000/uploads/profiles/${state.profile_picture}" class="profile-pic" /> ${state.text}</span>`
                    );
                }
            })
            .catch(error => {
                console.error("Error fetching user details:", error);
            });
    } else {
        console.error("Failed to load project members.");
    }
})
.catch(error => {
    console.error("Error fetching project members:", error);
}); 
      // Handle form submission to add a task
      taskForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const taskTitle = DOMPurify.sanitize(taskTitleInput.value);
        const taskDescription = DOMPurify.sanitize(taskDescriptionInput.value);
        const assignedTo = taskUser.val(); // Get the selected user's ID from Select2
        const dueDate = DOMPurify.sanitize(dueDateInput.value);

        // Validate due date
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        if (dueDate <= today) {
            alert("Due date must be greater than today.");
            return;
        }

        if (!taskTitle || !taskDescription || !assignedTo || !dueDate) {
            alert("Please fill in all fields.");
            return;
        }

        const newTask = {
            project_id: projectId,
            title: taskTitle,
            description: taskDescription,
            assigned_to: assignedTo,
            status: 'pending', // Default status for a new task
            due_date: dueDate
        };

        fetch(`http://localhost:3000/api/tasks/add`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newTask)
        })
        .then(response => response.json())
        .then(data => {
            if (data && !data.message) {
                alert("Task added successfully!");
                location.reload();
            } else {
                alert(data.message || "Failed to add task.");
            }
        })
        .catch(error => {
            console.error("Error adding task:", error);
        });
    });

    // Add member form submission
    addMemberForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const selectedUserId = userSelect.val(); // Get the selected user's ID from Select2
        const role = DOMPurify.sanitize(roleInput.value);

        if (!selectedUserId || !role) {
            alert("Please select a user and specify a role.");
            return;
        }

        const newMember = {
            project_id: projectId,
            user_id: selectedUserId,
            role: role
        };

        fetch(`http://localhost:3000/api/projects/addMember`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newMember)
        })
        .then(response => response.json())
        .then(data => {
            if (data && !data.message) {
                alert("Member added successfully!");
                location.reload(); // Reload the page to refresh the members list
            } else {
                alert(data.message || "Failed to add member.");
            }
        })
        .catch(error => {
            console.error("Error adding member:", error);
        });
    });
    // Function to delete a member
    function deleteMember(memberId) {
        fetch(`http://localhost:3000/api/projects/removeMember`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                project_id: projectId,
                user_id: memberId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Member deleted successfully!");
                // Refresh the members list
                location.reload();
            } else {
                alert(data.message || "Failed to delete member.");
            }
        })
        .catch(error => {
            console.error("Error deleting member:", error);
        });
    }

    // Handle form submission to update project
    projectForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const updatedProject = {
            name: DOMPurify.sanitize(projectNameInput.value),
            description: DOMPurify.sanitize(projectDescriptionInput.value)
        };

        fetch(`http://localhost:3000/api/projects/${projectId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${jwtToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedProject)
        })
        .then(response => response.json())
        .then(data => {
            if (data && !data.message) {
                alert("Project updated successfully!");
            } else {
                alert(data.message || "Failed to update project.");
            }
        })
        .catch(error => {
            console.error("Error updating project:", error);
        });
    });
});
