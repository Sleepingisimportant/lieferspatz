import sqlite3
from flask import *
import requests
import traceback


import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="/")

app.config["JSON_AS_ASCII"] = False
app.config["TEMPLATES_AUTO_RELOAD"] = True

app.secret_key = os.getenv("appSecretKey")


def get_db_connection():
    conn = sqlite3.connect("./data/lieferspatz.db")
    conn.row_factory = sqlite3.Row
    return conn


# Pages


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/restaurant/<restaurantId>")
def attraction(restaurantId):
    return render_template("restaurant.html")


@app.route("/manage/order")
def manage_order():
    return render_template("manageOrder.html")


@app.route("/manage/restaurant")
def manage_restaurant():
    return render_template("manageRestaurant.html")


# success message
def success_message():
    return {
        "ok": True,
    }


# handle error


def error_messsage(message):
    return {
        "error": True,
        "message": message,
    }


@app.errorhandler(Exception)
def handle_exception():
    print("error:")
    print(traceback.format_exc())
    # now you're handling non-HTTP exceptions only
    return error_messsage("Internal Server Error."), 500


## APIs ##


@app.route("/api/customer", methods=["POST"])
def api_register_customer():
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        request_params = request.get_json()
        name = request_params["name"]
        password = request_params["password"]
        address = request_params["address"]
        zipCode = request_params["zipCode"]

        cursor.execute(
            "INSERT INTO user (name,password,role) VALUES (?,?,?)",
            (name, password, "customer"),
        )
        userId = cursor.lastrowid
        print("userId: " + str(userId))

        cursor.execute(
            "INSERT INTO customer (userId,address,zipCode) VALUES (?,?,?)",
            (userId, address, zipCode),
        )

        cnx.commit()

        return success_message()

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/restaurant/create", methods=["POST"])
def api_register_restaurant():
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        request_params = request.get_json()
        restaurantName = request_params["restaurantName"]
        restaurantPassword = request_params["restaurantPassword"]
        restaurantAddress = request_params["restaurantAddress"]
        restaurantZipCode = request_params["restaurantZipCode"]
        restaurantOpenTime = request_params["restaurantOpenTime"]
        restaurantCloseTime = request_params["restaurantCloseTime"]
        restaurantDescription = request_params["restaurantDescription"]
        restaurantPicture = request_params["restaurantPicture"]

        cursor.execute(
            "INSERT INTO user (name,password,role) VALUES (?,?,?)",
            (restaurantName, restaurantPassword, "restaurant"),
        )
        userId = cursor.lastrowid

        cursor.execute(
            "INSERT INTO restaurant (userId ,restaurantAddress,restaurantZipCode,restaurantOpenTime,restaurantCloseTime,restaurantDescription,restaurantPicture) VALUES (?, ?, ?,?,?,?,?)",
            (
                userId,
                restaurantAddress,
                restaurantZipCode,
                restaurantOpenTime,
                restaurantCloseTime,
                restaurantDescription,
                restaurantPicture,
            ),
        )
        restaurantId = cursor.lastrowid

        zipCode = int(restaurantZipCode)

        for azc in range(zipCode - 2, zipCode + 3):
            cursor.execute(
                "INSERT INTO radius (restaurantId, allowedZipCode) VALUES (?, ?)",
                (
                    restaurantId,
                    azc,
                ),
            )

        cnx.commit()

        return success_message()

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/restaurant/show/<userId>", methods=["GET"])
def api_show_allowed_restaurant(userId):
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        json = {}
        i = 0
        zipCode = cursor.execute(
            "SELECT zipCode FROM customer WHERE userId=?", (userId,)
        ).fetchall()
        for row in zipCode:
            userZipCode = row[0]
            data = cursor.execute(
                "SELECT restaurantId FROM radius WHERE allowedZipCode=?", (userZipCode,)
            ).fetchall()

            for d in data:
                restaurantId = d[0]
                restaurantData = cursor.execute(
                    """
                    SELECT
                        user.name,
                        restaurant.restaurantAddress,
                        restaurant.restaurantZipCode,
                        restaurant.restaurantOpenTime,
                        restaurant.restaurantCloseTime,
                        restaurant.restaurantDescription,
                        restaurant.restaurantPicture,
                        restaurant.restaurantId
                    FROM
                        restaurant
                    INNER JOIN
                        user ON restaurant.userId = user.userId
                    WHERE
                        restaurant.restaurantId = ?
                """,
                    (restaurantId,),
                ).fetchall()

                for row in restaurantData:
                    now = datetime.now()
                    current = now.strftime("%H:%M")
                    time_format = "%H:%M"
                    openTime = datetime.strptime(row[3], time_format)
                    closeTime = datetime.strptime(row[4], time_format)
                    currentTime = datetime.strptime(current, time_format)

                    if currentTime < closeTime and currentTime > openTime:
                        json[i] = {
                            "restaurantName": row[0],
                            "restaurantAddress": row[1],
                            "restaurantZipCode": row[2],
                            "restaurantOpenTime": row[3],
                            "restaurantCloseTime": row[4],
                            "restaurantDescription": row[5],
                            "restaurantPicture": row[6],
                            "restaurantId": row[7],
                        }
                        i = i + 1

        return json

        return json

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Fail."), 400

    finally:
        cnx.close()


