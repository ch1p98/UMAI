![](https://i.imgur.com/Pu64hiV.png)
### A web-service that recommends restaurants, and more

## Table of Contents
- Abstract
- Feature
- Usage/Examples
- Technical Things
- Author

## Abstract
[UMAI](https://chipmunk.vip) is a web service that enables you to search for restaurants, cafes, diners, etc, as you wish. If you do find a good place and have a good time there, you may also leave a review and save that spot in your pocket list.

What's more, you may also check other users' reviews and their profile, taking a look of places in their pocket lists or people that they are interested in.

Bon appétit!

## Feature
- Search for restaurants with customized keywords and conditions
- Leave reviews for restaurants
- Save restaurants in your pocket list
- Follow other people, check the restaurants they saved and the people they followed
- Get personalized recommendation of restaurants (coming soon)

## Usage/Examples
### Before All
This web-service is built as a single page application, so you should avoid pressing next/previous page or corresponding keyboard shortcuts on your browser; If unexpected things occur, such as unresponsiveness of the page, you may simply reload the page. The information on the webpage might be lost. However, your logging status and other saved data will be intact.  


### Sign Up / Sign In
![](https://i.imgur.com/BtxIgBg.gif)
Sign up as a new user, or sign in with following test accounts:

email: elliechen@gmail.com

password: test  
//

email: adam_apple@gmail.com

password: test  



### Search

#### Tips
Click the navbar item "魔法搜尋器" to reveal a panel that displays many filters. You can input one, two, or all of them. 
Specifically, you can fill multiple options in a filter if needed. Each filter provides some example options that you may use. Moreover, you are also encouraged to input options freely.

### Search Result
Search
![](https://i.imgur.com/Pkbv4qZ.gif)

Add to/remove from favorite(pocket) list
![](https://i.imgur.com/LfvG98r.gif)

Opening hours
![](https://i.imgur.com/7abtoK7.gif)

#### Interface
Once you click search, the page shows the result, providing brief information of each restaurant that meets the query. It is set to display 10 items at most in a page. If the size of result is larger than that, a paginator at the bottom navigates you to the rest of your result.
In addition, in each box, an icon shows whether it is opening. Click the icon and it will show opening hours in detail.

What's more, you can also click the heart icon at the right-upper corner to save it to the pocket list (sign-in required); clicking it again will remove it from the pocket list.  

Finally, you can get more information of a restaurant by clicking names or pictures in the box.

### Restaurant Info Page
![](https://i.imgur.com/3Sbq7lk.gif)
This page shows detailed information of a restaurant. Furthermore, it enables users to check reviews left by other users and leave a review themselves (sign-in required).

### Profile Page
![](https://i.imgur.com/z08iIZd.gif)
Once you successfully sign up or sign in, the header item "關於我" shows. Click to view your profile, pocket list and friend list.
Then, you may click boxes of restautants in your pocket list to obtain information or click "visit" button of boxes of people in your friend list to view their profile, pocket list and friends. 


### recommended restaurants (coming soon)
### recommended people to follow (coming soon)



## Technical Things
![](https://i.imgur.com/VYVJPjR.png)

**Server side:** Node, Express

**Database:** Elasticsearch, mongoDB

**Client side:** jQuery, AJAX

**Environment:** AWS EC2

#### Search
The *elastic* searching function of UMAI comes with Elasticsearch. Elasticsearch excels at full-text search pretty much from a mechanism called inverted index. This technique retrieves tokens, short pieces, of words from data and stores them along with documents that carry them, thus allowing blazingly fast full-text search.

Furthermore, it provides various types of querying functions to retrieve data as its user's need. Let's say you want to find restaurants in Taipei that are pet-friendly and provide parking space. Naturally, you would query for data that have '台北市', '寵物友善', and '停車場'. In order to do so, you may set '台北市' a filter that simply excludes restaurants not qualified, and let '寵物友善' and '停車場' be the keywords that contribute to the score of each document in the index.

#### Database 
UMAI stores data for its users, including favorite list of restaurants, friend list, and their profiles. The documents of users may vary greatly in sizes and fields. As a result, UMAI uses mongoDB as its database.

#### Recommendation System
(coming soon)


## Author
- Github: [@ch1p98](https://github.com/ch1p98)
- Email: sst.sunny.tai@gmail.com
- Feel free to contact me if you have any feedback or question about this project. Any suggestion or idea will be appreciated.
