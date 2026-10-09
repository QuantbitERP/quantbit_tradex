// Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.provide("erpnext.utils");

const CORE_REPORT = "Stock Balance";
const THIS_REPORT = "Stock Balance Report";

// Load the core report's JS once, so its settings can be reused as they are
function get_core_report_settings() {
	if (frappe.query_reports[CORE_REPORT]) {
		return frappe.query_reports[CORE_REPORT];
	}

	const xhr = new XMLHttpRequest();
	xhr.open(
		"GET",
		"/api/method/frappe.desk.query_report.get_script?report_name=" + encodeURIComponent(CORE_REPORT),
		false // synchronous: filters must exist before this report renders
	);
	xhr.setRequestHeader("X-Frappe-CSRF-Token", frappe.csrf_token);
	xhr.send();

	if (xhr.status === 200) {
		const msg = JSON.parse(xhr.responseText).message || {};
		frappe.dom.eval(msg.script || "");
	}

	return frappe.query_reports[CORE_REPORT] || {};
}

const core = get_core_report_settings();

frappe.query_reports[THIS_REPORT] = {
	filters: core.filters || [], // all core filters, unchanged
	formatter: core.formatter,
	onload: core.onload,
};

erpnext.utils.add_inventory_dimensions(THIS_REPORT, 8);