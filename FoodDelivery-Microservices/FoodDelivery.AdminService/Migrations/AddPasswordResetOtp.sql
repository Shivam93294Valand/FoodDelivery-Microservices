-- Migration: Add PasswordResetOtps table
-- Run this script in your SQL Server database

CREATE TABLE [dbo].[PasswordResetOtps](
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Email] NVARCHAR(255) NOT NULL,
    [Otp] NVARCHAR(6) NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [ExpiresAt] DATETIME2 NOT NULL,
    [IsUsed] BIT NOT NULL DEFAULT 0,
    INDEX IX_PasswordResetOtps_Email ([Email]),
    INDEX IX_PasswordResetOtps_ExpiresAt ([ExpiresAt])
);
GO
