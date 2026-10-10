// Wrapped in an IIFE so constants don't clash with the other Sales Order script.
(function () {
    const SUMMARY_METHOD =
        "quantbit_bombay_enterprises.quantbit_bombay_enterprises.public.python.sales_order_stock_summary.get_stock_for_items";

    frappe.ui.form.on("Sales Order", {
        custom_view_stock_balance(frm) {
            render_all_items_stock(frm);
        }
    });
    function set_html(frm, html) {
        const field = frm.fields_dict.custom_html_preview;
        if (field && field.$wrapper) {
            field.$wrapper.html(html);
        }
    }

    function render_all_items_stock(frm) {
        if (!frm.doc.company) {
            set_html(frm, `<div class="text-muted" style="padding:8px">Please select a Company.</div>`);
            return;
        }

        // Unique items with total required qty
        const required = {};
        (frm.doc.items || []).forEach(row => {
            if (!row.item_code) return;
            required[row.item_code] =
                (required[row.item_code] || 0) + flt(row.qty);
        });

        const item_codes = Object.keys(required);

        if (!item_codes.length) {
            set_html(frm, `<div class="text-muted" style="padding:8px">Add at least one Item to view stock.</div>`);
            return;
        }

        const target_date =
            frm.doc.transaction_date || frappe.datetime.get_today();
        const company = frm.doc.company;

        set_html(frm, `
            <div class="text-muted" style="padding:8px">
                <i class="fa fa-spinner fa-spin"></i> Loading warehouse stock...
            </div>
        `);

        frappe.call({
            method: SUMMARY_METHOD,
            args: {
                item_codes: item_codes,
                posting_date: target_date,
                company: company
            },
            callback(r) {
                if (r.exc) {
                    set_html(frm, `<div class="text-danger" style="padding:8px">Unable to load stock. Check the server error log.</div>`);
                    return;
                }

                const data = r.message || {};
                let html = "";

                item_codes.forEach(item_code => {
                    const required_qty = flt(required[item_code]);
                    const warehouses = data[item_code] || [];
                    const total_available = warehouses.reduce(
                        (sum, w) => sum + flt(w.available_qty), 0
                    );

                    let body = "";

                    if (!warehouses.length) {
                        body = `
                            <tr>
                                <td colspan="2" class="text-muted" style="padding:8px 10px">
                                    No positive warehouse balance on
                                    ${frappe.utils.escape_html(target_date)}.
                                </td>
                            </tr>`;
                    } else {
                        warehouses.forEach(w => {
                            const qty = flt(w.available_qty);
                            // Yellow: below required qty, Green: meets or exceeds
                            const style = qty < required_qty
                                ? "background-color:#fff3cd;color:#856404;"
                                : "background-color:#d4edda;color:#155724;";

                            body += `
                                <tr style="${style}">
                                    <td style="padding:8px 10px;border-bottom:1px solid var(--border-color);">
                                        ${frappe.utils.escape_html(w.warehouse)}
                                    </td>
                                    <td style="padding:8px 10px;text-align:right;font-weight:600;border-bottom:1px solid var(--border-color);">
                                        ${format_number(qty, null, 2)}
                                    </td>
                                </tr>`;
                        });
                    }

                    html += `
                        <div style="border:1px solid var(--border-color);border-radius:6px;overflow:hidden;margin:8px 0;">
                            <div style="padding:8px 10px;background:var(--control-bg);font-weight:600;display:flex;justify-content:space-between;">
                                <span>${frappe.utils.escape_html(item_code)}</span>
                                <span class="text-muted" style="font-weight:400;">
                                    Required: ${format_number(required_qty, null, 2)}
                                    | Total Available: ${format_number(total_available, null, 2)}
                                </span>
                            </div>
                            <table class="table table-sm" style="width:100%;margin:0;font-size:12px;">
                                <thead>
                                    <tr>
                                        <th style="padding:8px 10px">Warehouse</th>
                                        <th style="padding:8px 10px;text-align:right;">Available Qty</th>
                                    </tr>
                                </thead>
                                <tbody>${body}</tbody>
                            </table>
                        </div>`;
                });

                set_html(frm, html);
            }
        });
    }
})();