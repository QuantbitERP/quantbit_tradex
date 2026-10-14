# Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from erpnext.accounts.report.accounts_receivable.accounts_receivable import (
    execute as accounts_receivable_execute,
)


# Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
# For license information, please see license.txt

import frappe
from erpnext.accounts.report.accounts_receivable.accounts_receivable import (
    ReceivablePayableReport,
)


def execute(filters=None):
    filters = frappe._dict(filters or {})

    # Core report expects `party` as a list. Single select gives a string, so wrap it.
    party = filters.get("party")
    if party and isinstance(party, str):
        filters.party = [party]

    args = {
        "account_type": "Payable",
        "naming_by": ["Buying Settings", "supp_master_name"],
    }

    columns, data, message, chart, report_summary, skip_total_row = ReceivablePayableReport(filters).run(args)

    # Remove Cost Center column
    columns = [c for c in columns if c.get("fieldname") != "cost_center"]

    return columns, data, message, chart, report_summary, skip_total_row