// Check if the user is logged in based on cookies
// function checkCookie() {
//     var username = getCookie("username");  // Get the username cookie
//     if (!username) {
//         window.location = "login.html";  // Redirect if no username cookie
//     }
// }

// Call the checkCookie function to validate the cookie before showing feed
// checkCookie();

window.onload = pageLoad;

// Helper function to get cookies
function getCookie(name){
	var value = "";
	try{
		value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1]
		return value
	}catch(err){
		return false
	} 
}

// Page Load logic
function pageLoad() {
    document.getElementById('postbutton').onclick = getData;

	document.getElementById('displayPic').onclick = fileUpload;
	
	var username = getCookie('username');

	document.getElementById("username").textContent = username;
	console.log(getCookie('img'));
	// showImg('img/'+getCookie('img'));
	readPost();
}

// Function to get new post data
function getData() {
    var msg = document.getElementById("textmsg").value;
    document.getElementById("textmsg").value = "";  // Clear the input field
    writePost(msg);  // Write new post to the server
}

// Trigger the file upload dialog when the profile picture area is clicked
function fileUpload() {
    document.getElementById('fileField').click();
}

// Handle the file submission for uploading a profile picture
async function fileSubmit() {
    const formData = new FormData(document.getElementById('formId'));
    formData.append('isAvatarUpload', 'true');

    try {
        let response = await fetch('/profilepic', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            if (result.newImageFilename) {
                // Update the cookie with the new image filename (plain filename)
                document.cookie = `img=${result.newImageFilename.split('/').pop()}; path=/`;  // Store just the filename, no '/img/'
                showImg(result.newImageFilename); // Display the new image
                console.log("Image uploaded and displayed!");
            } else {
                console.error("No new image filename returned after upload.");
            }
        } else {
            console.error("Error uploading image:", response.statusText);
        }
    } catch (error) {
        console.error("Error during file submission:", error);
    }
}

// Function to display the profile picture in the specified area
function showImg(filename) {
    if (filename !== "") {
        var showpic = document.getElementById('displayPic');
        showpic.innerHTML = "";  // Clear previous image
        var temp = document.createElement("img");
        
        // Check if the filename includes "/img/" or not
        if (filename.startsWith('/img/')) {
            temp.src = filename;  // Use the path directly if it starts with '/img/'
        } else {
            temp.src = `/img/${filename}`;  // Otherwise prepend '/img/'
        }

        temp.alt = "Profile Picture"; // Add alt text for accessibility
        temp.style.width = "100px"; // Optional: set width
        temp.style.height = "100px"; // Optional: set height
        showpic.appendChild(temp); // Append the new image to the display area
    }
}


// Fetch posts from the server
async function readPost() {
    try {
        let response = await fetch('/readPost');
        let data = await response.json();
        showPost(data);  // Display the posts after fetching
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

// Write a new post to the server
async function writePost(msg) {
    var username = getCookie('username');

    try {
        let response = await fetch('/writePost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: username, message: msg })
        });

        if (response.ok) {
            readPost();  // Refresh the posts after posting
        } else {
            console.error('Failed to post message');
        }
    } catch (error) {
        console.error('Error posting message:', error);
    }
}

// Display posts in the feed
function showPost(data) {
    var divTag = document.getElementById("feed-container");
    divTag.innerHTML = "";  // Clear the previous posts

    data.forEach(post => {
        var temp = document.createElement("div");
        temp.className = "newsfeed";
        divTag.appendChild(temp);

        var temp1 = document.createElement("div");
        temp1.className = "postmsg";
        temp1.innerHTML = post.message;  // Display post message
        temp.appendChild(temp1);

        var temp2 = document.createElement("div");
        temp2.className = "postuser";
        temp2.innerHTML = "Posted by: " + post.username;  // Display username of poster
        temp.appendChild(temp2);
    });
}
