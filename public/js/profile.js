function fileUpload() {
    document.getElementById('fileField').click();
}

function fileSubmit() {
    document.getElementById('formId').submit();
}

function pageLoad() {
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
}

window.onload = pageLoad;
