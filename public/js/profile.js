// Check if the user is logged in based on cookies
function checkCookie() {
    var username = getCookie("username");  // Get the username cookie
    if (!username) {
        window.location = "login.html";  // Redirect if no username cookie
    }
}

// Call the checkCookie function to validate the cookie before showing feed
checkCookie();

window.onload = pageLoad;

// Helper function to get cookies
function getCookie(name) {
    var value = "";
    try {
        value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1]
        return value
    } catch (err) {
        return false
    }
}

// Page Load logic
function pageLoad() {
    console.log("in pageLoad");

    document.getElementById('displayPic').onclick = fileUpload;
    document.getElementById('feed').onclick = toFeed;
    document.getElementById('logout').onclick = logout;


    var username = getCookie('username');

    document.getElementById("username").textContent = username;
    console.log(getCookie('img'));
    showImg(getCookie('img'));
    readPost();
}

function toFeed(){
        window.location.href = "http://localhost:3000/feed.html";
}
function logout(){
    window.location.href = "http://localhost:3000/logout";
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

function toProfile() {
    window.location.href = "http://localhost:3000/profile.html";
}

// Write a new post to the server
// async function writePost() {
//     let newJson = JSON.stringify({
//         user: getCookie('username'),
//         message: document.getElementById('post-text').value
//     });
//     console.log(document.getElementById('post-text').value);
//     document.getElementById('post-text').value = '';

//     let response = await fetch("/writePost", {
//         method: "POST",
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         },
//         body: newJson,
//     });

//     readPost();
// }

// Display posts in the feed

//need REFACTOR
async function showPost(data) {

    var keys = Object.keys(data);
    var posts = document.getElementById("posts");
    posts.innerHTML = "";  // Clear the previous posts


    for (var i = keys.length - 1; i >= 0; i--) {
        let postID = data[keys[i]]["post_id"];
        let post_owner = data[keys[i]]["username"];

        if(getCookie("username") != post_owner){
            continue
        }

        var temparticle = document.createElement("article");
        temparticle.className = "feed-post";
        posts.appendChild(temparticle);

        var tempcontainer = document.createElement("div");
        tempcontainer.className = "post-content";
        temparticle.appendChild(tempcontainer);

        var tempheader = document.createElement("header");
        tempheader.className = "post-header";
        tempcontainer.appendChild(tempheader);

        var tempPostOwner = document.createElement("h2");
        tempPostOwner.className = "post-author";
        tempPostOwner.innerHTML = post_owner;
        tempheader.appendChild(tempPostOwner);

        var tempdate = document.createElement("p");
        tempdate.className = "post-date";
        let postDate = new Date(data[keys[i]]["post_date"])

        const localDate = new Date(postDate.getTime() - postDate.getTimezoneOffset() * 60000);

        const formattedDate = localDate.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        tempdate.innerHTML = (formattedDate);
        tempheader.appendChild(tempdate);

        var tempcontent = document.createElement("p");
        tempcontent.className = "post-text";
        tempcontent.innerHTML = data[keys[i]]["content"];
        tempcontainer.appendChild(tempcontent);

        var tempFooter = document.createElement("footer");
        tempFooter.className = "post-actions";
        tempcontainer.appendChild(tempFooter);

        var likecount = await getlikecount(data[keys[i]]["post_id"]);
        var tempLike = document.createElement("button");
        tempLike.ariaLabel = "Like Post";
        
        tempLike.innerHTML = "👍 " + JSON.stringify(likecount);
        tempFooter.appendChild(tempLike);
    }


}

async function getlikecount(postid) {
    // console.log("postid");
    // console.log(postid);
    let response = await fetch(`/getlikecount?post_id=${postid}`);
    let data = await response.json();
    // console.log(data[0]["like_count"]);
    return data[0]["like_count"];
}

async function likethispost(username, postid) {
    let response = await fetch("/likethispost", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: username,
            postid: postid
        }),
    });
    readPost();
}

async function getImage(username) {
    let response = await fetch("/getAvatarImage", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user: username,
        }),
    });

    const data = await response.json();
    //console.log(data.avatarUrl);
    return data.avatarUrl;
}


