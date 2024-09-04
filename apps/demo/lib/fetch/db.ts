"use server";
import { db } from "../appwrite";
import { ID } from "node-appwrite";

export const createDocument = async (collection: string, data: any) => {
  const response = await db.createDocument('webapp', collection, ID.unique(), data);

  return response;
};