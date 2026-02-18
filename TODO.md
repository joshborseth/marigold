# Marigold TODO

A comprehensive list of tasks, improvements, and features to implement in the Marigold POS/Inventory Management system.

### Frontend State Conventions

- Use React Context for state that is consumed across multiple sibling branches or 2+ component levels (for example, POS order/checkout/device state).
- Keep one-hop props for purely presentational values and leaf-only behavior.
- Keep auth/session access as direct `authClient.useSession()` reads unless a concrete cross-tree pain point emerges.
- Keep contexts domain-scoped (`POSContext`, `InventoryContext`) and avoid a single global app state bucket.

### Inventory Management

- [ ] **Bulk import/export** - CSV import/export for inventory items
- [ ] **Advanced search & filtering** - Search by title, SKU, category, tags, status, price range
- [ ] **Barcode generation** - Generate barcodes for items and print labels
- [ ] **Bulk operations** - Bulk edit, bulk status change, bulk delete
- [ ] **Inventory history** - Track changes to items (price changes, quantity adjustments)
- [ ] **Category management** - Dynamic category management (currently hardcoded to "Clothing")
- [ ] **Tag management** - Better tag UI with autocomplete and tag suggestions

### Sales & Reporting

- [ ] **Sales reports** - Detailed sales reports with date ranges, filtering, and export
- [ ] **Profit analysis** - Profit margins, trends, and analytics
- [ ] **Sales by category** - Breakdown of sales by category
- [ ] **Revenue charts** - Visual charts and graphs for revenue trends
- [ ] **Export sales data** - CSV/PDF export of sales data
- [ ] **Sales search** - Search and filter sales records

### POS Features

- [ ] **Discounts & coupons** - Apply discounts and promotional codes
- [ ] **Split payments** - Support for split payment methods
- [ ] **Hold orders** - Save orders for later completion
- [ ] **Order history** - View past orders and transactions
- [ ] **Quick items** - Favorite/frequently used items for quick add
- [ ] **Price override** - Allow manual price override at checkout

### User Experience

- [ ] **Loading states** - Better loading indicators throughout the app
- [ ] **Empty states** - Improved empty states with helpful actions
- [ ] **Error boundaries** - React error boundaries for better error handling d
- [ ] **Mobile responsiveness** - Ensure all pages work well on mobile devices

### Integrations

- [ ] **Additional payment providers** - Support for Stripe, PayPal, etc.
- [ ] **E-commerce integration** - Sync inventory with e-commerce platforms
- [ ] **Accounting software** - Integration with QuickBooks, Xero, etc.
- [ ] **Email service** - Send receipts, reports via email
- [ ] **SMS notifications** - SMS alerts for low stock, sales, etc.

### Advanced Features

- [ ] **Multi-location support** - Support for multiple store locations
- [ ] **Multi-user roles** - Admin, manager, cashier roles with permissions
- [ ] **Multi-currency support** - Support for multiple currencies (currently hardcoded to CAD)
- [ ] **Inventory transfers** - Transfer inventory between locations
- [ ] **Vendor management** - Manage vendors and supplier information

### 🐛 Bug Fixes & Issues

- [ ] **SKU generation** - SKU is auto-generated but `sku` is optional in createItem args (line 55 in inventory.ts)
- [ ] **Currency hardcoding** - Currency is hardcoded to CAD in square.ts (line 210)
- [ ] **Missing error handling** - Some mutations don't have proper error handling
- [ ] **Webhook retry logic** - No retry logic for failed webhook processing

### JOSH'S IMPORTANT THINGS TODO (in order)

- [ ] **Refactor yucky device selection logic**
- [ ] **Refactor checkout states to useContext**
- [x] **Go to production!**
- [x] **CI/CD** - Set up continuous integration and deployment
- [ ] **Record sales after successful checkout** - When a Square Terminal checkout completes, automatically create a sale record in the `sales` table
- [ ] **Refactor state mangagement to not need delay on checkout dialog close**
- [ ] **Analytics** - Add analytics for user behavior
- [ ] **Prevent overselling** - Check inventory quantity before allowing checkout

### JOSH'S LESS IMPORTANT THINGS TODO

- [ ] **Turn on react compiler**
- [ ] **Update inventory quantities after sale** - Decrease item quantity when a sale is completed
- [ ] **Refund functionality** - Ability to process refunds through Square Terminal
- [ ] **Tax calculation** - Support for tax calculation and display
- [ ] **SKU uniqueness validation** - Ensure SKUs are unique per user (currently auto-generated but no validation)
- [ ] **Transaction rollback** - If sale recording fails after payment, handle rollback appropriately
- [ ] **Unit tests** - Add unit tests for utility functions and hooks
- [ ] **Integration tests** - Test Convex functions and API endpoints
- [ ] **E2E tests** - End-to-end tests for critical user flows
- [ ] **Test coverage** - Set up test coverage reporting
- [ ] **Error tracking** - Set up error tracking (e.g., Sentry)
- [ ] **Logging service** - Proper logging service instead of console.logs
