CREATE DATABASE seriestogetherdb;

USE seriestogetherdb;

--USERS TABLE
CREATE TABLE users(
    id INT(11) NOT NULL,
    username VARCHAR(16) NOT NULL,
    password VARCHAR(60) NOT NULL
);

ALTER TABLE users
    ADD PRIMARY KEY (id);

ALTER TABLE users
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1;

ALTER TABLE users
    ADD COLUMN profileId INT;

ALTER TABLE users
    ADD CONSTRAINT FOREIGN KEY (profileId)
        REFERENCES profiles(id);

--SERIES TABLE

CREATE TABLE series(
    id INT(11) NOT NULL,
    name VARCHAR(64) NOT NULL,
    genreId INT,
    year INT(4) NOT NULL,
    trailer VARCHAR(255)
);

ALTER TABLE series
    ADD PRIMARY KEY (id);

ALTER TABLE series
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1;

--PROFILE TABLE
CREATE TABLE profiles(
    id INT(11) NOT NULL,
    name VARCHAR(64) NOT NULL
);

ALTER TABLE profiles
    ADD PRIMARY KEY (id);

ALTER TABLE profiles
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1;

--GENRE TABLE
CREATE TABLE genres(
    id INT(11) NOT NULL,
    name VARCHAR(64) NOT NULL
);

ALTER TABLE genres
    ADD PRIMARY KEY (id);

ALTER TABLE genres
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 1;

--USERS & SERIES ASSOCIATION
CREATE TABLE users_series(
    idUsuarios INT,
    idSeries INT,
    FOREIGN KEY (idUsuarios) REFERENCES users(id),
    FOREIGN KEY (idSeries) REFERENCES series(id)
);

--SERIES & GENRES ASSOCIATION
CREATE TABLE series_genres(
    idSeries INT,
    idGenres INT,
    FOREIGN KEY (idSeries) REFERENCES series(id),
    FOREIGN KEY (idGenres) REFERENCES genres(id)
)
    
    