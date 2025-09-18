"use server";

import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Serialize accounts before sending to client
    const serializedAccounts = accounts.map(serializeTransaction);

    return serializedAccounts;
  } catch (error) {
    console.error(error.message);
  }
}

export async function createAccount(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Convert balance to float before saving
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // Check if this is the user's first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    // If it's the first account, make it default regardless of user input
    // If not, use the user's preference
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // If this account should be default, unset other default accounts
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new account
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault, // Override the isDefault based on our logic
      },
    });

    // Serialize the account before returning
    const serializedAccount = serializeTransaction(account);

    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}


// CREATE TRANSACTION
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Find user
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) throw new Error("User not found");

    // Validate accountId
    const account = await db.account.findUnique({
      where: { id: data.accountId },
    });
    if (!account || account.userId !== user.id) {
      throw new Error("Invalid account");
    }

    // Prepare transaction data
    const transactionData = {
      ...data,
      userId: user.id,
    };

    console.log("[createTransaction] Creating transaction with data:", transactionData);

    const created = await db.transaction.create({
      data: transactionData,
    });

    console.log("[createTransaction] Created transaction:", created);

    // Serialize before returning
    const serialized = serializeTransaction(created);
    return { success: true, data: serialized };
  } catch (error) {
    console.error("[createTransaction] Error:", error);
    return { success: false, error: error.message };
  }
}

// UPDATE TRANSACTION
export async function updateTransaction(id, data) {
  try {
    const updated = await db.transaction.update({
      where: { id },
      data,
    });
    // Serialize before returning
    const serialized = serializeTransaction(updated);
    return { success: true, data: serialized };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getTransaction(id) {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id },
    });
    return transaction;
  } catch (error) {
    return null;
  }
}

export async function scanReceipt(file) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  let imageBase64;
  if (file instanceof Buffer) {
    imageBase64 = file.toString("base64");
  } else if (typeof file === "string") {
    imageBase64 = file; // Assume already base64
  } else if (file && file.arrayBuffer) {
    const buffer = Buffer.from(await file.arrayBuffer());
    imageBase64 = buffer.toString("base64");
  } else {
    throw new Error("Unsupported file type for receipt scan.");
  }

  // Use the correct Gemini API call
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const result = await model.generateContent([
    { text: "Extract the amount, date, description, and category from this receipt image." },
    { inlineData: { data: imageBase64, mimeType: "image/png" } }
  ]);

  const response = await result.response;
  const text = response.text();

  // You will need to parse the text response to extract structured data
  // For now, just return the raw text
  return { raw: text };
}