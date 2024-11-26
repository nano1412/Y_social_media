function fileUpload() {
    document.getElementById('fileField').click();
}
function checkCookie() {
    var username = getCookie("username");  // Get the username cookie
    if (!username) {
        window.location = "login.html";  // Redirect if no username cookie
    }
}

function getCookie(name){
	var value = "";
	try{
		value = document.cookie.split("; ").find(row => row.startsWith(name)).split('=')[1]
		return value
	}catch(err){
		return false
	} 
}

function fileSubmit() {
    document.getElementById('formId').submit();
}

function pageLoad() {
    checkCookie();
    // ผูกเหตุการณ์สำหรับการอัปโหลดไฟล์
    document.getElementById('displayPic').onclick = fileUpload;
    document.getElementById('fileField').onchange = fileSubmit;

    // ผูกเหตุการณ์สำหรับปุ่ม Logout
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.onclick = function () {
            window.location.href = "http://localhost:3000/login.html";
        };
    }

    var username = getCookie('username');

	document.getElementById("username").textContent = username;
	console.log(getCookie('img'));
	showImg('img/'+getCookie('img'));
	readmyPost();
}

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

async function readmyPost() {
    try {
        let response = await fetch('/readPost');
        let data = await response.json();
        showPost(data);  // Display the posts after fetching
    } catch (error) {
        console.error('Error fetching posts:', error);
    }
}

async function showPost(data) {
    var username = getCookie("username");
    var keys = Object.keys(data);
    var posts = document.getElementById("posts");
    posts.innerHTML = "";  // Clear the previous posts

    let response = await fetch("/getlikedata");
	let lovedata = await response.json()
    console.log("lovedata");

    for (var i = keys.length-1; i >=0 ; i--) {
        if(data[keys[i]]["username"] != username){
            continue;
        }
		let postID = data[keys[i]]["Post_ID"];
        let post_owner = data[keys[i]]["username"];
    
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

        var tempLike = document.createElement("button");
        tempLike.ariaLabel = "Like Post";
        tempLike.innerHTML = "👍" + "";
        tempFooter.appendChild(tempLike);
    }

    
}

window.onload = pageLoad;
