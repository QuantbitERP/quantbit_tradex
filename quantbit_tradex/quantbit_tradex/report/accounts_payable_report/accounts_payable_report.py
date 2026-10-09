# Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from erpnext.accounts.report.accounts_receivable.accounts_receivable import (
    execute as accounts_receivable_execute,
)


def execute(filters=None):
    filters = frappe._dict(filters or {})

    # Core report expects `party` as a list. Single select gives a string, so wrap it.
    party = filters.get("party")
    if party and isinstance(party, str):
        filters.party = [party]

    # Needed so the core report fills the Sales Person column
    filters.show_sales_person = 1

    # Core execute returns 6 values
    columns, data, message, chart, report_summary, skip_total_row = accounts_receivable_execute(filters)

    # Remove Cost Center column
    columns = [c for c in columns if c.get("fieldname") != "cost_center"]

    # Add Sales Person column only if the core report did not already add it
    # if not any(c.get("fieldname") == "sales_person" for c in columns):
    #     columns.append({
    #         "label": "Sales Person",
    #         "fieldname": "sales_person",
    #         "fieldtype": "Data",
    #         "width": 150,
    #     })

    return columns, data, message, chart, report_summary, skip_total_row