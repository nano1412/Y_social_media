window.onload = pageLoad;

function pageLoad() {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	if (urlParams.get("error") == 1) {
		if (window.location.href.split('/').pop() == "register.html") {
			document.getElementById('errordisplay').innerHTML = "Registration Error!"
		} else {
			document.getElementById('errordisplay').innerHTML = "Username or password does not match.";
		}

	}

	if (urlParams.get("error") == 2) {
		
			document.getElementById('errordisplay').innerHTML = "password and Retype password are not same"
		
	}
}