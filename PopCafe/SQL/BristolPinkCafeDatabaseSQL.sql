
-- ==========================================
-- PINK CAFE DATABASE
-- Coffee and Croissant Sales (March - October 2025)
-- ==========================================


-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS Pink_Cafe;

USE Pink_Cafe;


-- 2. CREATE COFFEE SALES TABLE
CREATE TABLE IF NOT EXISTS CoffeeSales (
    Date DATE PRIMARY KEY,
    Cappuccino INT,
    Americano INT,
    Espresso INT,
    Mocha INT
);


-- 3. CREATE CROISSANT SALES TABLE
CREATE TABLE IF NOT EXISTS CroissantSales (
    Date DATE PRIMARY KEY,
    Croissant INT,
    Pain_aux_raisins INT,
    Salmon_salad_bagel INT,
    New_Yorker_bagel INT
);


-- 4. CREATE TEMPORARY COFFEE IMPORT TABLE
CREATE TABLE IF NOT EXISTS CoffeeSales_Import (
    DateText VARCHAR(20),
    Cappuccino INT,
    Americano INT,
    Espresso INT,
    Mocha INT
);


-- 5. CREATE TEMPORARY CROISSANT IMPORT TABLE
CREATE TABLE IF NOT EXISTS CroissantSales_Import (
    DateText VARCHAR(20),
    Croissant INT,
    Pain_aux_raisins INT,
    Salmon_salad_bagel INT,
    New_Yorker_bagel INT
);


-- 6. CHECK DATABASE TABLES
SHOW TABLES;


-- 7. CHECK IMPORTED COFFEE DATA
SELECT COUNT(*) AS Coffee_Import_Count
FROM CoffeeSales_Import;


-- 8. TRANSFER COFFEE DATA
INSERT INTO CoffeeSales
(Date, Cappuccino, Americano, Espresso, Mocha)
SELECT
    STR_TO_DATE(DateText, '%d/%m/%Y'),
    Cappuccino,
    Americano,
    Espresso,
    Mocha
FROM CoffeeSales_Import;


-- 9. CHECK IMPORTED CROISSANT DATA
SELECT COUNT(*) AS Croissant_Import_Count
FROM CroissantSales_Import;


-- 10. TRANSFER CROISSANT DATA
INSERT INTO CroissantSales
(Date, Croissant, Pain_aux_raisins, Salmon_salad_bagel, New_Yorker_bagel)
SELECT
    STR_TO_DATE(DateText, '%d/%m/%Y'),
    Croissant,
    Pain_aux_raisins,
    Salmon_salad_bagel,
    New_Yorker_bagel
FROM CroissantSales_Import;


-- 11. VERIFY FINAL COFFEE SALES
SELECT COUNT(*) AS Total_Coffee_Records
FROM CoffeeSales;


-- 12. VERIFY FINAL CROISSANT SALES
SELECT COUNT(*) AS Total_Croissant_Records
FROM CroissantSales;


-- 13. DISPLAY COFFEE SALES
SELECT * FROM CoffeeSales;


-- 14. DISPLAY CROISSANT SALES
SELECT * FROM CroissantSales;
