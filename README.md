## Env

`PIXEL_BUFFER_SIZE` => how much pixels can be put at one time, how much pixels can be stacked
<br>
`PIXEL_MINUTE_TIMER` => individual cooldown for each pixels
<br>
`REDIS_SPAN_SECONDS` => max time for random (between 0 and REDIS_SPAN_SECONDS) for redis cache
<br>
`REDIS_MIN_SECONDS` => min time for redis cache
<br>
`JWT_EXPIRES_IN & JWT_REFRESH_EXPIRES_IN` => time for jwt expiration in seconds
<br>
`API_UID` & `API_SECRET` & `API_CALLBACK` => calibrated for 42 API
<br>

Mode prod can be switch in the makefile

## Useful Doc/Links

#### How we made rplace blogpost 2017
https://redditinc.com/blog/how-we-built-rplace


#### Post video rplace explaination
https://www.reddit.com/r/RedditEng/comments/vcyeqi/how_we_built_rplace/


#### Front explaination 2022
https://www.reddit.com/r/RedditEng/comments/vhh962/how_we_built_rplace_2022_web_canvas_part_1/
<br>
https://www.reddit.com/r/RedditEng/comments/voc9ax/how_we_built_rplace_2022_web_canvas_part_2/

#### Backend explaination 2022

https://www.reddit.com/r/RedditEng/comments/vwv2fl/how_we_built_rplace_2022_backend_part_1_backend/


## Inspirations

#### RPlace implementation in vue and laravel

https://www.youtube.com/watch?v=XSw5fFo0_pA
https://github.com/aschmelyun/laraplace

#### RPlace atlas
https://2022.place-atlas.stefanocoding.me/#//59/442/4

## View/Example
<img src="https://jerome-jjt.github.io/images/projects/ftplace/ftplace_view.png" alt="preview" width="700"/>
