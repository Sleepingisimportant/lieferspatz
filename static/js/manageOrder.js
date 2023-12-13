let userId;

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
    getCart();
    getOrder();
  }
});

async function getCart(userId) {
  const url = "/api/cart/get";
  let data = await fetch(url, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((responseData) => {
      console.log(responseData);
      return responseData;
    })
    .catch((error) => console.warn(error));

  itemCount = 0;
  data.forEach((d) => {
    itemCount += Object.keys(d.item).length;
  });

  cart = "";
  totalPrice = 0;

  if (data.length > 0) {
    data.forEach((d) => {
      cart += `<div class="menu-item">
      <p class="bold body"> Restaurant: ${d.restaurantName}</p><br>`;

      for (key in d.item) {
        const itemData = d.item[key];
        cart += `<p class="body"> ${itemData.itemName}      ${itemData.itemAmount} pc(s)     ${itemData.totalPrice} €</p>
      <input type="text" id=${key} name="order-comment" placeholder="Comment..."></input>
      <button class="delete" name=${key} onclick=deleteItem(this.name)> Delete Item(s)</button><br>
        `;
        totalPrice += itemData.totalPrice;
      }

      cart += `<div><br>`;
    });
    console.log(cart);
    cart +=
      `<h4>Total Price: ` + Math.round(totalPrice * 100) / 100 + ` € <h4>`;

    cart += `<button id="button-send-order" onclick=sendOrder() >Send Order</button>`;
  } else {
    cart = `<p>The cart is empty.</p>`;
  }
  document.querySelector("#order-unsent").insertAdjacentHTML("beforeend", cart);
}

async function deleteItem(itemId) {
  const url = "/api/cart/delete/" + itemId;

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

async function sendOrder() {
  allOrderComment = document.querySelectorAll('input[name="order-comment"]');
  itemIdComment = new Object();
  allOrderComment.forEach((orderComment) => {
    itemId = orderComment.id;
    itemOrderComment = orderComment.value;
    itemIdComment[itemId] = itemOrderComment;
  });

  const url = "/api/order/create";
  let data = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json ; charset=UTF-8",
    },
    body: JSON.stringify({
      itemIdComment: itemIdComment,
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

async function getOrder() {
  const url = "/api/order/get/customer";

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

  let itemCount = 0;

  // Iterate through the object
  for (const key in data) {
    if (data[key].item) {
      itemCount++;
    }
  }
  console.log(data);

  orderHistoryHtml = "";

  for (const orderId in data) {
    orderHistoryHtml =
      generateOrderHTML(orderId, data[orderId]) + orderHistoryHtml;
  }
  document
    .querySelector("#order-sent")
    .insertAdjacentHTML("beforeend", orderHistoryHtml);
}

// Function to generate HTML for each order
function generateOrderHTML(orderId, orderData) {
  const items = Object.values(orderData["item"]);
  console.log(orderData)

  orderHTML = `<div>
      <p class="bold body">Order Nr.: ${orderId}</p><br>
      <p class="bold body">Order Status: </p><p class="body" style="color:red;">${orderData.orderStatus}</p><br>
      <p class="bold body">  Order Time: </p><p class="body" style="color:grey;">${orderData.createTime}</p><br>
      <p class="bold body">  Restaurant: </p><p class="body" style="color:grey;">${items[0]["restaurantName"]}</p><br>
      <p class="bold body">  Order Item(s): </p><br>

      `;

  items.forEach((item) => {
    orderHTML += `<p class=" body"> ${item["itemName"]} ${item["itemAmount"]} pc(s)</p>
    <p class="bold body" style="color:blue;">  Order Note: </p><p class="body" style="color:blue;">${item["orderComment"]}</p><br>
    `;
  });

  orderHTML += `
    </div>
    <br>
    <hr style=" width: 100px; 
    border: none;
    margin: 0 0 0 0;
    height: 1px;
    background-color: grey;"> 
    <br>`;
  return orderHTML;
}
