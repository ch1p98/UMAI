# UMAI
#### A web-service that recommends restaurants, and more

## Table of Contents

- Summary
- Author
- Feature

- Usage

- Technical Things
## Summary
This is a web service that enables you to search for restaurants, cafes, diners, etc, as you wish. If you do find a good place and have a good time there, you may also leave a review and save that spot in your pocket list.

What's more, you may also check other users' reviews and their profile, taking a look of places in their pocket lists or people that they are interested in.

Bon appétit!

## Author
- [@ch1p98](https://github.com/ch1p98)


## Feature
- search for restaurants with customize keywords and conditions
- leave reviews for restaurant
- save restaurants in pocket list
- follow other people, check the restaurants they saved and the people they followed
- get personalized recommendation of restaurants (coming soon)

## Usage/Examples
### Before all
This web-service is built as a simple single page application, so you may avoid pressing next/previous page on your browser and using corresponding keyboard shortcuts; If unexpected things occur, such as page unresponsiveness, you may simply reload the page. The information on the webpage will lose. However, your logging status and other data will be intact.  


### Sign Up

### Search
#### Tips
The website shows a panel that displays many filters. You can input one, two, or all of them. 
Specifically, you can use multiple options in a filter if needed. Each filter provides some example options that you may use. While you are also allowed to input options on your own.

### Result of search
#### Interface
Once you click search, the page shows the result, providing brief information of each restaurant that meets the query. The page is set to display 10 items at most. If the size of result is larger than that, a paginator at the bottom navigates you to the rest of your result.
In addition, in each box, an icon shows whether it is opening. Click the icon and it will show opening hours in detail.

What's more, you can also click the heart icon at the right-upper corner to save it to the pocket list; clicking it again will remove it from the pocket list.  

Finally, you can get more information of a restaurant by clicking names or pictures in the box.

### Restaurant page
This page shows full information of a restaurant. Furthermore, it enables users to:
    - check reviews and leave a review
    - check pieces of reviews from 
- profile
    - check user profile
    - edit user profile
    - pocket list
        - check items
        - remove an item
    - friend list
        - see one's profile
        - remove them from the list(coming soon)
    - (other people's) profile page
        - difference with user profile
        - check their pocket list
        - check who they are following
- recommended restaurants (coming soon)
- recommended people to follow (coming soon)


## Technical Things


**Server:** Node, Express

**Database:** Elasticsearch, mongoDB

**Client:** jQuery, AJAX

**Environment:** AWS EC2

#### Search
The *elastic* searching function of UMAI came with Elasticsearch. Elasticsearch excels at full-text search pretty much from a mechanism called inverted index. This technique retrieves token of words from data and stores token along with documents that carry it, thus allowing blazingly fast full-test search.

Furthermore, it provides various types of querying functions to retrieve data as its user's need. Let's say you want to find restaurants in Taipei that are pet-friendly and provide parking space. Naturally, you would query for data that have '台北市', '寵物友善', and '停車場'. In order to do so, you may set '台北市' a filter that simply excludes data not including it, and let '寵物友善' and '停車場' be the keywords that contribute to the score of each document in the index.

#### Database 
UMAI stores data for its users, including favorite list of restaurants, following people, and their profiles. The documents of users may vary greatly in sizes and fields. As a result, UMAI uses mongoDB as its database.

#### Recommendation
(coming soon)

![Logo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/th5xamgrr6se0x5ro4g6.png)


## Demo

Insert gif or link to demo