@app.route("/api/menu/<restaurantId>", methods=["GET"])
def api_show_menu(restaurantId):
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        data = cursor.execute(
            "SELECT  itemName, itemDescription, itemPrice, itemId FROM menu WHERE restaurantId=?",
            (int(restaurantId),),
        ).fetchall()

        json = {}
        i = 1
        for d in data:
            json[i] = {
                "itemName": d[0],
                "itemDescription": d[1],
                "itemPrice": d[2],
                "itemId": d[3],
            }
            i += 1

        return json

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/menu/create", methods=["POST"])
def api_create_menu():
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        request_params = request.get_json()
        restaurantId = request_params["restaurantId"]
        itemName = request_params["itemName"]
        itemDescription = request_params["itemDescription"]
        itemPrice = request_params["itemPrice"]

        cursor.execute(
            "INSERT INTO menu (restaurantId,itemName,itemDescription,itemPrice) VALUES (?,?,?,?)",
            (restaurantId, itemName, itemDescription, float(itemPrice)),
        )

        cnx.commit()
        return success_message()

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()

@app.route("/api/menu/delete/<itemId>", methods=["DELETE"])
def api_delete_menu(itemId):
  
    try:
       
        cnx = get_db_connection()
        cursor = cnx.cursor()

        cursor.execute(
            "DELETE FROM menu WHERE itemId= ?",
            (
                itemId,
            ),
        )

        cnx.commit()

        return success_message()

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/user/auth", methods=["PUT"])
def api_login_user():
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        request_params = request.get_json()
        name = request_params["name"]
        password = request_params["password"]

        data = cursor.execute(
            "SELECT * FROM user WHERE name = ? AND password = ?",
            (
                name,
                password,
            ),
        ).fetchall()

        len_data = len(data)
        if len_data == 0:
            return error_messsage("Wrong email or password.")

        else:
            for user in data:
                token = jwt.encode(
                    {
                        "id": user[0],
                        "name": user[1],
                        "role": user[3],
                        "expiration": str(
                            datetime.utcnow() + timedelta(seconds=604800)
                        ),
                    },
                    app.secret_key,
                    algorithm="HS256",
                )

            json = make_response(success_message())
            json.set_cookie("token", token, max_age=604800, samesite=None, secure=False)

            return json

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/user/auth", methods=["DELETE"])
def api_logout_user():
    json = make_response(success_message())
    json.delete_cookie("token")
    return json


