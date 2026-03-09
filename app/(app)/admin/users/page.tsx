import { getAllowedEmails } from "./server";
import UsersAdminView from "./UsersAdminView";

export default async function AdminUsersPage() {
  const emails = await getAllowedEmails();
  return <UsersAdminView emails={emails} />;
}
