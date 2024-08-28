document.addEventListener("DOMContentLoaded", () => {
    const createProjectForm = document.getElementById("createProjectForm");
    const backButton = document.getElementById("backButton");

    // Redirect to login if no JWT token is present
    const jwtToken = localStorage.getItem("pmToken");
    if (!jwtToken) {
        window.location.href = "../pages/login.html";
        return;
    }

    // Check if the token is expired
    if (isTokenExpired(jwtToken)) {
        alert("Your session has expired. Please log in again.");
        localStorage.removeItem("pmToken"); // Remove the expired token
        window.location.href = "../pages/login.html";
        return;
    }

    // Decode JWT to get user ID
    const decodedToken = jwtDecode(jwtToken);
    const userId = decodedToken.id;

    // Handle back button
    backButton.addEventListener("click", () => {
        window.history.back();
    });

    // Handle form submission
    createProjectForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const description = document.getElementById("description").value;

        try {
            const response = await fetch("http://localhost:3000/api/projects/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ name, description, created_by: userId })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Project created successfully!");
                window.location.href = "../pages/profile.html"; // Redirect after success
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error creating project:", error);
            alert("An error occurred while creating the project. Please try again.");
        }
    });
});
