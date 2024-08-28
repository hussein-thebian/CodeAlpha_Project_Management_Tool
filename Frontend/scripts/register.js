document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Clear any previous error messages
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');

        // Sanitize input values
        const username = DOMPurify.sanitize(document.getElementById('username').value);
        const email = DOMPurify.sanitize(document.getElementById('email').value);
        const password = DOMPurify.sanitize(document.getElementById('password').value);
        const profilePicture = document.getElementById('profilePicture').files[0];

        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('profile_picture', profilePicture);

        try {
            const response = await fetch('http://localhost:3000/api/users/add', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                // Redirect to login page if registration is successful
                alert("Account Created Successfully");
                window.location.href = '../pages/login.html'; 
            } else {
                // Display error message
                errorMessage.textContent = data.message || 'An error occurred while registering.';
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'An error occurred while registering.';
            errorMessage.classList.remove('hidden');
        }
    });
});
