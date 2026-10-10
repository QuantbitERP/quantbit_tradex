import json
import frappe
from frappe.desk.query_report import run
from frappe.utils import flt


@frappe.whitelist()
def get_stock_for_items(item_codes, posting_date, company):
    """Return positive warehouse balances for many items in a single report run.

    Output: {item_code: [{"warehouse": ..., "available_qty": ...}, ...]}
    """
    if isinstance(item_codes, str):
        item_codes = json.loads(item_codes)

    item_codes = list({code for code in (item_codes or []) if code})

    if not item_codes or not posting_date or not company:
        return {}

    report_result = run(
        "Stock Balance",
        filters={
            "company": company,
            "item_code": item_codes,
            "from_date": posting_date,
            "to_date": posting_date,
        },
        ignore_prepared_report=True,
    )

    result = report_result.get("result") or []
    stock = {code: [] for code in item_codes}

    for row in result:
        if not isinstance(row, dict):
            continue

        item_code = row.get("item_code")
        warehouse = row.get("warehouse")

        if item_code not in stock or not warehouse:
            continue

        available_qty = flt(row.get("bal_qty", row.get("balance_qty", 0)))

        if available_qty > 0:
            stock[item_code].append({
                "warehouse": warehouse,
                "available_qty": available_qty,
            })

    return stock