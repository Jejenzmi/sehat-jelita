-- This is the migration file for the initial setup

CREATE TABLE example (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX idx_example_name ON example(name);

-- Additional commands for your migration can be added here.