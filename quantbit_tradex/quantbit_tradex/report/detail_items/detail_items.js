// Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.query_reports["Detail Items"] = {
    filters: [
        {
            fieldname: "item",
            label: __("Item"),
            fieldtype: "Link",
            options: "Item",
        },
    ],
};
