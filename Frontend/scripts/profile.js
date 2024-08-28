function logout() {
    // Display confirmation dialog
    console.log("Logout function called");
    const isConfirmed = window.confirm("Are you sure you want to log out?");
    if (!isConfirmed) {
        // User clicked "Cancel", exit the function
        return;
    }

    // Retrieve token from local storage
    const jwtToken = localStorage.getItem("pmToken");

    if (!jwtToken) {
        // No token found, redirect to login
        window.location.href = "../pages/login.html";
        return;
    }

    // Send logout request to server
    fetch("http://localhost:3000/api/users/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
        },
    })
    .then(response => {
        if (response.ok) {
            // Remove token and redirect to login
            localStorage.removeItem("pmToken");
            window.location.href = "../pages/login.html";
        } else {
            console.error("Failed to log out");
        }
    })
    .catch(error => console.error("Error logging out:", error));
};


document.addEventListener("DOMContentLoaded", async () => {
  const profileForm = document.getElementById("profileForm");
  const profilePhoto = document.getElementById("profilePhoto");
  const showPasswordCheckbox = document.getElementById("showPassword");
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

  const addProjectBtn = document.getElementById("addProjectBtn");

    addProjectBtn.addEventListener("click", () => {
      window.location.href = "../pages/createProject.html"; // Redirect to createProject.html
    });

  try {
    // Fetch user information
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    const data = await response.json();

    if (response.ok) {
      document.getElementById("username").value = DOMPurify.sanitize(
        data.username
      );
      document.getElementById("email").value = DOMPurify.sanitize(data.email);
      if (data.profile_picture) {
        profilePhoto.src = `http://localhost:3000/uploads/profiles/${data.profile_picture}`;
      }
    } else {
      alert("Failed to fetch user data.");
    }

    // Fetch projects where the user is the owner
    const projectsResponse = await fetch(
      `http://localhost:3000/api/projects/owner/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    const projectsData = await projectsResponse.json();

    if (projectsResponse.ok) {
      const noProjectsMessage = document.getElementById("noProjectsMessage");
      const projectsList = document.getElementById("projectsList");

      if (projectsData.length > 0) {
        noProjectsMessage.style.display = "none";
        projectsList.innerHTML = ""; // Clear previous content

        projectsData.forEach((project) => {
          const projectItem = document.createElement("li");
          projectItem.textContent = `${DOMPurify.sanitize(
            project.name
          )} - ${new Date(project.created_at).toLocaleDateString()}`;
          projectsList.appendChild(projectItem);

          // Add click event listener to save project ID and redirect
          projectItem.addEventListener("click", () => {
            localStorage.setItem("myProject", project.id);
            window.location.href = "../pages/myProject.html";
          });
        });
      } else {
        noProjectsMessage.style.display = "block";
      }
    } else {
      alert("Failed to fetch projects.");
    }

    // Fetch projects where the user is a member
    const memberProjectsResponse = await fetch(
      `http://localhost:3000/api/projects/members/${userId}/projects`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    const memberProjects = await memberProjectsResponse.json();

    const workList = document.getElementById("workList");
    const noWorkMessage = document.getElementById("noWorkMessage");

    if (memberProjects.length === 0) {
      noWorkMessage.style.display = "block";
      workList.style.display = "none";
    } else {
      noWorkMessage.style.display = "none";
      workList.style.display = "block";

      for (const memberProject of memberProjects) {
        console.log("Member Project:", memberProject);

        // Fetch role and joined_at information
        const roleResponse = await fetch(
          `http://localhost:3000/api/projects/info/${memberProject.id}/users/${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );
        const roleData = await roleResponse.json();

        const workItem = document.createElement("li");
        workItem.textContent = `${DOMPurify.sanitize(
          memberProject.name
        )} - Role: ${DOMPurify.sanitize(roleData.role)} - Joined: ${new Date(
          roleData.joined_at
        ).toLocaleDateString()}`;
        workList.appendChild(workItem);
        // Add event listener to save projectId to localStorage and redirect
        workItem.addEventListener("click", () => {
        localStorage.setItem("viewProjectId", memberProject.id);
        window.location.href = "../pages/viewProject.html";
      });
      }
    }

    // Fetch tasks assigned to the user
    const tasksResponse = await fetch(
      `http://localhost:3000/api/tasks/assigned/${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );
    const tasksData = await tasksResponse.json();

    const tasksTableBody = document.querySelector("#tasksTable tbody");
    const taskCounter = document.getElementById("taskCounter");
    const taskRange = document.getElementById("taskRange");
    const filteredTasks = tasksData.filter(task => task.status.toLowerCase() !== 'done');

    if (filteredTasks.length > 0) {
      tasksTableBody.innerHTML = ""; // Clear previous content

      filteredTasks.forEach(async (task) => {
        // Fetch the project name by project ID
        const projectResponse = await fetch(
          `http://localhost:3000/api/projects/${task.project_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          }
        );
        const projectData = await projectResponse.json();

        // Add the task to the table
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${DOMPurify.sanitize(task.title)}</td>
                <td>${DOMPurify.sanitize(projectData.name)}</td>
                <td>${DOMPurify.sanitize(task.description)}</td>
                <td>${DOMPurify.sanitize(task.status)}</td>
                <td>${new Date(task.due_date).toLocaleDateString()}</td>
                <td><button class="pen-icon-btn"><i class="fas fa-pen"></i></button></td>
            `;
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
        const projectCell = row.cells[1];
        const projectName = projectCell.textContent.toLowerCase();

        if (projectName.includes(searchQuery)) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while fetching data.");
  }

  // Show or hide the password
  showPasswordCheckbox.addEventListener("change", () => {
    const passwordInput = document.getElementById("password");
    passwordInput.type = showPasswordCheckbox.checked ? "text" : "password";
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Sanitize input values
    const username = DOMPurify.sanitize(
      document.getElementById("username").value
    );
    const email = DOMPurify.sanitize(document.getElementById("email").value);
    const password = DOMPurify.sanitize(
      document.getElementById("password").value
    );
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    if (password) {
      formData.append("password", password);
    }
    if (document.getElementById("profilePicture").files[0]) {
      formData.append(
        "profile_picture",
        document.getElementById("profilePicture").files[0]
      );
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        alert("Profile updated successfully.");
        window.location.reload(); // Reload the page to reflect changes
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while updating the profile.");
    }
  });
});
