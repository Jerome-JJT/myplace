CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(250),
    password VARCHAR(250),
    is_admin BOOLEAN DEFAULT FALSE,
    banned_at TIMESTAMP DEFAULT NULL,

    token_seq INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    red INT CHECK (red >= 0 AND red <= 255),
    green INT CHECK (green >= 0 AND green <= 255),
    blue INT CHECK (blue >= 0 AND blue <= 255),
    corder INT
);

CREATE TABLE IF NOT EXISTS board (
    id SERIAL PRIMARY KEY,
    x INT NOT NULL,
    y INT NOT NULL,
    color_id INT REFERENCES colors(id) NOT NULL,
    user_id INT REFERENCES users(id),
    set_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cd_time TIMESTAMP
    -- PRIMARY KEY (x, y, set_time)
);

CREATE INDEX BoardPixels ON board(x, y, set_time);
CREATE INDEX BoardUsers on board(user_id);

-- SELECT
--     tablename,
--     indexname,
--     indexdef
-- FROM
--     pg_indexes
-- WHERE
--     schemaname = 'public'
-- ORDER BY
--     tablename,
--     indexname;

-- INSERT INTO colors (id, name, red, green, blue) VALUES 
--     (1, 'white', 236, 240, 241),
--     (2, 'black', 44, 62, 80),
--     (3, 'red', 231, 76, 60),
--     (4, 'indigo', 52, 152, 219),
--     (5, 'yellow', 241, 196, 15),
--     (6, 'lime', 46, 204, 113),
--     (7, 'orange', 230, 126, 34),
--     (8, 'purple', 155, 89, 182)
--     ON CONFLICT DO NOTHING
-- ;



-- INSERT INTO colors (id, name, red, green, blue) VALUES 
--     (1, 'white', 236, 240, 241),
--     (2, 'black', 44, 62, 80),
--     (3, 'red', 231, 76, 60),
--     (4, 'indigo', 52, 152, 219),
--     (5, 'yellow', 241, 196, 15),
--     (6, 'lime', 46, 204, 113),
--     (7, 'orange', 230, 126, 34),
--     (8, 'purple', 155, 89, 182),
--     ON CONFLICT DO NOTHING
-- ;


INSERT INTO colors (id, corder, name, red, green, blue) VALUES 
(1,   10, 'white', 236, 240, 241),
(2,   20, 'lightgray', 165, 180, 190),
(3,   30, 'darkgray', 105, 121, 135),
(4,   40, 'black', 44, 62, 80),
(5,   50, 'pink', 255, 167, 209),
(6,   60, 'red', 231, 76, 60),
(7,   70, 'orange', 230, 126, 34),
(8,   80, 'brown', 160, 106, 66),
(9,   90, 'yellow', 241, 196, 15),
(10, 100, 'lime', 54, 222, 127),
(11, 110, 'green', 2, 162, 1),
(12, 120, 'cyan', 0, 211, 212),
(13, 130, 'blue', 0, 152, 255),
(14, 140, 'indigo', 0, 65, 176),
(15, 150, 'magenta', 207, 110, 228),
(16, 160, 'purple', 155, 28, 182),
(17, 85, 'beige', 255, 224, 180),
(18, 55, 'darkred', 190, 0, 57)
ON CONFLICT (id) DO UPDATE SET
name = EXCLUDED.name,
corder = EXCLUDED.corder,
red = EXCLUDED.red,
green = EXCLUDED.green,
blue = EXCLUDED.blue;



-- INSERT INTO users (id, username, email) VALUES (-1, 'blur', 'blur');
-- INSERT INTO users (id, username, email) VALUES (007, 'moi', 'jerome');


-- DO $$
-- BEGIN
--     FOR i IN 0..99 LOOP
--         FOR j IN 0..99 LOOP
--             INSERT INTO board (x, y, color_id, user_id, set_time, cd_time) VALUES (i, j, 1, 42, NOW(), NOW());
--         END LOOP;
--     END LOOP;
-- END $$;

-- DO $$
-- BEGIN
--     FOR i IN 0..99 LOOP
--         FOR j IN 0..99 LOOP
--             INSERT INTO board (x, y, color_id, user_id) VALUES (i, j, CEILING(RANDOM() * 8), 42);
--         END LOOP;
--     END LOOP;
-- END $$;