# https://blog.51cto.com/hanzhichao/5325252
@app.route("/api/user/auth", methods=["GET"])
def api_verify_authentication():
    token = request.cookies.get("token")

    if token is None:
        return {"data": None}

    try:
        _payload = jwt.decode(token, app.secret_key, algorithms="HS256")

        json = {
            "data": {
                "id": _payload["id"],
                "name": _payload["name"],
                "role": _payload["role"],
            }
        }

        return json

    except jwt.InvalidTokenError as e:
        print("jwt.InvalidTokenError")

        print(e)

        return {"data": None}
    except jwt.PyJWTError as e:
        print("jwt.PyJWTError")
        print(e)
        return {"data": None}


@app.route("/api/restaurant/info/owner", methods=["GET"])
def api_get_manage_restaurant():
    token = request.cookies.get("token")
    if token is None:
        return error_messsage("Login first")
    try:
        _payload = jwt.decode(token, app.secret_key, algorithms="HS256")

        userId = int(_payload["id"])

        cnx = get_db_connection()
        cursor = cnx.cursor()

        data = cursor.execute(
            """
    SELECT
        user.name,
        restaurant.restaurantAddress,
        restaurant.restaurantZipCode,
        restaurant.restaurantOpenTime,
        restaurant.restaurantCloseTime,
        restaurant.restaurantDescription,
        restaurant.restaurantPicture,
        restaurant.restaurantId
    FROM
        restaurant
    INNER JOIN
        user ON restaurant.userId = user.userId
    WHERE
        restaurant.userId = ?
""",
            (userId,),
        ).fetchall()

        json = {}
        for d in data:
            json = {
                "name": d[0],
                "address": d[1],
                "zipCode": d[2],
                "openTime": d[3],
                "closeTime": d[4],
                "description": d[5],
                "picture": d[6],
                "restaurantId": d[7],
            }

        restaurantId = json["restaurantId"]

        radius = cursor.execute(
            "SELECT allowedZipCode FROM radius WHERE radius.restaurantId =?",
            (restaurantId,),
        ).fetchall()
        allowedZipCodeList = []
        for r in radius:
            allowedZipCodeList.append(r[0])

        json["allowedZipCode"] = allowedZipCodeList

        cnx.close()

        return json

    except jwt.InvalidTokenError as e:
        print("jwt.InvalidTokenError")

        print(e)

        return {"data": None}
    except jwt.PyJWTError as e:
        print("jwt.PyJWTError")
        print(e)
        return {"data": None}


@app.route("/api/restaurant/info/customer/<restaurantId>", methods=["GET"])
def api_get_view_restaurant(restaurantId):
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        data = cursor.execute(
            """
    SELECT
        restaurant.restaurantAddress,
        restaurant.restaurantZipCode,
        restaurant.restaurantOpenTime,
        restaurant.restaurantCloseTime,
        restaurant.restaurantDescription,
        restaurant.restaurantPicture,
        user.name

    FROM
        restaurant
    INNER JOIN
        user ON restaurant.userId = user.userId
    WHERE
        restaurant.restaurantId = ?
""",
            (restaurantId,),
        ).fetchall()

        json = {}
        for d in data:
            json = {
                "address": d[0],
                "zipCode": d[1],
                "openTime": d[2],
                "closeTime": d[3],
                "description": d[4],
                "picture": d[5],
                "name": d[6],
            }

        menu = cursor.execute(
            "SELECT itemName, itemDescription, itemPrice,itemId FROM menu WHERE menu.restaurantId =?",
            (restaurantId,),
        ).fetchall()

        cnx.close()

        return json

    except jwt.InvalidTokenError as e:
        print("jwt.InvalidTokenError")

        print(e)

        return {"data": None}
    except jwt.PyJWTError as e:
        print("jwt.PyJWTError")
        print(e)
        return {"data": None}


