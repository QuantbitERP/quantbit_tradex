import frappe
from frappe.desk.query_report import run
from frappe.utils import flt
from frappe.utils import today

@frappe.whitelist()
def get_warehouse_stock_on_date(item_code, posting_date, company):
    if not item_code or not posting_date or not company:
        return []

    current_date = today()
    filters = {
        "company": company,
        "item_code": [item_code],
        "from_date": current_date,
        "to_date": current_date,
    }

    report_result = run(
        "Stock Balance",
        filters=filters,
        ignore_prepared_report=True,
    )

    result = report_result.get("result") or []
    warehouses = []

    # Qty of this item in Pick Lists with status "Open", grouped by warehouse
    pick_rows = frappe.db.sql(
        """
        SELECT pli.warehouse, SUM(pli.stock_qty) AS pick_qty
        FROM `tabPick List Item` pli
        INNER JOIN `tabPick List` pl ON pl.name = pli.parent
        WHERE pl.status = 'Open'
            AND pl.docstatus < 2
            AND pl.company = %s
            AND pli.item_code = %s
        GROUP BY pli.warehouse
        """,
        (company, item_code),
        as_dict=True,
    )
    pick_map = {r.warehouse: flt(r.pick_qty) for r in pick_rows if r.warehouse}

    for row in result:
        if not isinstance(row, dict):
            continue

        if row.get("item_code") != item_code:
            continue

        warehouse = row.get("warehouse")
        if not warehouse:
            continue
            
        balance_qty = flt(
            row.get("bal_qty", row.get("balance_qty", 0))
        )

        if balance_qty > 0:
            pick_qty = flt(pick_map.get(warehouse, 0))
            warehouses.append({
                "warehouse": warehouse,
                "balance_qty": balance_qty,
                "pick_qty": pick_qty,
                "available_qty": balance_qty - pick_qty,
            })

    return warehouses