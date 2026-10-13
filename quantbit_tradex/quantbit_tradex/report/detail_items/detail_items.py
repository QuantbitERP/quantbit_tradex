# Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from frappe.utils import strip_html


def execute(filters=None):
    filters = filters or {}
    return get_columns(), get_data(filters)


def get_columns():
    return [
        {"label": "Item Name", "fieldname": "item_name", "fieldtype": "Data", "width": 200},
        {"label": "UOM", "fieldname": "stock_uom", "fieldtype": "Link", "options": "UOM", "width": 90},
        {"label": "Part No", "fieldname": "custom_part_number", "fieldtype": "Data", "width": 120},
        {"label": "Item Description", "fieldname": "description", "fieldtype": "Data", "width": 280},
        {"label": "Weight Per Unit", "fieldname": "weight_per_unit", "fieldtype": "Float", "width": 120},
        {"label": "Max Discount (%)", "fieldname": "max_discount", "fieldtype": "Float", "width": 120},
        {"label": "Minimum Order Qty", "fieldname": "min_order_qty", "fieldtype": "Float", "width": 130},
        {"label": "Lead Days", "fieldname": "lead_time_days", "fieldtype": "Int", "width": 90},
        {"label": "HSN Code", "fieldname": "gst_hsn_code", "fieldtype": "Data", "width": 110},
    ]


def get_data(filters):
    conditions = {}
    if filters.get("item"):
        conditions["name"] = filters.get("item")

    items = frappe.get_all(
        "Item",
        filters=conditions,
        fields=[
            "item_name",
            "stock_uom",
            "custom_part_number",
            "description",
            "weight_per_unit",
            "max_discount",
            "min_order_qty",
            "lead_time_days",
            "gst_hsn_code",
        ],
        order_by="item_name asc",
    )

    for row in items:
        # description is a Text Editor field (HTML) - show plain text
        row["description"] = strip_html(row.get("description") or "").strip()

    return items