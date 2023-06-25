function try_login() {
    // Get the email and password from the form
    var email = document.getElementById("login-email-input").value;
    var pw = document.getElementById("login-password-input").value;

    // Sign in with email and password
    auth.signInWithEmailAndPassword(email, pw).then((userCredential) => {
        // Create a cookie that the user has an account (if it doesn't exist)
        if (!document.cookie.includes('account')) {
            var d = new Date();
            d.setTime(d.getTime() + (365*24*60*60*1000));
            var expires = "expires="+ d.toUTCString();
            document.cookie = "account=true;" + expires + ";path=/";
        }
        
        // Redirect to dashboard or window["redirect"] if it exists
        console.log("Try login")
        window.location.href = (window["redirect"] ? window["redirect"] : "../dash/dash.html")
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
        // Create a cookie that the user has an account
        var d = new Date();
        d.setTime(d.getTime() + (365*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = "account=true;" + expires + ";path=/";

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
    loadTheme();
    // Check cookie for whether the user has an account
    if (document.cookie.includes('account')) {
        // Show login page
        document.getElementById("login").style.display = "flex";
    }
    else {
        // Show signup page
        document.getElementById("signup").style.display = "flex";
    }

    document.getElementById("login-error").addEventListener("DOMSubtreeModified", () => { errorChanged(document.getElementById("login-error")) });
    document.getElementById("signup-error").addEventListener("DOMSubtreeModified", () => { errorChanged(document.getElementById("signup-error")) });
}

function errorChanged(element) {
    // If the error message is not empty
    if (element.innerHTML != "") {
        // Reset the error message after the user clicks the submit button
        var resetError = () => {
            element.innerHTML = "";
            document.querySelectorAll("#login-submit, #signup-submit, #login-bottom a, #signup-bottom a").forEach((element) => { element.removeEventListener("click", resetError) });
        }
        document.querySelectorAll("#login-submit, #signup-submit, #login-bottom a, #signup-bottom a").forEach((element) => { element.addEventListener("click", resetError) });

    }
}

function start() {
    // Check if the user has a url hash of '#logout'
    if (window.location.hash == '#logout') {
        // Log the user out
        auth.signOut().then(() => {
            // Redirect to login page
            console.log("Logged out")
            window.location.href = "../login/login.html";
        })
    }
    // Check if the user is logged in
    if (auth.currentUser) {
        // Redirect to dashboard or window["redirect"] if it exists
        console.log("Logged in")

        // Check if the account is new
        if (auth.currentUser.metadata.creationTime == auth.currentUser.metadata.lastSignInTime) {
            // Create a user document in the database with the same id as the user, and the name and email
            db.collection("users").doc(auth.currentUser.uid).set({
                name: document.getElementById("signup-name-input").value,
                email: auth.currentUser.email
            }).then(() => {
                window.location.href = (window["redirect"] ? window["redirect"] : "../dash/dash.html")
            }).catch((error) => {
                console.error("Error writing document: ", error);
            });
        }
    }
    // Get the redirect url if it exists
    if (window.location.search.includes('redirect')) {
        window["redirect"] = window.location.search.split('redirect=')[1];
    }
}