import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

export default async function AddTransactionPage({ searchParams }) {
  const accounts = await getUserAccounts();
  const params = await searchParams; // <-- Await here
  const editId = params?.edit;

  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className="w-full px-0">
      <div className="flex justify-center md:justify-normal mb-8 w-full">
        <h1
          className="w-full mx-100"
          style={{
            fontSize: "6rem",
            fontWeight: 700,
            fontFamily: "Playfair Display, Montserrat, serif",
            background: "linear-gradient(90deg, #3b82f6, #9333ea)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Add Transaction
        </h1>
      </div>
      <div className="max-w-3xl mx-auto">
        <AddTransactionForm
          accounts={accounts}
          categories={defaultCategories}
          editMode={!!editId}
          initialData={initialData}
        />
      </div>
    </div>
  );
}