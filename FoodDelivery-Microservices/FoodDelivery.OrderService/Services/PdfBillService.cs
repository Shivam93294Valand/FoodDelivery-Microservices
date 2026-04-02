using FoodDelivery.OrderService.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FoodDelivery.OrderService.Services
{
    public interface IPdfService
    {
        byte[] GenerateOrderBill(Order order, string customerName, string restaurantName);
    }

    public class PdfBillService : IPdfService
    {
        public byte[] GenerateOrderBill(Order order, string customerName, string restaurantName)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header()
                        .Text($"Order Invoice #{order.OrderId}")
                        .SemiBold().FontSize(24).FontColor(Colors.Blue.Medium);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(column =>
                        {
                            column.Spacing(10);
                            column.Item().Row(row =>
                            {
                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text("Customer Details").Bold();
                                    col.Item().Text($"Name: {customerName}");
                                    col.Item().Text($"Order Date: {order.OrderDate:dd MMM yyyy HH:mm}");
                                });

                                row.RelativeItem().Column(col =>
                                {
                                    col.Item().Text("Restaurant Details").Bold();
                                    col.Item().Text($"Name: {restaurantName}");
                                    col.Item().Text($"Status: {order.OrderStatus}");
                                });
                            });

                            column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                            column.Item().Text("Order Items").Bold().FontSize(16);

                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(3);
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                    columns.RelativeColumn();
                                });

                                // Header
                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("Item").Bold();
                                    header.Cell().Element(CellStyle).Text("Quantity").Bold();
                                    header.Cell().Element(CellStyle).Text("Price").Bold();
                                    header.Cell().Element(CellStyle).Text("Total").Bold();

                                    static IContainer CellStyle(IContainer container) =>
                                        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten1).PaddingVertical(5);
                                });

                                // Items
                                foreach (var item in order.OrderItems ?? new List<OrderItem>())
                                {
                                    table.Cell().Element(CellStyle).Text(item.ItemName);
                                    table.Cell().Element(CellStyle).Text(item.Quantity.ToString());
                                    table.Cell().Element(CellStyle).Text($"${item.UnitPrice:F2}");
                                    table.Cell().Element(CellStyle).Text($"${item.TotalPrice:F2}");

                                    static IContainer CellStyle(IContainer container) =>
                                        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                                }
                            });

                            column.Item().LineHorizontal(1).LineColor(Colors.Grey.Lighten1);

                            // Total
                            column.Item().AlignRight().Text($"Total Amount: ${order.TotalAmount:F2}")
                                .Bold().FontSize(16).FontColor(Colors.Green.Medium);
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Thank you for your order! ");
                            text.Span("Generated on ").FontSize(10);
                            text.Span(DateTime.Now.ToString("dd MMM yyyy HH:mm")).FontSize(10).Italic();
                        });
                });
            });

            return document.GeneratePdf();
        }
    }
}
