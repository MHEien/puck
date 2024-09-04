import { Client, Databases } from "node-appwrite";

const client = new Client();

client
  .setEndpoint("https://appwrite.biso.no/v1")
  .setProject("biso")
  .setKey("49ad90e6436aa42843a3dad73654bca848c0d048132c4a4b68b00efb925cc3c0d288d6dcd56b7bad686d48065c58f711323476f48b64f00a0b110c686e6e61406d8fdec90eb82e61ee50b033999dcf97473a929347f4b6f89d31690a6ca942b522c8b8beaf778dd1f036b78117f0475336c068685b2bb0fbe0724f936c8cc4dc");

export const db = new Databases(client);