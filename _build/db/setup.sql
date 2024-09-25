CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(250)
);

CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    red INT CHECK (red >= 0 AND red <= 255),
    green INT CHECK (green >= 0 AND green <= 255),
    blue INT CHECK (blue >= 0 AND blue <= 255)
);

CREATE TABLE board (
    x INT NOT NULL,
    y INT NOT NULL,
    color_id INT REFERENCES colors(id),
    user_id INT REFERENCES users(id),
    set_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (x, y, set_time)
);


-- INSERT INTO users (id, name, email) VALUES (42, 'blur', 'blur');
-- INSERT INTO users (id, name, email) VALUES (92477, 'moi', 'jerome');

-- INSERT INTO colors (name, red, green, blue) VALUES 
--     ('red', 231, 76, 60),
--     ('blue', 52, 152, 219),
--     ('yellow', 241, 196, 15),
--     ('green', 46, 204, 113),
--     ('orange', 230, 126, 34),
--     ('purple', 155, 89, 182),
--     ('white', 236, 240, 241),
--     ('black', 44, 62, 80)
-- ;

-- DO $$
-- BEGIN
--     FOR i IN 0..99 LOOP
--         FOR j IN 0..99 LOOP
--             INSERT INTO board (x, y, color_id, user_id) VALUES (i, j, CEILING(RANDOM() * 8), 42);
--         END LOOP;
--     END LOOP;
-- END $$;