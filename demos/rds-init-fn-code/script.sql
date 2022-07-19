-- Your SQL scripts for initialization goes here...

CREATE TABLE Persons (
    PersonID int,
    LastName varchar(255),
    FirstName varchar(255),
    Address varchar(255),
    City varchar(255)
);

INSERT INTO Persons (PersonID, LastName, FirstName, Address, City)
VALUES (1, 'Tom B. Erichsen', 'Skagen 21', '4006', 'Norway');

INSERT INTO Persons (PersonID, LastName, FirstName, Address, City)
VALUES (2, 'Erichsen', 'Tammy', '1025', 'Sweden');


SELECT * FROM Persons;