# Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from erpnext.stock.report.stock_balance.stock_balance import execute as stock_balance_execute

# Columns to remove (by fieldname)
REMOVE_COLUMNS = {
    "bal_val",       # Balance Value
    "opening_qty",   # Opening Qty
    "opening_val",   # Opening Value
    "in_qty",        # In Qty
    "in_val",        # In Value
    "out_qty",       # Out Qty
    "out_val",       # Out Value
    "val_rate",      # Valuation Rate
    "company",       # Company
}


def execute(filters=None):
    filters = frappe._dict(filters or {})

    # Core Stock Balance returns (columns, data)
    columns, data = stock_balance_execute(filters)

    columns = [
        c for c in columns
        if not (isinstance(c, dict) and c.get("fieldname") in REMOVE_COLUMNS)
    ]

    return columns, data