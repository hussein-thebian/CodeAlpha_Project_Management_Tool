document.addEventListener('DOMContentLoaded', () => {
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
    const backButton = document.getElementById('backButton'); // Ensure backButton is defined
    if (backButton) {
        backButton.addEventListener("click", () => {
            window.history.back();
        });
    }

    // Fetch the task ID from localStorage
    const taskId = localStorage.getItem('editTaskId');
    const commentsList = document.getElementById('commentsList');
    const commentCount = document.getElementById('commentCount');
    
    if (taskId) {
        // Fetch task details
        fetch(`http://localhost:3000/api/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`,
            },
        })
        .then(response => response.json())
        .then(task => {
            if (task) {
                // Fetch project name
                fetch(`http://localhost:3000/api/projects/${task.project_id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                })
                .then(response => response.json())
                .then(project => {
                    document.getElementById('projectName').value = DOMPurify.sanitize(project.name);
                    document.getElementById('projectId').value = project.id;
                });

                // Fetch assigned user details
                fetch(`http://localhost:3000/api/users/${task.assigned_to}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                })
                .then(response => response.json())
                .then(user => {
                    document.getElementById('assignedTo').value = DOMPurify.sanitize(user.username);
                    document.getElementById('assignedToId').value = user.id;
                });

                // Populate task form
                document.getElementById('title').value = DOMPurify.sanitize(task.title);
                document.getElementById('description').value = DOMPurify.sanitize(task.description);
                document.getElementById('status').value = DOMPurify.sanitize(task.status);
                
                // Format and display the due date
                const dueDateDisplay = document.getElementById('dueDateDisplay');
                dueDateDisplay.textContent = `Due Date: ${new Date(task.due_date).toLocaleDateString()}`; // Display formatted due date
            }
        })
        .catch(error => {
            console.error('Error fetching task details:', error);
        });

// Fetch comments by task ID
fetch(`http://localhost:3000/api/comments/task/${taskId}`, {
    method: 'GET',
    headers: {
        Authorization: `Bearer ${jwtToken}`,
    },
})
.then(response => response.json())
.then(comments => {
    commentCount.textContent = `(${comments.length})`;
    commentsList.innerHTML = ''; // Clear previous comments
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet.</p>';
    } else {
        // Create an array of promises to fetch user info for each comment
        const userPromises = comments.map(comment => {
            return fetch(`http://localhost:3000/api/users/${comment.user_id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
            })
            .then(response => response.json())
            .then(user => ({
                comment,
                user
            }));
        });

        // Use Promise.all to wait for all user fetches to complete
        Promise.all(userPromises)
        .then(results => {
            results.forEach(({ comment, user }) => {
                const commentItem = document.createElement('div');
                commentItem.className = 'comment-item';
                commentItem.innerHTML = `
                    <img src="http://localhost:3000/uploads/profiles/${user.profile_picture}" alt="${user.username}'s profile picture">
                    <div>
                        <span class="comment-username">${user.username}:</span>
                        <p class="comment-text">${DOMPurify.sanitize(comment.content)}
                        ${comment.user_id === userId ? `<span class="delete-comment-button" data-comment-id="${comment.id}">🗑️</span>` : ''}
                        </p>
                    </div>
                `;
                commentsList.appendChild(commentItem);
            });

            // Add event listener for delete buttons
            commentsList.addEventListener('click', event => {
                if (event.target.classList.contains('delete-comment-button')) {
                    const commentId = event.target.getAttribute('data-comment-id');
                    fetch(`http://localhost:3000/api/comments/${commentId}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${jwtToken}`,
                        },
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result) {
                            alert('Comment deleted successfully');
                            location.reload(); // Reload to update comments list
                        } else {
                            alert('Failed to delete comment');
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting comment:', error);
                        alert('Error deleting comment');
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error fetching user information:', error);
        });
    }
})
.catch(error => {
    console.error('Error fetching comments:', error);
});

        // Add comment functionality
        document.getElementById('addCommentButton').addEventListener('click', () => {
            const commentContent = document.getElementById('commentInput').value.trim();
            
            if (commentContent) {
                fetch(`http://localhost:3000/api/comments/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${jwtToken}`
                    },
                    body: JSON.stringify({
                        task_id: taskId,
                        user_id: userId,
                        content: commentContent
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result) {
                        alert('Comment posted successfully');
                        location.reload(); // Reload to update comments list
                    } else {
                        alert('Failed to post comment');
                    }
                })
                .catch(error => {
                    console.error('Error posting comment:', error);
                    alert('Error posting comment');
                });
            }
        });

        // Update button functionality
        document.getElementById('updateButton').addEventListener('click', () => {
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const assignedToId = document.getElementById('assignedToId').value; // Use user ID
            const status = document.getElementById('status').value;
            const dueDate = document.getElementById('dueDate').value;
            const projectId = document.getElementById('projectId').value; // Use project ID

            // Prepare the updated task data
            const updatedTask = {
                title: title,
                description: description,
                assigned_to: assignedToId, // Use user ID
                status: status,
                project_id: projectId // Use project ID
            };

            // Include due_date only if it is provided
            if (dueDate) {
                updatedTask.due_date = dueDate;
            }

            // Send update request to the server
            fetch(`http://localhost:3000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwtToken}`
                },
                body: JSON.stringify(updatedTask)
            })
            .then(response => response.json())
            .then(result => {
                if (result) {
                    alert('Task updated successfully');
                    location.reload();
                } else {
                    alert('Failed to update task');
                }
            })
            .catch(error => {
                console.error('Error updating task:', error);
                alert('Error updating task');
            });
        });
    } else {
        console.error('No task ID found in localStorage.');
    }
});