@app.route("/api/cart/add", methods=["POST"])
def api_add_cart():
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        request_params = request.get_json()

        userId = request_params["userId"]
        restaurantId = request_params["restaurantId"]
        itemId = request_params["itemId"]
        itemName = request_params["itemName"]
        itemPrice = request_params["itemPrice"]
        itemAmount = request_params["itemAmount"]
        restaurantName = request_params["restaurantName"]

        cursor.execute(
            "INSERT INTO cart (userId, restaurantId,itemId,itemName,itemPrice,itemAmount,restaurantName) VALUES (?, ?, ?, ?, ?,?,?)",
            (
                userId,
                restaurantId,
                itemId,
                itemName,
                itemPrice,
                itemAmount,
                restaurantName,
            ),
        )
        cnx.commit()

        return success_message()

    finally:
        cnx.close()


@app.route("/api/cart/get", methods=["GET"])
def api_cart_get():
    token = request.cookies.get("token")
    if token is None:
        return error_messsage("Login first")
    try:
        _payload = jwt.decode(token, app.secret_key, algorithms="HS256")
        userId = int(_payload["id"])

        cnx = get_db_connection()
        cursor = cnx.cursor()

        data = cursor.execute(
            "SELECT  itemId, itemName, itemPrice, itemAmount, restaurantId, restaurantName FROM cart WHERE userId=? AND orderId IS NULL",
            (userId,),
        ).fetchall()

        combined_data_list = listCartItems(data)

        return combined_data_list

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/cart/delete/<itemId>", methods=["DELETE"])
def api_delete_cart_item(itemId):
    token = request.cookies.get("token")
    if token is None:
        return error_messsage("Login first")
    try:
        _payload = jwt.decode(token, app.secret_key, algorithms="HS256")
        userId = int(_payload["id"])

        cnx = get_db_connection()
        cursor = cnx.cursor()

        cursor.execute(
            "DELETE FROM cart WHERE userId= ? AND itemId=? AND orderId IS NULL",
            (
                userId,
                int(itemId),
            ),
        )

        cnx.commit()

        return success_message()

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/order/create", methods=["POST"])
def api_create_order():
    token = request.cookies.get("token")
    if token is None:
        return error_messsage("Login first")
    try:
        request_params = request.get_json()
        itemIdCommentDic = request_params["itemIdComment"]

        _payload = jwt.decode(token, app.secret_key, algorithms="HS256")
        userId = int(_payload["id"])

        cnx = get_db_connection()
        cursor = cnx.cursor()
        data = cursor.execute(
            "SELECT  itemId, itemName, itemPrice, itemAmount, restaurantId, restaurantName FROM cart WHERE userId=? AND orderId IS NULL",
            (userId,),
        ).fetchall()

        combine_data_list = combineCartForOrder(data,itemIdCommentDic)

        for entry in combine_data_list:
            item_total_prices = [item["totalPrice"] for item in entry["item"].values()]
            order_total_price = sum(item_total_prices)
            restaurantId=entry["restaurantId"]

            cursor.execute(
                "INSERT INTO createdOrder (userId, restaurantId, orderStatus, orderTotalPrice) VALUES (?, ?,?, ?)",
                (userId, restaurantId,"Created", order_total_price),
            )

            orderId = cursor.lastrowid
            print(orderId)

            
            for itemId in entry["item"]:
                print(itemId)
                print(itemIdCommentDic[str(itemId)])

                cursor.execute(
                        """UPDATE cart
                        SET orderId = ?, orderComment = ?
                        WHERE itemId = ? AND orderId IS NULL;""",
                        (orderId, itemIdCommentDic[str(itemId)], itemId  ),
                    )
            
            cnx.commit()
            
            # for itemId, itemComment in itemIdCommentDic.items():
            #     cursor.execute(
            #         """UPDATE cart
            #         SET orderId = ?, orderComment = ?
            #         WHERE itemId = ? AND orderId IS NULL;""",
            #         (orderId, itemComment, itemId),
            #     )


        # # create order
        # cursor.execute(
        #     "INSERT INTO createdOrder (userId, orderStatus, orderTotalPrice) VALUES (?, ?,?)",
        #     (userId, "created", orderTotalPrice),
        # )
        # orderId = cursor.lastrowid

     


        return success_message()

    finally:
        cnx.close()


