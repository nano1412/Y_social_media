// Check if the user is logged in based on cookies
function checkCookie() {
    var username = getCookie("username"); // Get the username cookie
    if (!username) {
        window.location = "login.html"; // Redirect if no username cookie
    }
}

// Call the checkCookie function to validate the cookie before showing feed
checkCookie();

window.onload = pageLoad;

// Helper function to get cookies
function getCookie(name) {
    var value = "";
    try {
        value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1];
        return value;
    } catch (err) {
        return false;
    }
}

// Page Load logic
function pageLoad() {
    console.log("in pageLoad");

    var username = getCookie("username");
    document.getElementById("username").textContent = username;

    // Check and display the profile image from the cookie
    var imgFilename = getCookie("img");
    console.log("Image filename from cookie: " + imgFilename);

    if (!imgFilename) {
        imgFilename = "avatar.png"; // Default image if no img cookie
        document.cookie = `img=${imgFilename}; path=/`; // Set default image cookie
    }

    showImg("img/" + imgFilename); // Display image from the cookie

    readPost();

    // Handle "Go to Profile" button
    const profileBtn = document.getElementById("toProfile");
    if (profileBtn) {
        profileBtn.onclick = toProfile; // Navigate to the profile page when clicked
    }
}

// Display profile picture
function showImg(filename) {
    if (filename !== "") {
        var showpic = document.getElementById("displayPic");
        showpic.innerHTML = ""; // Clear any previous content
        var temp = document.createElement("img");
        temp.src = filename.startsWith("/img/") ? filename : `/img/${filename}`;
        temp.alt = "Profile Picture";
        temp.style.width = "100px";
        temp.style.height = "100px";
        temp.style.borderRadius = "50%"; // Circular image
        showpic.appendChild(temp);
    }
}

// Fetch posts from the server
async function readPost() {
    try {
        let response = await fetch("/readPost");
        let data = await response.json();
        showPost(data); // Display posts
    } catch (error) {
        console.error("Error fetching posts:", error);
    }
}

// Handle the "like" button click
async function likePost(postId) {
    const username = getCookie("username");

    try {
        const response = await fetch("/likePost", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                post_id: postId,
                username: username,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const likeButton = document.getElementById(`like-button-${postId}`);
            likeButton.innerHTML = `👍 ${data.like_count}`; // Update the like count
        } else {
            console.error("Failed to like the post.");
        }
    } catch (error) {
        console.error("Error liking post:", error);
    }
}

// Display posts and add the like button
async function showPost(data) {
    const keys = Object.keys(data);
    const posts = document.getElementById("feed-posts");
    posts.innerHTML = ""; // Clear previous posts

    for (let i = keys.length - 1; i >= 0; i--) {
        const post = data[keys[i]];
        const postID = post.post_id;

        const tempArticle = document.createElement("article");
        tempArticle.className = "feed-post";
        posts.appendChild(tempArticle);

        // User profile image
        const tempImg = document.createElement("img");
        tempImg.id = "postProfile";
        tempImg.src = `img/${await getImage(post.username)}`;
        tempImg.alt = post.username;
        tempArticle.appendChild(tempImg);

        // Post content container
        const tempContainer = document.createElement("div");
        tempContainer.className = "post-content";
        tempArticle.appendChild(tempContainer);

        // Post header
        const tempHeader = document.createElement("header");
        tempHeader.className = "post-header";
        tempContainer.appendChild(tempHeader);

        const tempPostOwner = document.createElement("h2");
        tempPostOwner.className = "post-author";
        tempPostOwner.textContent = post.username;
        tempHeader.appendChild(tempPostOwner);

        const tempDate = document.createElement("p");
        tempDate.className = "post-date";
        tempDate.textContent = new Date(post.post_date).toLocaleString();
        tempHeader.appendChild(tempDate);

        // Post text
        const tempContent = document.createElement("p");
        tempContent.className = "post-text";
        tempContent.textContent = post.content;
        tempContainer.appendChild(tempContent);

        // Post actions (like button)
        const tempFooter = document.createElement("footer");
        tempFooter.className = "post-actions";
        tempContainer.appendChild(tempFooter);

        const tempLike = document.createElement("button");
        tempLike.id = `like-button-${postID}`;
        tempLike.ariaLabel = "Like Post";

        // Fetch the initial like count
        try {
            const likeCountResponse = await fetch(`/getLikeCount?post_id=${postID}`);
            const likeCountData = await likeCountResponse.json();
            tempLike.innerHTML = `👍 ${likeCountData.like_count || 0}`; // Ensure 0 is shown if no likes
        } catch (error) {
            console.error(`Error fetching like count for post ID ${postID}:`, error);
            tempLike.innerHTML = "👍 0"; // Fallback to 0 likes
        }

        tempLike.onclick = () => likePost(postID); // Attach click event
        tempFooter.appendChild(tempLike);
    }
}



// Fetch user profile image
async function getImage(username) {
    const response = await fetch("/getAvatarImage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: username }),
    });

    const data = await response.json();
    return data.avatarUrl || "avatar.png";
}

function toProfile() {
    window.location.href = "http://localhost:3000/profile.html";
}
