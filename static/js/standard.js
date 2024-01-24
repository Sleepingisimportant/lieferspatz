userLogged = false;
let userData;
document.addEventListener("DOMContentLoaded", async function (event) {
  const url = "/api/user/auth";
  let data = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  if (data["data"] != null) {
    userLogged = true;
    userData = data;

    document.getElementById("authentication-registration-link").innerText = "";
    document.getElementById("authentication-registration-link").innerText =
      "Log Out";
    document
      .getElementById("authentication-registration-link")
      .setAttribute("onClick", "popup_user_logout_box()");
    if (data["data"]["role"] == "customer") {
      document.getElementById("manage-link").innerText = "";
      document.getElementById("manage-link").innerText = "Manage Order";
    } else {
      document.getElementById("manage-link").innerText = "";
      document.getElementById("manage-link").innerText = "Manage Restaurant";
    }
  } else {
    document.getElementById("authentication-registration-link").innerText = "";
    document.getElementById("authentication-registration-link").innerText =
      "LOG IN / SIGN UP";
    document
      .getElementById("authentication-registration-link")
      .setAttribute("onClick", "popup_user_login_box()");
  }
});

function nav_to_homepage() {
  window.location.replace("/");
}

async function nav_to_manage() {
  if (userData["data"] != null) {
    if (userData["data"]["role"] == "customer") {
      window.location.replace("/manage/order");
    } else {
      window.location.replace("/manage/restaurant");
    }
  }
}

document.addEventListener("click", (e) => {
  if (
    e.target == document.getElementById("dimmed-background") ||
    e.target == document.getElementById("icon-close")
  ) {
    close_box();
  }
});

function close_box() {
  document.getElementById("dimmed-background").remove();
  enableScrolling();
}

function disableScrolling() {
  var x = window.scrollX;
  var y = window.scrollY;
  window.onscroll = function () {
    window.scrollTo(x, y);
  };
}

function enableScrolling() {
  window.onscroll = function () {};
}

function popup_user_login_box(toPageLocation = "/") {
  if (document.getElementById("dimmed-background")) {
    document.getElementById("dimmed-background").remove();
  }

  insertHTML =
    `  <div id="dimmed-background">
  <div id="login-registration-box">
  <div id="icon-close">&times;</div>
    <form  onsubmit="user_login('` + toPageLocation + `', 'customer');return false">
      <h3 style="color:#448899;">Customer</h3>
      <h3>LOG IN</h3>
      <input type="text" class="body" name="name" id="login-registration-box-name" placeholder="Name" required><br>
      <input type="password" class="body" name="password" id="login-registration-box-password" placeholder="Password" required><br>
      <button id="login-box-button" type="submit" class="btn">Confirm</button>
      <form>
    <div class="body">Restaurant owner? <a onclick="popup_restaurant_login_box()">Sign in</a></div>
    <div class="body">No account? <a onclick="popup_customer_registration_box()">Sign up</a></div>
  </div>
  </div>
`;

  document.body.insertAdjacentHTML("afterbegin", insertHTML);
  disableScrolling();
}
function popup_restaurant_login_box(toPageLocation = "/") {
  if (document.getElementById("dimmed-background")) {
    document.getElementById("dimmed-background").remove();
  }

  insertHTML =
    `  <div id="dimmed-background">
  <div id="login-registration-box">
  <div id="icon-close">&times;</div>
    <form  onsubmit="user_login('` + toPageLocation +`', 'restaurant');return false">
    <h3 style="color:#448899;">Restaurant Owner</h3>
      <h3>LOG IN</h3>
      <input type="text" class="body" name="name" id="login-registration-box-name" placeholder="Name" required><br>
      <input type="password" class="body" name="password" id="login-registration-box-password" placeholder="Password" required><br>
      <button id="login-box-button" type="submit" class="btn">Confirm</button>
      <form>
    <div class="body">Customer? <a onclick="popup_user_login_box()">Sign in</a></div>
    <div class="body">No account? <a onclick="popup_customer_registration_box()">Sign up</a></div>
  </div>
  </div>
`;

  document.body.insertAdjacentHTML("afterbegin", insertHTML);
  disableScrolling();
}

