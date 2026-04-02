-- Seed sample addresses for existing customers
-- This is optional and for testing purposes

DECLARE @CustomerId INT = 1; -- Change this to your customer ID

-- Only insert if the customer exists and has no addresses
IF EXISTS (SELECT 1 FROM Customers WHERE CustomerId = @CustomerId) 
   AND NOT EXISTS (SELECT 1 FROM CustomerAddresses WHERE CustomerId = @CustomerId)
BEGIN
    INSERT INTO CustomerAddresses (CustomerId, AddressLine1, AddressLine2, City, State, ZipCode, Landmark, AddressType, IsDefault, Latitude, Longitude)
    VALUES 
    (@CustomerId, '123 Main St', 'Apt 4B', 'New York', 'NY', '10001', 'Near Central Park', 'Home', 1, 40.7589, -73.9851),
    (@CustomerId, '456 Office Blvd', 'Floor 12', 'New York', 'NY', '10002', 'Corner of 5th Ave', 'Work', 0, 40.7614, -73.9776);
    
    PRINT 'Sample addresses added for Customer ' + CAST(@CustomerId AS NVARCHAR(10));
END
ELSE
BEGIN
    PRINT 'Customer not found or already has addresses';
END
GO
