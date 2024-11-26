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
    console.log("in pageLoad");

    var username = getCookie('username');
    document.getElementById("username").textContent = username;

    // ตรวจสอบค่าคุกกี้ img และแสดงภาพ
    var imgFilename = getCookie('img');
    console.log("Image filename from cookie: " + imgFilename);

    // หากไม่มีค่าในคุกกี้ img ให้ใช้ค่า default (avatar.png)
    if (!imgFilename) {
        imgFilename = 'avatar.png';  // Default image if no img cookie
        document.cookie = `img=${imgFilename}; path=/`;  // Set default image cookie
    }

    showImg('img/' + imgFilename);  // แสดงภาพจากคุกกี้

    readPost();

    // จัดการปุ่ม toProfile
    const profileBtn = document.getElementById("toProfile");
    if (profileBtn) {
        profileBtn.onclick = toProfile; // เรียกฟังก์ชันเมื่อคลิก
    }
}


// Function to get new post data
function getData() {
    var msg = document.getElementById("textmsg").value;
    document.getElementById("textmsg").value = "";  // Clear the input field
    writePost(msg);  // Write new post to the server
}

// Trigger the file upload dialog when the profile picture area is clicked
function fileUpload() {
    document.getElementById('fileField').click(); // เปิดหน้าต่างเลือกไฟล์เมื่อคลิกที่รูปโปรไฟล์
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
                // อัปเดตคุกกี้ด้วยชื่อไฟล์ใหม่
                document.cookie = `img=${result.newImageFilename.split('/').pop()}; path=/`;  // เก็บแค่ชื่อไฟล์
                showImg(result.newImageFilename);  // แสดงภาพใหม่
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
        showpic.innerHTML = "";  // ล้างรูปก่อนหน้า
        var temp = document.createElement("img");

        // ตรวจสอบว่า filename มี '/img/' หรือไม่
        if (filename.startsWith('/img/')) {
            temp.src = filename;  // ใช้เส้นทางโดยตรง
        } else {
            temp.src = `${filename}`;  // เติม '/img/' ถ้าไม่มี
        }

        temp.alt = "Profile Picture"; // เพิ่ม alt text สำหรับการเข้าถึง
        temp.style.width = "100px";   // ขนาดรูป
        temp.style.height = "100px";  // ขนาดรูป
        temp.style.borderRadius = "50%"; // ทำให้เป็นวงกลม
        showpic.appendChild(temp);    // เพิ่มรูปภาพในพื้นที่แสดง
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
    window.location.href = "http://localhost:3000/profile.html"; // ไปที่หน้าประวัติส่วนตัวเมื่อคลิก
}

// Write a new post to the server
async function writePost() {
    let newJson = JSON.stringify({
        user: getCookie('username'),
        message: document.getElementById('post-text').value
    });
    console.log(document.getElementById('post-text').value);
    document.getElementById('post-text').value = '';

    let response = await fetch("/writePost", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: newJson,
    });

    readPost();
}

// Display posts in the feed
async function showPost(data) {
    var keys = Object.keys(data);
    var posts = document.getElementById("feed-posts");
    posts.innerHTML = "";  // Clear the previous posts

    let response = await fetch("/getlikedata");
    let lovedata = await response.json();
    console.log("lovedata");

    for (var i = keys.length-1; i >=0 ; i--) {
        let postID = data[keys[i]]["Post_ID"];
        let post_owner = data[keys[i]]["username"];
    
        var temparticle = document.createElement("article");
        temparticle.className = "feed-post";
        posts.appendChild(temparticle);

        var tempimg = document.createElement("img");
        tempimg.id = "postProfile";
        tempimg.src ='img/' + (await getImage(post_owner));
        tempimg.alt = post_owner;
        temparticle.appendChild(tempimg);

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
        let postDate = new Date(data[keys[i]]["post_date"]);

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

        var tempLike = document.createElement("button");
        tempLike.ariaLabel = "Like Post";
        tempLike.innerHTML = "👍" + "";
        tempFooter.appendChild(tempLike);
    }
}

async function getImage(username){
    let response = await fetch("/getAvatarImage", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body:  JSON.stringify({
            user: username,
        }),
    });

    const data = await response.json(); 
    return data.avatarUrl; 
}
