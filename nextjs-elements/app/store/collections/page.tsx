import { redirect } from "next/navigation";
import data from "../catalog.json";

export default function CollectionsPage() {
  redirect(`/store/collections/${data.collections[0].id}`);
}