@app.route("/api/order/reject", methods=["POST"])
def api_reject_order():
    try:
        request_params = request.get_json()
        orderId = request_params["orderId"]

        cnx = get_db_connection()
        cursor = cnx.cursor()
        print(orderId)
        cursor.execute(
            """UPDATE createdOrder
            SET orderStatus = ?
            WHERE orderId = ? ;""",
            (
                "Rejected",
                orderId,
            ),
        )

        cnx.commit()

        return success_message()

    finally:
        cnx.close()

@app.route("/api/order/confirm", methods=["POST"])
def api_confirm_order():
    try:
        request_params = request.get_json()
        orderId = request_params["orderId"]

        cnx = get_db_connection()
        cursor = cnx.cursor()
        print(orderId)
        cursor.execute(
            """UPDATE createdOrder
            SET orderStatus = ?
            WHERE orderId = ? ;""",
            (
                "Confirmed",
                orderId,
            ),
        )

        cnx.commit()

        return success_message()

    finally:
        cnx.close()

@app.route("/api/order/deliver", methods=["POST"])
def api_deliver_order():
    try:
        request_params = request.get_json()
        orderId = request_params["orderId"]

        cnx = get_db_connection()
        cursor = cnx.cursor()
        print(orderId)
        cursor.execute(
            """UPDATE createdOrder
            SET orderStatus = ?
            WHERE orderId = ? ;""",
            (
                "Delivered",
                orderId,
            ),
        )

        cnx.commit()

        return success_message()

    finally:
        cnx.close()

@app.route("/api/order/get/customer", methods=["GET"])
def api_get_order_customer():
    token = request.cookies.get("token")
    if token is None:
        return error_messsage("Login first")
    try:
        _payload = jwt.decode(token, app.secret_key, algorithms="HS256")
        userId = int(_payload["id"])

        cnx = get_db_connection()
        cursor = cnx.cursor()

        data = cursor.execute(
            """SELECT  createdOrder.orderId,restaurantName,itemName,itemPrice, itemAmount,   createdOrder.orderStatus, itemId
            FROM cart 
            INNER JOIN createdOrder ON cart.orderId = createdOrder.orderId
            WHERE createdOrder.userId=? AND cart.orderId IS NOT NULL
            ORDER BY createdOrder.orderId DESC""",
            (userId,),
        ).fetchall()

        json = {}
        for d in data:
            if d[0] not in json:
                json[d[0]] = {}
                json[d[0]]["item"] = {}
                json[d[0]]["orderStatus"] = d[5]
            if len(json[d[0]]["item"])==0:
                json[d[0]]["item"]={d[6]:{"restaurantName": d[1],"itemName": d[2], "itemAmount": d[4]}}
            else:
                if d[6] in  json[d[0]]["item"]:
                    json[d[0]]["item"][d[6]]["itemAmount"]+=d[4]
                else:
                    json[d[0]]["item"][d[6]]={"restaurantName": d[1],"itemName": d[2], "itemAmount": d[4]}

            
        

        return json

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


