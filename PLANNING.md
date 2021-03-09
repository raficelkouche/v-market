# Project Planning

​
## Description
  1. Project Title: V-Market (TBD)
  2. Description: Create a virtual market that allows users to walk around with friends, browse stores/vendors, and make purchases. Create a more interactive shopping experience.
  3. Target audience: people who like to shop, small store vendors 
  that dont have a store, market events like farmers markets or
  small local business
  4. Team Members: Rafic, Wilkie, Tammy
​
## User Stories
### Main
  1. As a user, I would like to browse multiple stores through one application (min 2 shops)
  2. As a user, I want to make purchases from multiple stores
  3. As a user, I want to be able to shop with my friends online
  4. As a guest, I want to be able to walk around and browse products
  5. As a user, I want to be able to speak to the seller through webcam
  6. As a user, I want to be able to see my cart
  7. As a user, I want to be able to message my friends on side chat
​ 
### Stretch
  1. As a user, I want to be able to make a wishlist
  2. As a vendor, I want to be able to update my store products, vendor management
  3. As a user, I want to be able to find a path to my friend 
  4. As a user, I want to be able to click on a Mini Map either on toolbar or in corner
  5. As a user, I want to play games with friends
  6. As a user, I want to be able to change my sprite
  7. As a user, I want to be able to view order history
  8. As a user, I want to have an inventory with coupons
  9. As a dev, I want to hide my texture resources from user 


## Wireframes
  1. GameMap
  2. Store View: store opened, single product view
  3. Landing Page: login/registration
  4. Game View
  - Top bar: Login/Logout, User-> Order History and Inventory
  - Side Bar: Chat, Friend List, Vendor list
  - Game Canvas
  5. Cart view
​
## ERDs
  1. Users: id, name, email, password, handle_name, is_online
  2. Stores: id, owner(user_id), name, description, banner_img
  3. Products: id, category_id, store_id, name, description, price, quantity, sale_amount
  4. Categories: id, name
  5. Orders: id, store_id, user_id, date_created, total_price
  6. LineItems: id, order_id, product_id, quantity, total_price
  7. FavItems: id, user_id, product_id
  8. Friends: id, owner(user_id), friend_id(user_id)
​
## Stack Choices
  1. JS, HTML, CSS, Phaser, Socket.io, Express, PostgresSql, Bootstrap
  2. Stretch: Webpack

## ROUTES
| Route                                   | HTTP Verb          | Description  |
| ----------------------------------------|:------------------:| ------------:|
| /                                       | GET                | HomePage     |
| /users/:u_id                            | GET                | Get user info|
| /users/:u_id/wishlist                   | POST               | Get user info|
| /users/:u_id/orders                     | GET                | get all orders for a user |
| /users/:u_id/orders                     | POST               | Add new order for user |
| /users/:u_id/orders/:order_id           | GET                | retrieve a specific order     |
| /users/login                            | POST               | login user (retrieve user data)   |
| /users/logout                           | POST               | logout user (clear cookie session & update user is_online false) |
| /users                                  | POST               | Register user|
| /stores                                 | GET                | All stores info |
| /stores/:store_id                       | GET                | Store Window |
| /stores/:store_id/:category_id          | GET                | Get items of cateroy from store (Stretch)|
| /stores/:store_id/:product_id           | GET                | Store Window - ind. product detail |
| /assets/...path_to_resource             | GET                | Resource for Game |

## Tasks:
### Game logic
  - create map - T
  - add store names - T
  - create characters - T
  - interact with stores - W
  - interact with customer service (webcam) - W
  - client side socket.io setup -W
  - chat (client side) 
  - display instructions for user to interact with objects - W
  - background music - W
  - add player name - W
### User interaction:
  - entry scene (login / register) -R
  - navbar -R
### Store logic:
  - homepage showing all the products -T
  - product specific page -T
  - checkout page -T
### Server logic:
  - setup routes - R
  - socket.io (server side) - R
### Database logic:
  - setup database helper methods to be used by the server - R
  - create schema seed the database - R 


## Useful Resources:
- https://phasertutorials.com/how-to-create-a-phaser-3-mmorpg-part-1/
- https://phaser.io/examples/v3/view/game-objects/dom-element/form-input

## PRESENTATION
1. Hello everyone, thank you for joining us on demo day. Before we begin, we would first like to thank the mentors and instructors at LHL who have helped us along our journey.

2. Wilkie introduction

3. Tammy Introduction: My name is Tammy, and before lighthouse labs, I was a production supervisor at a food manufacturing facility. Today, we are excited to present to you our project, V-Market.

4. A. Rafic: We are presenting to you V-Market. A virtual marketplace that redfines online shopping. It brings buyers and sellers together on a 2D map to simulate the real-life experience. 

4. B. Rafic: The inspiration for the project comes from Gather town. We wanted to challenge ourselves with what we have learned and play with new libraries like Phaser and Socket. Being able to apply what we have learned from LHL and integrating with a new model like a game platform has introduced us to new challenges.



DEMO WALKTHTHROUGH: Rafic driver, Tammy speaker

5. Tammy: (Landing page -> login, -> walk around and talk about navbar features?) 
  - First the user will log in through the landing page, then spawn in the V-Market map. $The platform was created using the Phaser 3 Library and the map was designed using Tiled map editor.$ As a user, they can use the top nav bar to view user account information, toggle the mini map and toggle background music. 
  
  -On the side bar, youll see a friends list and any friends that are online, You can instant message or request a video chat. A fun feature is that you can walk around and explore the V-market with your friend online. $This was made possible through Socket IO.$
  
  The map includes areas to explore like the beach or the park but The main feature will be marketplace in the middle. and with each booth, a vendor can place a store representative behind the counter to provide assitance in real-time.

  Lets head over to a store. In the store you can browse at products, add to cart, and checkout using your credit card. If you need assitance you can click the customer support button. Currently there is no representative available right now, but if the vendor was online, the customer would be able to request a video chat. 

  That is all for our demo. Wilkie will talk about our teamwork and challenges.


6. Tammy: (second player joins, show chat feature (text/video), 

7. Wilkie: go to store 


TEAMWORK


8.  Wilkie : As a team, we divided the work through features as well as strengths and weaknesses . For myself(Tammy), I mainly focused on the ecommerce client side of the  project as well as some front-end UI design and game map

  - Tammy: I mainly focused on the ecommerce client side of the project as well as some front-end UI design and game map
  - Wilkie: game set up and logic, bug master, ecommerce vendor side
  - Rafic: integration of backend set up of sockets and webcams


Further developments: Tammy
It could be one person talking:
9. In the future, we would like to expand and add more features to the user (order history, coupon backpack, favorite list), features for the vendor (give more control?)
what else?

10. Challenges , learning experience: Rafic





