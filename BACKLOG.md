# Future Features Backlog

This document tracks features that have been discussed, suggested, or partially built but deferred for future development.

## Purchase Orders
- **Order Fulfillment Status Badges**: Display a status badge (`PENDING`, `PARTIAL`, `COMPLETED`) next to the company name on each Purchase Order based on the ratio of delivered quantity to total ordered quantity. (Temporarily removed from UI).

## Daily Reports
- **Inline Field Validation (Red Borders)**: Implement full visual error states (red borders/text) for required fields across all data entry sections, rather than just showing a general error summary or wizard tab coloring.
- **"Copy from previous day" Button**: Add a quick action to duplicate personnel numbers and targets from the previous day's report to speed up data entry.

## UI/UX Enhancements
- **Interactive Data Charts & Visualizations**: Add interactive graphs on the Dashboard (using `recharts` or `chart.js`) to visualize Production output over time, Financial/Expense burn rate, and Inventory levels.
- **Global Command Palette (Cmd + K)**: Implement a sleek global search bar for quick navigation to specific Purchase Orders, Employee Profiles, or Modules without using the sidebar.
- **Skeleton Loading States**: Replace standard "Loading..." text with animated "skeleton" placeholders that mimic the layout of tables and cards while fetching data.
- **Toast Notifications**: Integrate beautiful animated pop-up "Toasts" (e.g., using `sonner` or `react-hot-toast`) for success and error messages when saving items.
- **Advanced Data Tables (Sort, Filter, Export)**: Upgrade main tables with clickable column headers for sorting, advanced filters, and an "Export to CSV/PDF" button.
- **Drag-and-Drop Task Board**: Convert the "Pending Tasks" module into a Kanban-style board (like Trello) with drag-and-drop support across "To Do", "In Progress", and "Done" columns.

## Advanced & System-Level Features
- **Automated PDF Generation & Invoicing**: Add a feature to instantly generate professionally formatted PDF documents for Purchase Orders, Daily Reports, and Expenses that can be downloaded, printed, or emailed directly to clients and vendors.
- **WhatsApp API Integration**: Automatically generate and send the Daily End of Day (EOD) Summary or critical alerts directly to a WhatsApp group or manager's phone at 6:00 PM every day.
- **Predictive Maintenance Alerts**: Automatically analyze machine downtime trends from Daily Reports and alert management when a specific machine needs scheduled maintenance before it breaks down.
- **Payroll & Timesheet Export**: Expand employee attendance tracking into a full timesheet module that exports directly into accounting software (like Tally or QuickBooks) for easy payroll processing.
