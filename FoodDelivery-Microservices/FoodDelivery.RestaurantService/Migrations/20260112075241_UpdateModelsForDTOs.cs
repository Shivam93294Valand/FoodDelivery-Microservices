using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodDelivery.RestaurantService.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModelsForDTOs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cuisine",
                table: "Restaurants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Restaurants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Allergens",
                table: "MenuItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Ingredients",
                table: "MenuItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "PreparationTime",
                table: "MenuItems",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Rating",
                table: "MenuItems",
                type: "decimal(3,2)",
                precision: 3,
                scale: 2,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cuisine",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Restaurants");

            migrationBuilder.DropColumn(
                name: "Allergens",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "Ingredients",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "PreparationTime",
                table: "MenuItems");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "MenuItems");
        }
    }
}
