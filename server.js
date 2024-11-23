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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
    password: "154712349876kK!",
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
// CREATE TABLE IF NOT EXISTS user (
//     user_id INT AUTO_INCREMENT PRIMARY KEY,
//     username VARCHAR(255),
//     password VARCHAR(100),
//     regis_date TIMESTAMP,
//     profile_img VARCHAR(100));

// CREATE TABLE IF NOT EXISTS post (
//     post_id INT AUTO_INCREMENT PRIMARY KEY,
//     user_id INT,
//     content VARCHAR(1000),
//     regis_date TIMESTAMP,
//     FOREIGN KEY (user_id) REFERENCES user(user_id));

// CREATE TABLE IF NOT EXISTS comment (
//     comment_id INT AUTO_INCREMENT PRIMARY KEY,
//     post_id INT,
//     content VARCHAR(1000),
//     regis_date TIMESTAMP,
//     FOREIGN KEY (post_id) REFERENCES post(post_id));

// CREATE TABLE IF NOT EXISTS like_account (
//     liked_id INT AUTO_INCREMENT PRIMARY KEY,
//     post_id INT,
//     liked_user_id INT,
//     content VARCHAR(1000),
//     FOREIGN KEY (post_id) REFERENCES post(post_id),
//     FOREIGN KEY (liked_user_id) REFERENCES user(user_id));

async function SetupTableOnDatabase() {
    let user = "CREATE TABLE IF NOT EXISTS user (user_id INT AUTO_INCREMENT PRIMARY KEY,username VARCHAR(255),password VARCHAR(100),regis_date TIMESTAMP,profile_img VARCHAR(100))";
    let result = await queryDB(user);
    let post = "CREATE TABLE IF NOT EXISTS post (post_id INT AUTO_INCREMENT PRIMARY KEY,user_id INT,content VARCHAR(1000),regis_date TIMESTAMP,FOREIGN KEY (user_id) REFERENCES user(user_id))";
    result = await queryDB(post);
    let comment = "CREATE TABLE IF NOT EXISTS comment (comment_id INT AUTO_INCREMENT PRIMARY KEY,post_id INT,content VARCHAR(1000),regis_date TIMESTAMP,FOREIGN KEY (post_id) REFERENCES post(post_id))";
    result = await queryDB(comment);
    let like_account = "CREATE TABLE IF NOT EXISTS like_account (liked_id INT AUTO_INCREMENT PRIMARY KEY,post_id INT,liked_user_id INT,content VARCHAR(1000),FOREIGN KEY (post_id) REFERENCES post(post_id),FOREIGN KEY (liked_user_id) REFERENCES user(user_id))";
    result = await queryDB(like_account);
}

    // Call start
    (async () => {
        console.log('before start');

        await SetupTableOnDatabase();

        console.log('after start');
    })();
app.post('/regisDB', async (req, res) => {
    let now_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    console.log(req.body);
    // let sql = "CREATE TABLE IF NOT EXISTS user (user_id INT AUTO_INCREMENT PRIMARY KEY, reg_date TIMESTAMP, username VARCHAR(255), email VARCHAR(100),password VARCHAR(100),img VARCHAR(100))";
    // let result = await queryDB(sql);

    sql = `INSERT INTO userInfo (username, reg_date, email , password,img) VALUES ("${req.body.username}", "${now_date}", "${req.body.email}", "${req.body.password}", "avatar.png")`;
    result = await queryDB(sql);
    console.log("New record created successfullyone");

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
    let sql = `UPDATE user SET img = '${filen}' WHERE 
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
    // let createdata = "CREATE TABLE IF NOT EXISTS post (id INT AUTO_INCREMENT PRIMARY KEY, reg_date TIMESTAMP, user_id INT, message VARCHAR(500))";
    // let result = await queryDB(createdata);

    let sql = `Select * From post`;
    result = await queryDB(sql);
    result = Object.assign({}, result);
    res.json(result);
})

app.post('/writePost', async (req, res) => {
    console.log(req.body);
    sql = `INSERT INTO post (user_id,message) VALUES ("${req.body.user}", "${req.body.message}")`;
    result = await queryDB(sql);
    console.log("New post created successfully");
    res.send("create");
})

app.post('/checkLogin', async (req, res) => {
    console.log(req.body);

    let sql = `Select * From user`;
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

const getImage = async (username) => {
    let sql = `Select username, img From user`;
    result = await queryDB(sql);
    result = Object.assign({}, result);

    let keys = Object.keys(result);

    for (var i = 0; i < keys.length; i++) {
        let find_username = result[keys[i]].username;
        if (username == find_username) {
            console.log("Return avatar: " + result[keys[i]].img);
            return result[keys[i]].img;
        };
    }
    return "avatar.png"
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

//bottom
app.listen(port, hostname, () => {
    console.log(`Server running at   http://${hostname}:${port}/login.html`);
});