@app.route("/api/order/get/restaurant/<restaurantId>", methods=["GET"])
def api_get_order_restaurant(restaurantId):
    try:
        cnx = get_db_connection()
        cursor = cnx.cursor()

        data = cursor.execute(
            """SELECT  createdOrder.orderId, itemName, itemAmount,  createdOrder.orderStatus, user.name,orderComment,itemId
            FROM cart 
            INNER JOIN createdOrder ON cart.orderId = createdOrder.orderId
            INNER JOIN user ON cart.userId = user.userId
            WHERE cart.restaurantId=? AND cart.orderId IS NOT NULL
            ORDER BY createdOrder.orderId""",
            (restaurantId,),
        ).fetchall()

        json = {}
        for d in data:
            print(d[0])
            if d[0] not in json:
                json[d[0]] = {}
                json[d[0]]["item"] = {}
                json[d[0]]["orderStatus"] = d[3]
                json[d[0]]["customerName"] = d[4]

            if len(json[d[0]]["item"])==0:
                json[d[0]]["item"]={d[6]:{"itemName": d[1], "itemAmount": d[2],"orderComment":d[5]}}
            else:
                if d[6] in json[d[0]]["item"]:
                    json[d[0]]["item"][d[6]]["itemAmount"]+=d[2]
                else:
                    json[d[0]]["item"][d[6]]={"itemName": d[1], "itemAmount": d[2],"orderComment":d[5]}




        return json

    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return error_messsage("Registration fail."), 400

    finally:
        cnx.close()


def combineCartForOrder(data,itemIdCommentDic):
    combined_data = {}
    for item_data in data:
        itemId = item_data["itemId"]
        itemName = item_data["itemName"]
        itemPrice = item_data["itemPrice"]
        itemAmount = item_data["itemAmount"]
        restaurantId = item_data["restaurantId"]
        restaurantName = item_data["restaurantName"]
        restaurantId = item_data["restaurantId"]

        if restaurantId in combined_data:
            if itemId in combined_data[restaurantId]["item"]:
                combined_data[restaurantId]['item'][itemId]["itemAmount"] += itemAmount
                combined_data[restaurantId]['item'][itemId]["totalPrice"] += (
                    itemPrice * itemAmount
                )
                combined_data[restaurantId]['item'][itemId]["orderComment"]=itemIdCommentDic[str(itemId)]
            else:
                combined_data[restaurantId]["item"][itemId] = {
                    "itemName": itemName,
                    "itemAmount": itemAmount,
                    "totalPrice": itemPrice * itemAmount,
                }
        else:

            combined_data[restaurantId] = {"restaurantId":restaurantId,"restaurantName": restaurantName, "item": {}}
            combined_data[restaurantId]["item"][itemId] = {
                "itemName": itemName,
                "itemAmount": itemAmount,
                "totalPrice": itemPrice * itemAmount,
                "orderComment":itemIdCommentDic[str(itemId)]
            }

      
    combined_data_list = list(combined_data.values())
    print(combined_data_list)
    return combined_data_list


def listCartItems(data):
    combined_data = {}
    for item_data in data:
        itemId = item_data["itemId"]
        itemName = item_data["itemName"]
        itemPrice = item_data["itemPrice"]
        itemAmount = item_data["itemAmount"]
        restaurantId = item_data["restaurantId"]
        restaurantName = item_data["restaurantName"]

        if restaurantId in combined_data:
            if itemId in combined_data[restaurantId]["item"]:
                print(combined_data[restaurantId])
                combined_data[restaurantId]['item'][itemId]["itemAmount"] += itemAmount
                combined_data[restaurantId]['item'][itemId]["totalPrice"] += (
                    itemPrice * itemAmount
                )
            else:
                combined_data[restaurantId]["item"][itemId] = {
                    "itemName": itemName,
                    "itemAmount": itemAmount,
                    "totalPrice": itemPrice * itemAmount,
                }
        else:
            combined_data[restaurantId] = {"restaurantName": restaurantName, "item": {}}
            combined_data[restaurantId]["item"][itemId] = {
                "itemName": itemName,
                "itemAmount": itemAmount,
                "totalPrice": itemPrice * itemAmount,
            }

        # for item_id, item_data in combined_data.items()["item"].items():
        #     item_data["totalPrice"] = round(item_data["totalPrice"], 2)
    # Convert the result to a list
    combined_data_list = list(combined_data.values())
    return combined_data_list


if __name__ == "__main__":
    # app.run(host="0.0.0.0", port=3000)
    app.run(port=3000)
