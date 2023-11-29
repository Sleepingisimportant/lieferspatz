var restaurantId;

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
  } else if (data["data"]["role"] != "restaurant") {
    window.location.replace("/");
  } else {
    await getRestaurantInfo();
    getRestaurantOrder(restaurantId);
  }
});

async function getRestaurantInfo() {
  const url = "/api/restaurant/info/owner";
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
  radius = data["radius"];
  picture = data["picture"];
  allowedZipCode = data["allowedZipCode"];
  restaurantId = data["restaurantId"];
  console.log(restaurantId);
  document.getElementById("restaurant-info-name").innerText = restaurantName;
  document.getElementById("restaurant-info-pic").src = picture;
  document.getElementById("restaurant-info-pic").alt = restaurantName;


  document.querySelector("#restaurant-info-time .content").innerText =
    openTime + ` to ` + closeTime;
  document.querySelector("#restaurant-info-description .content").innerText =
    description;
  document.querySelector("#restaurant-info-address .content").innerText =
    address;
  document.querySelector("#restaurant-info-zipcode .content").innerText =
    zipCode;
  document.querySelector("#restaurant-info-radius .content").innerText =
    allowedZipCode;

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
        <button name=${data[i]["itemId"]} class="delete" onclick="deleteMenu(this.name)">Delete Menu</button><br>
    </div>
        `;
  }
  document
    .getElementById("restaurant-menu-item")
    .insertAdjacentHTML("afterbegin", menu);
}

async function create_menu_item() {
  itemName = document.querySelector("#create-item-name").value;
  itemDescription = document.querySelector("#create-item-description").value;
  itemPrice = document.querySelector("#create-item-price").value;

  const url = "/api/menu/create";
  let data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    body: JSON.stringify({
      restaurantId: restaurantId,
      itemName: itemName,
      itemDescription: itemDescription,
      itemPrice: itemPrice,
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  if (data.hasOwnProperty("ok")) {
    location.href = "/manage/restaurant";
  } else {
    //to be added
  }
}

async function getRestaurantOrder(restaurantId) {
  const url = "/api/order/get/restaurant/" + restaurantId;
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

    console.log(data)
  orderHistoryHtml = "";

  for (const orderId in data) {
    orderHistoryHtml += generateOrderHTML(orderId, data[orderId]);
  }
  document
    .querySelector("#restaurant-order")
    .insertAdjacentHTML("beforeend", orderHistoryHtml);
}

function generateOrderHTML(orderId, orderData) {
  console.log(orderData)
  orderHTML=""
  console.log(orderData.orderStatus)
  if(orderData.orderStatus=="Created"){
     orderHTML = `<div >
     <p class="bold body" id=${orderId} }>Order Nr.: </p><p class=" body" style="color:#D35400;">#${orderId}</p><br>
    <button name="${orderId}" class="delete" onclick=rejectOrder(this.name)>Reject</button>
    <button name="${orderId}" class="confirm" onclick=confirmOrder(this.name)>Confirm</button><br>`;
  }else if(orderData.orderStatus=="Rejected"){
    orderHTML = `<div >
    <p class="bold body" id=${orderId} }>Order Nr.: </p><p class=" body" style="color:#D35400;">#${orderId}</p><br>`;
  }else if(orderData.orderStatus=="Confirmed"){
    orderHTML = `<div >
    <p class="bold body" id=${orderId} }>Order Nr.: </p><p class=" body" style="color:#D35400;">#${orderId}</p><br>
    <button name="${orderId}" class="deliver" onclick=deliverOrder(this.name)>Deliver</button><br>`;
  }else if(orderData.orderStatus=="Delivered"){
    orderHTML =
    `<div >
    <p class="bold body" id=${orderId} }>Order Nr.: </p><p class=" body" style="color:#D35400;">#${orderId}</p> <br>`;
  }

  orderHTML+=`<p class="bold body">Customer Name: </p><p class="body">${orderData.customerName}</p><br>
    <p class="bold body">Order Item(s):</p><br>`
  

  items=Object.values(orderData.item)
  console.log(items)
  items.forEach((item) => {
    orderComment=item.orderComment
    if (orderComment){
      orderHTML += `<p class=" body">${item.itemName} ${item.itemAmount} pc(s)</p> 
      <p class="bold body" style="color:#0E6655;"> Customer Comment:</p><p class="body" style="color:#0E6655;">${item.orderComment}</p><br>`;
    }else{
      orderHTML += `<p class=" body">${item.itemName} ${item.itemAmount} pc(s)</p> <br>`;
    }
   
  });

  orderHTML += ` 
  <p class="bold body">Order Status: </p>
  <p class="body" style="color:red;">${orderData.orderStatus}</p><br>
  
  </div><br><br>`;

  return orderHTML;
}

async function deleteMenu(itemId) {
  const url = "/api/menu/delete/" + itemId;

  let data = await fetch(url, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  window.location.reload(true);
}

async function rejectOrder(orderId) {

  const url = "/api/order/reject";
  let data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    body: JSON.stringify({
      orderId: orderId,
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));


  window.location.reload(true);
}

async function confirmOrder(orderId){
  const url = "/api/order/confirm";
  let data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    body: JSON.stringify({
      orderId: orderId,
    }),
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));


  window.location.reload(true);
}

async function deliverOrder(orderId){
    const url = "/api/order/deliver";
    let data = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json ; charset=UTF-8",
      },
      body: JSON.stringify({
        orderId: orderId,
      }),
    })
      .then((response) => response.json())
      .then((responseData) => {
        console.log(responseData);
        return responseData;
      })
      .catch((error) => console.warn(error));
  
  
    window.location.reload(true);
}