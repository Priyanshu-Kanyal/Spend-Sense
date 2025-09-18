import { inngest } from "./client";

// Register Inngest functions using inngest.createFunction
export const checkBudgetAlerts = inngest.createFunction(
	{ id: "check-budget-alerts" },
	{ event: "app/check.budget.alerts" },
	async ({ event, step }) => {
		// Add logic to check and send budget alerts
		return { status: "ok" };
	}
);

export const generateMonthlyReports = inngest.createFunction(
	{ id: "generate-monthly-reports" },
	{ event: "app/generate.monthly.reports" },
	async ({ event, step }) => {
		// Add logic to generate monthly reports
		return { status: "ok" };
	}
);

export const processRecurringTransaction = inngest.createFunction(
	{ id: "process-recurring-transaction" },
	{ event: "app/process.recurring.transaction" },
	async ({ event, step }) => {
		// Add logic to process recurring transactions
		return { status: "ok" };
	}
);

export const triggerRecurringTransactions = inngest.createFunction(
	{ id: "trigger-recurring-transactions" },
	{ event: "app/trigger.recurring.transactions" },
	async ({ event, step }) => {
		// Add logic to trigger recurring transactions
		return { status: "ok" };
	}
);
