(function () {
    const stockMethod =
        "quantbit_tradex.public.python.sales_order.get_warehouse_stock_on_date";

    frappe.ui.form.on("Sales Order", {
        custom_view_stock_balance: function (frm) {
            showStockBalance(frm);
        }
    });

    function showStockBalance(frm) {
        const company = frm.doc.company;
        const postingDate =
            frm.doc.transaction_date || frappe.datetime.get_today();

        if (!company) {
            frappe.msgprint("Please select a Company.");
            return;
        }

        const requiredItems = {};

        (frm.doc.items || []).forEach(function (row) {
            if (!row.item_code) return;

            if (!requiredItems[row.item_code]) {
                requiredItems[row.item_code] = {
                    item_code: row.item_code,
                    required_qty: 0
                };
            }

            requiredItems[row.item_code].required_qty += flt(row.qty);
        });

        const items = Object.values(requiredItems);

        if (!items.length) {
            frappe.msgprint("Please add at least one item.");
            return;
        }

        // Create the HTML dialog.
        const dialog = new frappe.ui.Dialog({
            title: "Warehouse Stock Balance",
            size: "large",
            fields: [
                {
                    fieldtype: "HTML",
                    fieldname: "stock_html"
                }
            ],
            primary_action_label: "Close",
            primary_action: function () {
                dialog.hide();
            }
        });

        dialog.show();

        const wrapper = dialog.fields_dict.stock_html.$wrapper;

        wrapper.html(`
            <div class="text-muted" style="padding:15px">
                <i class="fa fa-spinner fa-spin"></i>
                Loading warehouse stock...
            </div>
        `);

        const requests = items.map(function (item) {
            return new Promise(function (resolve) {
                frappe.call({
                    method: stockMethod,
                    args: {
                        item_code: item.item_code,
                        posting_date: postingDate,
                        company: company
                    },
                    callback: function (r) {
                        resolve({
                            item_code: item.item_code,
                            required_qty: item.required_qty,
                            warehouses: r.message || [],
                            error: !!r.exc
                        });
                    },
                    error: function () {
                        resolve({
                            item_code: item.item_code,
                            required_qty: item.required_qty,
                            warehouses: [],
                            error: true
                        });
                    }
                });
            });
        });

        Promise.all(requests).then(function (results) {
            // Do not display results if company or date changed.
            if (
                frm.doc.company !== company ||
                (frm.doc.transaction_date ||
                    frappe.datetime.get_today()) !== postingDate
            ) {
                dialog.hide();
                return;
            }

            let html = "";

            results.forEach(function (item) {
                let rowsHtml = "";

                if (item.error) {
                    rowsHtml = `
                        <tr>
                            <td colspan="2"
                                style="padding:8px;color:#b91c1c">
                                Unable to load stock for
                                ${frappe.utils.escape_html(item.item_code)}.
                                Please check the server error log.
                            </td>
                        </tr>
                    `;
                } else if (!item.warehouses.length) {
                    rowsHtml = `
                        <tr>
                            <td colspan="2"
                                class="text-muted"
                                style="padding:8px">
                                No positive warehouse balance found.
                            </td>
                        </tr>
                    `;
                } else {
                    item.warehouses.forEach(function (warehouse) {
                        const availableQty = flt(
                            warehouse.available_qty
                        );

                        const rowStyle =
                            availableQty < item.required_qty
                                ? "background-color:#fff3cd;color:#856404;"
                                : "background-color:#d4edda;color:#155724;";

                        rowsHtml += `
                            <tr style="${rowStyle}">
                                <td style="padding:8px 10px;
                                    border-bottom:1px solid var(--border-color)">
                                    ${frappe.utils.escape_html(
                                        warehouse.warehouse
                                    )}
                                </td>
                                <td style="padding:8px 10px;
                                    text-align:right;font-weight:600;
                                    border-bottom:1px solid var(--border-color)">
                                    ${format_number(availableQty, null, 2)}
                                </td>
                            </tr>
                        `;
                    });
                }

                html += `
                    <div style="border:1px solid var(--border-color);
                        border-radius:6px;overflow:hidden;margin:10px 0">
                        <div style="padding:8px 10px;
                            background:var(--control-bg);font-weight:600">
                            ${frappe.utils.escape_html(item.item_code)}
                            <span class="text-muted"
                                style="font-weight:normal">
                                — Required Qty:
                                ${format_number(item.required_qty, null, 2)}
                            </span>
                        </div>

                        <table class="table table-sm"
                            style="width:100%;margin:0;font-size:12px">
                            <thead>
                                <tr>
                                    <th style="padding:8px 10px">Warehouse</th>
                                    <th style="padding:8px 10px;text-align:right">
                                        Available Qty
                                    </th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                `;
            });

            wrapper.html(`
                <div>
                    <p class="text-muted">
                        Stock as of
                        ${frappe.utils.escape_html(postingDate)}
                    </p>
                    ${html}
                    <div class="text-muted" style="font-size:11px;padding:5px 0">
                        <span style="color:#856404">Yellow:</span>
                        Stock is less than required quantity.
                        &nbsp;
                        <span style="color:#155724">Green:</span>
                        Stock meets or exceeds required quantity.
                    </div>
                </div>
            `);
        });
    }
})();
