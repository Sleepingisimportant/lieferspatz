const restaurantId = getRestaurantId();
let userId;
let restaurantName;

function getRestaurantId() {
  const restaurantId = window.location.href.split("/").pop();
  return !isNaN(restaurantId) ? restaurantId : null;
}

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

  if (data["data"] == null) {
    window.location.replace("/");
  } else if (data["data"]["role"] != "customer") {
    window.location.replace("/");
  } else {
    userId = data["data"]["id"];
    getRestaurantInfo();
  }
});

async function getRestaurantInfo() {
  const url = "/api/restaurant/info/customer/" + restaurantId;
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

  restaurantName = data["name"];
  address = data["address"];
  zipCode = data["zipCode"];
  openTime = data["openTime"];
  closeTime = data["closeTime"];
  description = data["description"];
  picture = data["picture"];

  document.querySelector("#restaurant-info-name").innerText = restaurantName;
  document.querySelector("#restaurant-info-picture").src = picture;
  document.querySelector("#restaurant-info-picture").alt = restaurantName;

  document.querySelector("#restaurant-info-time .content").innerText =
    openTime + ` to ` + closeTime;
  document.querySelector("#restaurant-info-description .content").innerText =
    description;
  document.querySelector("#restaurant-info-address .content").innerText =
    address;
  document.querySelector("#restaurant-info-zipcode .content").innerText =
    zipCode;

  for (i = parseInt(zipCode) - 2; i <= parseInt(zipCode) + 2; i++) {
    document.querySelector("#restaurant-info-radius .content").innerText +=
      i + "\n";
  }

  getMenu(restaurantId);
}

async function getMenu(restaurantId) {
  //get menu
  const url = "/api/menu/" + restaurantId;
  let data = await fetch(url, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  menu = "";
  for (i = 1; i <= Object.keys(data).length; i++) {
    menu +=
      `
      <div name=` +
      data[i]["itemId"] +
      ` class="menu-item">
          <p class="bold body">` +
      data[i]["itemName"] +
      `</p >
          <p class="body">` +
      data[i]["itemDescription"] +
      `</p>
          <p class="body">` +
      data[i]["itemPrice"] +
      `€ </p>
      <label class="body" for=` +
      data[i]["itemId"] +
      ` >Number of order:</label>
      <input name="` +
      data[i]["itemId"] +
      `/` +
      data[i]["itemName"] +
      `/` +
      data[i]["itemPrice"] +
      `" type="number" value="0" min="0"></input>
          <br>
      </div>
          `;

  }
  
  document
    .getElementById("restaurant-menu-item")
    .insertAdjacentHTML("afterbegin", menu);
}

document.querySelector("#add_item_to_shopping_cart").onclick =
  async function () {
    orderAdded = {};
    allMenu = document.querySelectorAll("#restaurant-menu-item input");

    allMenu.forEach((menuItem) => {
      itemAmount = menuItem.value;
      if (itemAmount > 0) {
        item = menuItem.name;

        itemArray = item.split("/");
        itemId = itemArray[0];
        itemName = itemArray[1];
        itemPrice = itemArray[2];
        console.log(itemArray);

        add_item_to_shopping_cart(itemId, itemName, itemPrice, itemAmount);

       
        

        window.location.reload(true);

        
      }
    });
  };
async function add_item_to_shopping_cart(
  itemId,
  itemName,
  itemPrice,
  itemAmount
) {
  const url = "/api/cart/add";
  let data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    body: JSON.stringify({
      userId: userId,
      restaurantId: restaurantId,
      itemId: itemId,
      itemName: itemName,
      itemPrice: itemPrice,
      itemAmount: itemAmount,
      restaurantName:restaurantName
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));
}
