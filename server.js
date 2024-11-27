const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');

app.use(express.static('public'));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true,parameterLimit:100000, limit:"200mb"}));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'public/img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const con = mysql.createConnection({
    host: "localhost",
    user: "Nano1412",
    password: "123456789!",
    database: "test_Social_Media" // change to "y_Social_Media" in actual production
})

con.connect(err => {
    if (err) throw (err);
    else {
        console.log("MySQL connected");
    }
})

const queryDB = (sql) => {
    return new Promise((resolve, reject) => {
        // query method
        con.query(sql, (err, result, fields) => {
            if (err) reject(err);
            else
                resolve(result)
        })
    })
}


//sql command of SetupTableOnDatabase
// CREATE TABLE IF NOT EXISTS users (
    // username VARCHAR(255) PRIMARY KEY,
    // password VARCHAR(100),
    // Email VARCHAR(100),
    // regis_date TIMESTAMP,
    // profile_img VARCHAR(100));

// CREATE TABLE IF NOT EXISTS posts (
//     post_id INT AUTO_INCREMENT PRIMARY KEY,
//     username VARCHAR(255),
//     content VARCHAR(1000),
//     post_date TIMESTAMP,
//     FOREIGN KEY (username) REFERENCES users(username));

// CREATE TABLE IF NOT EXISTS like_accounts (
//     liked_id INT AUTO_INCREMENT PRIMARY KEY,
//     post_id INT,
//     like_username VARCHAR(255) ,
//     FOREIGN KEY (post_id) REFERENCES posts(post_id),
//     FOREIGN KEY (like_username) REFERENCES users(username));

async function SetupTableOnDatabase() {
    let user = "CREATE TABLE IF NOT EXISTS users (username VARCHAR(255) PRIMARY KEY,password VARCHAR(100),Email VARCHAR(100),regis_date TIMESTAMP,profile_img VARCHAR(100))";
    let result = await queryDB(user);
    let post = "CREATE TABLE IF NOT EXISTS posts (post_id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(255),content VARCHAR(1000),post_date TIMESTAMP,FOREIGN KEY (username) REFERENCES users(username))";
    result = await queryDB(post);
    let like_account = "CREATE TABLE IF NOT EXISTS like_accounts (liked_id INT AUTO_INCREMENT PRIMARY KEY,post_id INT,like_username VARCHAR(255) ,FOREIGN KEY (post_id) REFERENCES posts(post_id),FOREIGN KEY (like_username) REFERENCES users(username))";
    result = await queryDB(like_account);
}

//setup
(async () => {
    await SetupTableOnDatabase();
})();

app.post('/regisDB', async (req, res) => {
    let now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    console.log(req.body);

    if(req.body.password != req.body.RetypePassword){
        return res.redirect('register.html?error=2');
    }

    sql = `INSERT INTO users (username, password,Email, regis_date ,profile_img) VALUES ("${req.body.username}", "${req.body.password}", "${req.body.email}","${now_date}","avatar.png")`;
    result = await queryDB(sql);
    console.log("New User added");

    res.cookie('username', req.body.username);
    res.cookie('img', "avatar.png");
    console.log("set cookie");
    res.end;
    return res.redirect('feed.html');
})

app.post('/profilepic', (req, res) => {
    let upload = multer({ storage: storage, fileFilter: imageFilter }).single("avatar");

    upload(req, res, async (err) => {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send("Please select an image to upload");
        }
        else if (err instanceof multer.MulterError) {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        } else {
            res.cookie('img', req.file.filename);
            await updateImg(req.cookies.username, req.file.filename);
            return res.redirect('feed.html')
        }
    });
})

const updateImg = async (username, filen) => {
    let sql = `UPDATE users SET profile_img = '${filen}' WHERE 
        username = '${username}'`

    result = await queryDB(sql);
    console.log("Update Image " + username + " to " + filen);
    return result;
}

app.get('/logout', (req, res) => {
    res.clearCookie('username');
    res.clearCookie('user');
    res.clearCookie('img');
    res.clearCookie('name');
    return res.redirect('login.html');
})

app.get('/readPost', async (req, res) => {
    let sql = `Select * From posts join users on users.username = posts.username`;
    result = await queryDB(sql);
    result = Object.assign({}, result);
    res.json(result);
})

app.get('/readmyPost', async (req, res) => {
    let sql = `Select * From posts join users on users.username = posts.username`;
    result = await queryDB(sql);
    result = Object.assign({}, result);
    res.json(result);
})

app.get('/getlikecount', async (req,res) => {
    let postid = req.query.post_id;
    let sql = `Select count(liked_id) as like_count From like_accounts where post_id = ${postid}`;
    result = await queryDB(sql);
    result = Object.assign({},result);
    res.json(result);
})

app.post('/writePost', async (req, res) => {
    let now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    sql = `INSERT INTO posts (username,content,post_date) VALUES ("${req.body.user}", "${req.body.message}","${now_date}")`;
    result = await queryDB(sql);
    console.log("New post created successfully");
    res.send("create");
})

app.post('/likethispost', async (req, res) => {
    sqlask = `select like_username from like_accounts where like_username = '${req.body.user}' AND post_id = '${req.body.postid}'limit 1`;
    result = await queryDB(sqlask);
    result = Object.assign({}, result);
    if(Object.keys(result).length > 0){
        sql = `DELETE FROM like_accounts WHERE like_username = '${req.body.user}' AND post_id = '${req.body.postid}'`;
        result = await queryDB(sql);
        console.log("this account already like this post, remove like from the post");
        res.send("create");
    } else {
        sql = `INSERT INTO like_accounts (post_id,like_username) VALUES ("${req.body.postid}", "${req.body.user}")`;
        result = await queryDB(sql);
        console.log("New like created successfully");
        res.send("create");
    }
})

app.post('/checkLogin', async (req, res) => {
    console.log(req.body);

    if(req.body.method == "Register"){
        return res.redirect('register.html');
    }

    let sql = `Select * From users`;
    result = await queryDB(sql);
    result = Object.assign({}, result);

    let success = await Login(req.body, result)

    if (success) {
        res.cookie('username', req.body.username);
        let ImageAvater = await getImage(req.body.username);
        res.cookie('img', ImageAvater);
        console.log("set cookie");
        res.end;
        return res.redirect('feed.html');
    } else {
        console.log("incorrect");
        return res.redirect('login.html?error=1');
    }
})

//
const getImage = async (username) => {
    let sql = `Select profile_img From users where username = '${username}'`;
    result = await queryDB(sql);
    result = Object.assign({}, result);

    return result[0]["profile_img"];
}

const Login = (sendVal, data) => {
    return new Promise((resolve, reject) => {
        if (data) {
            let keys = Object.keys(data);

            let correctly = false;

            for (var i = 0; i < keys.length; i++) {
                let username = data[keys[i]].username;
                let password = data[keys[i]].password;

                if (sendVal.username == username && sendVal.password == password) {
                    correctly = true;
                };
            }

            if (correctly) {
                console.log("correct password & username!");
                resolve(true);
            } else {
                console.log("incorrect password & username!");
                resolve(false);
            }

        } else {
            reject(err);
        }
    });
}

app.post('/getAvatarImage',async (req,res) => {    
    res.json({ avatarUrl: await getImage(req.body.user) });
})

//bottom
app.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/login.html`);
});
