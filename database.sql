CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
    password VARCHAR(255) NOT NULL
);