function popup_customer_registration_box() {
  if (document.getElementById("dimmed-background")) {
    document.getElementById("dimmed-background").remove();
  }
  insertHTML = `  <div id="dimmed-background">
  <div id="login-registration-box">
  <div id="icon-close">&times;</div>
  <form  onsubmit="customer_registration();return false">
      <h3>Create Account</h3>
      <input type="text" class="body" name="name" id="login-registration-box-name" placeholder="Name" required><br>
      <input type="password" class="body" name="password" id="login-registration-box-password" placeholder="Create Password" required><br>
      <input type="text" class="body" name="zipCode" id="login-registration-box-zipCode" placeholder="Zip Code" required><br>
      <input type="text" class="body" name="address" id="login-registration-box-address" placeholder="Address" required><br>
      <button id="registraion-box-button" type="submit"  class="btn">Confirm</button>
      <form>
    <div class="body">Already registered? <a onclick="popup_user_login_box()">Sign in</a></div>
    <div class="body">Restaurant owner? <a onclick="popup_restaurant_registration_box()">Create restaurant</a></div>

  </div>
  </div>
`;

  document.body.insertAdjacentHTML("afterbegin", insertHTML);
  disableScrolling();
}

async function customer_registration() {
  username = document.getElementById("login-registration-box-name").value;
  password = document.getElementById("login-registration-box-password").value;
  zipCode = document.getElementById("login-registration-box-zipCode").value;
  address = document.getElementById("login-registration-box-address").value;
  const url = "api/customer";
  let data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    body: JSON.stringify({
      name: username,
      password: password,
      zipCode: zipCode,
      address: address,
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  if (document.getElementById("login-registration-result-message")) {
    document.getElementById("login-registration-result-message").remove();
  }
  if (data["ok"]) {
    insertHTML = ` <div class="body" id="login-registration-result-message"> Successful </div>`;
    document
      .getElementById("login-registration-box")
      .insertAdjacentHTML("beforeend", insertHTML);
    document.getElementById("login-registration-box-name").value = "";
    document.getElementById("login-registration-box-password").value = "";
    document.getElementById("login-registration-box-zipCode").value = "";
    document.getElementById("login-registration-box-address").value = "";
  } else {
    insertHTML =
      ` <div class="body" id="login-registration-result-message">` +
      data["message"] +
      `</div>`;
    document
      .getElementById("login-registration-box")
      .insertAdjacentHTML("beforeend", insertHTML);
  }
}
function popup_restaurant_registration_box() {
  if (document.getElementById("dimmed-background")) {
    document.getElementById("dimmed-background").remove();
  }
  insertHTML = `  <div id="dimmed-background">
  <div id="login-registration-box">
  <div id="icon-close">&times;</div>
  <form  onsubmit="restaurant_registration();return false">
      <h3>Create Restaurant</h3>
      <input type="text" class="body" name="name" id="login-registration-box-name-restaurant" placeholder="Name" required><br>
      <input type="password" class="body" name="password" id="login-registration-box-password-restaurant" placeholder="Create Password" required><br>
      <input type="text" class="body" name="zipCode" id="login-registration-box-zipCode-restaurant" placeholder="Zip Code" required><br>
      <input type="text" class="body" name="radius" id="login-registration-box-radius-restaurant" placeholder="Deliver to..." required><br>
      <input type="text" class="body" name="address" id="login-registration-box-address-restaurant" placeholder="Address" required><br>
      <input type="text" class="body" name="openTime" id="login-registration-box-openTime-restaurant" placeholder="openTime" required><br>
      <input type="text" class="body" name="closeTime" id="login-registration-box-closeTime-restaurant" placeholder="closeTime" required><br>
      <input type="text" class="body" name="description" id="login-registration-box-description-restaurant" placeholder="description" required><br>
      <input type="text" class="body" name="picture" id="login-registration-box-picture-restaurant" placeholder="picture" required><br>

      <button id="registraion-box-button-restaurant" type="submit"  class="btn">Confirm</button>
      <form>
    <div class="body">Already registered? <a onclick="popup_user_login_box()">Sign in</a></div>
    <div class="body">Normal customer? <a onclick="popup_customer_registration_box()">Create account</a></div>

  </div>
  </div>
`;

  document.body.insertAdjacentHTML("afterbegin", insertHTML);
  disableScrolling();
}
async function restaurant_registration() {
  restaurantName = document.getElementById(
    "login-registration-box-name-restaurant"
  ).value;
  password = document.getElementById(
    "login-registration-box-password-restaurant"
  ).value;
  zipCode = document.getElementById(
    "login-registration-box-zipCode-restaurant"
  ).value;
  radius = document.getElementById(
    "login-registration-box-radius-restaurant"
  ).value;
  address = document.getElementById(
    "login-registration-box-address-restaurant"
  ).value;
  openTime = document.getElementById(
    "login-registration-box-openTime-restaurant"
  ).value;
  closeTime = document.getElementById(
    "login-registration-box-closeTime-restaurant"
  ).value;
  description = document.getElementById(
    "login-registration-box-description-restaurant"
  ).value;
  picture = document.getElementById(
    "login-registration-box-picture-restaurant"
  ).value;

  const url = "/api/restaurant/create";
  let data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    body: JSON.stringify({
      restaurantName: restaurantName,
      restaurantPassword: password,
      restaurantZipCode: zipCode,
      restaurantRadius: radius,
      restaurantAddress: address,
      restaurantOpenTime: openTime,
      restaurantCloseTime: closeTime,
      restaurantDescription: description,
      restaurantPicture: picture,
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  if (document.getElementById("login-registration-result-message")) {
    document.getElementById("login-registration-result-message").remove();
  }
  if (data["ok"]) {
    insertHTML = ` <div class="body" id="login-registration-result-message"> Successful </div>`;
    document
      .getElementById("login-registration-box")
      .insertAdjacentHTML("beforeend", insertHTML);
    document.getElementById("login-registration-box-name-restaurant").value =
      "";
    document.getElementById(
      "login-registration-box-password-restaurant"
    ).value = "";
    document.getElementById("login-registration-box-zipCode-restaurant").value =
      "";
      document.getElementById("login-registration-box-radius-restaurant").value =
      "";
    document.getElementById("login-registration-box-address-restaurant").value =
      "";
    document.getElementById(
      "login-registration-box-openTime-restaurant"
    ).value = "";
    document.getElementById(
      "login-registration-box-closeTime-restaurant"
    ).value = "";
    document.getElementById(
      "login-registration-box-description-restaurant"
    ).value = "";
    document.getElementById("login-registration-box-picture-restaurant").value =
      "";
  } else {
    insertHTML =
      ` <div class="body" id="login-registration-result-message">` +
      data["message"] +
      `</div>`;
    document
      .getElementById("login-registration-box")
      .insertAdjacentHTML("beforeend", insertHTML);
  }
}

async function user_login(toPageLocation, role) {
  username = document.getElementById("login-registration-box-name").value;
  password = document.getElementById("login-registration-box-password").value;

  const url = "/api/user/auth";
  let data = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    withCredentials: true,
    body: JSON.stringify({
      name: username,
      password: password,
      role:role,
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  console.log(data);

  if (document.getElementById("login-registration-result-message")) {
    document.getElementById("login-registration-result-message").remove();
  }

  if (data.hasOwnProperty("ok")) {
    location.href = toPageLocation;
  } else {
    insertHTML =
      ` <div class="body" id="login-registration-result-message"> ` +
      data["message"] +
      `</div>`;
    document
      .getElementById("login-registration-box")
      .insertAdjacentHTML("beforeend", insertHTML);
    console.log("delete cookies");

    delete_cookie("token");
  }
}

function getCookie(cookieName) {
  let cookie = {};
  document.cookie.split(";").forEach(function (el) {
    let [key, value] = el.split("=");
    cookie[key.trim()] = value;
  });
  return cookie[cookieName];
}

function delete_cookie(name) {
  document.cookie = name + "=; Path=/; Max-Age=-99999999;";
}

async function user_logout() {
  const url = "/api/user/auth";
  let data = await fetch(url, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  delete_cookie("token");

  location.href = "/";
}

function popup_user_logout_box() {
  if (document.getElementById("dimmed-background")) {
    document.getElementById("dimmed-background").remove();
  }

  insertHTML = `  <div id="dimmed-background">
  <div id="login-registration-box">
  <div id="icon-close">&times;</div>
  <h3>Log out?</h3>
  <button id="logout-box-button-confirm" onclick="user_logout()" class="btn">Yes</button>
  <button id="logout-box-button-cancel" onclick="close_box()" class="btn">Cancel</button>
  </div></div>`;

  document.body.insertAdjacentHTML("afterbegin", insertHTML);
  disableScrolling();
}
