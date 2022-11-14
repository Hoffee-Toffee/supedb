function try_login() {
    // Get the email and password from the form
    var email = document.getElementById("login-email-input").value;
    var pw = document.getElementById("login-password-input").value;

    // Sign in with email and password
    auth.signInWithEmailAndPassword(email, pw).then((userCredential) => {
        // Redirect to dashboard
        window.location.href = "/src/dash/dash.html";
    }).catch((error) => {
        // Display error message
        document.getElementById("login-error").innerHTML = error.message;
    });
}

function try_signup() {
    // Get the name, email, and password from the form
    var name = document.getElementById("signup-name-input").value;
    var email = document.getElementById("signup-email-input").value;
    var password = document.getElementById("signup-password-input").value;

    auth.createUserWithEmailAndPassword(email, password).then((userCredential) => {    
        // Get date ten years from now (for cookie expiry)
        var now = new Date();
        var expires = new Date(now.getTime() + 3153600000000);

        document.cookie = "account=new; expires=" + expires.toUTCString() + "; path=/";

        // Set the username of the user
        userCredential.user.updateProfile({
            displayName: name
        })

        // Redirect to dashboard
        window.location.href = "/src/dash/dash.html";
    }).catch((error) => {
        // Display error message
        document.getElementById("signup-error").innerHTML = error.message;
    });
}

function switch_to_login() {
    // Copy the email and password from the sign up form to the login form
    document.getElementById("login-email-input").value = document.getElementById("signup-email-input").value;
    document.getElementById("login-password-input").value = document.getElementById("signup-password-input").value;
    // Hide the sign up form and show the login form
    document.getElementById("signup").style.display = "none";
    document.getElementById("login").style.display = "flex";
}

function switch_to_signup() {
    // Copy the email and password from the login form to the sign up form
    document.getElementById("signup-email-input").value = document.getElementById("login-email-input").value;
    document.getElementById("signup-password-input").value = document.getElementById("login-password-input").value;
    // Hide the login form and show the sign up form
    document.getElementById("login").style.display = "none";
    document.getElementById("signup").style.display = "flex";
}

function forgot_password() {
    // Get the email from the form
    var email = document.getElementById("login-email-input").value;
    // Send a password reset email
    auth.sendPasswordResetEmail(email).then(() => {
        // Display success message
        document.getElementById("login-error").innerHTML = "Password reset email sent to " + email;
    }).catch((error) => {
        // Display error message
        document.getElementById("login-error").innerHTML = error.message;
    });
}

window.onload = function() {
    // Check cookie for whether the user has an account
    if (document.cookie.includes('account')) {
        // Show login page
        document.getElementById("login").style.display = "flex";
    }
    else {
        // Show signup page
        document.getElementById("signup").style.display = "flex";
    }
}

function start() {
    // Check if the user has a url hash of '#logout'
    if (window.location.hash == '#logout') {
        // Log the user out
        auth.signOut().then(() => {
            // Redirect to login page
            window.location.href = "/src/login/login.html";
        })
    }
    // Check if the user is logged in
    if (auth.currentUser) {
        // Redirect to dashboard
        window.location.href = "/src/dash/dash.html";
    }
}