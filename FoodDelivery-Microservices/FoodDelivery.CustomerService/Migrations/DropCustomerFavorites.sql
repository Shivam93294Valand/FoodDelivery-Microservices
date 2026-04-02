-- Migration: Drop CustomerFavorites table
-- Date: February 15, 2026
-- Description: Remove favorites feature from the system

USE FoodDeliveryCustomerDB;
GO

-- Drop CustomerFavorites table if exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'CustomerFavorites')
BEGIN
    -- Drop indexes first
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CustomerFavorites_CustomerId' AND object_id = OBJECT_ID('CustomerFavorites'))
        DROP INDEX IX_CustomerFavorites_CustomerId ON CustomerFavorites;
    
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CustomerFavorites_RestaurantId' AND object_id = OBJECT_ID('CustomerFavorites'))
        DROP INDEX IX_CustomerFavorites_RestaurantId ON CustomerFavorites;
    
    IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_CustomerFavorites_MenuItemId' AND object_id = OBJECT_ID('CustomerFavorites'))
        DROP INDEX IX_CustomerFavorites_MenuItemId ON CustomerFavorites;
    
    -- Drop the table
    DROP TABLE CustomerFavorites;
    
    PRINT 'CustomerFavorites table dropped successfully';
END
ELSE
BEGIN
    PRINT 'CustomerFavorites table does not exist';
END
GO
