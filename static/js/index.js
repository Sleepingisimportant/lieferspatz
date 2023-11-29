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
    if (data["data"]["role"] == "customer") {
      get_restaurant_list(data["data"]["id"]);
    }
  }

});


async function get_restaurant_list(userId) {
  const url = "/api/restaurant/show/" + userId;
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

  if (data != null) {
    show_posts(data);
  }
}

async function show_posts(data) {
  for (let i = 0; i < Object.keys(data).length; i++) {
    console.log(data);
    restaurantName = data[i]["restaurantName"];
    restaurantAddress = data[i]["restaurantAddress"];
    restaurantZipCode = data[i]["restaurantZipCode"];
    restaurantAddress = data[i]["restaurantAddress"];
    restaurantOpenTime = data[i]["restaurantOpenTime"];
    restaurantCloseTime = data[i]["restaurantCloseTime"];
    restaurantDescription = data[i]["restaurantDescription"];
    restaurantPicture = data[i]["restaurantPicture"];
    restaurantId = data[i]["restaurantId"];

    const div = document.createElement("div");
    console.log(restaurantId)

    div.innerHTML =
      `   <div class="post-default" onclick="navigate_to_restaurant_page(this.id)" id=` +
      restaurantId +
      `>
        <div class="post-default-image">
          <img src=` +
      restaurantPicture +
      `  alt=` +
      restaurantName +
      ` >
        </div>
        <div class="post-default-title">
          <p>` +
      restaurantName +
      `</p>
        </div>
        <div class="post-default-subtitle">
      <a>` +
      restaurantZipCode +
      `</a><a>` +
      restaurantAddress +
      `</a></div>
      </div>`;

    document.getElementById("main-content-default").appendChild(div);
  }
}

async function navigate_to_restaurant_page(restaurantId){
  window.location.replace("/restaurant/"+restaurantId);

}