// Copyright (c) 2026, Quantbit Technology Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.provide("erpnext.utils");

const CORE_REPORT = "Accounts Payable";
const THIS_REPORT = "Accounts Payable Report";

// Load the core report's JS once, so its filters can be reused
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

// Reuse every core filter, changing only Party (MultiSelectList -> Dynamic Link)
const filters = (core.filters || []).map((f) => {
	if (f.fieldname === "party") {
		return {
			fieldname: "party",
			label: __("Party"),
			fieldtype: "Dynamic Link", // single select
			options: "party_type",
		};
	}
	return f;
});

frappe.query_reports[THIS_REPORT] = {
	filters: filters,
	formatter: core.formatter,

	onload: function (report) {
		if (frappe.boot.sysdefaults.default_ageing_range) {
			report.set_filter_value("range", frappe.boot.sysdefaults.default_ageing_range);
		}
	},
};

// Accounting dimension filters for this report
erpnext.utils.add_dimensions(THIS_REPORT, 10);