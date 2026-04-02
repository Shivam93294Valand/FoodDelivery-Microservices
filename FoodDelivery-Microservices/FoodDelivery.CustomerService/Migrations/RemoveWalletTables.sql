-- Remove Wallet tables from Customer database
IF OBJECT_ID('dbo.WalletTransactions', 'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[WalletTransactions];
END

IF OBJECT_ID('dbo.Wallets', 'U') IS NOT NULL
BEGIN
    DROP TABLE [dbo].[Wallets];
END