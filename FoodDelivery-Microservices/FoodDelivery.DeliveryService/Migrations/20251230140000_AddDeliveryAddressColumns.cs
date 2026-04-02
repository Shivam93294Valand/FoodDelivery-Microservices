using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodDelivery.DeliveryService.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryAddressColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PickupAddress",
                table: "Deliveries",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryAddress",
                table: "Deliveries",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EstimatedDeliveryTime",
                table: "Deliveries",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PickupAddress",
                table: "Deliveries");

            migrationBuilder.DropColumn(
                name: "DeliveryAddress",
                table: "Deliveries");

            migrationBuilder.DropColumn(
                name: "EstimatedDeliveryTime",
                table: "Deliveries");
        }
    }
}
